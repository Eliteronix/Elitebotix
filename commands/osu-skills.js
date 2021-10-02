const Discord = require('discord.js');
const osu = require('node-osu');
const { CanvasRenderService } = require('chartjs-node-canvas');
const { DBOsuMultiScores, DBDiscordUsers } = require('../dbObjects');
const { getGuildPrefix, getOsuUserServerMode, getIDFromPotentialOsuLink, getMessageUserDisplayname, populateMsgFromInteraction, getOsuBeatmap, getMods } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-skills',
	// aliases: ['os', 'o-s'],
	description: 'Sends an info card about the skills of the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces; Use --scaled to scale by totalEvaluation (better for mods); Use --vx/--v1 to change scoring type filter; Use --tourney to filter by tourney matches only)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.ATTACH_FILES,
	botPermissionsTranslated: 'Attach Files',
	//guildOnly: true,
	// args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Players are being processed');

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'scaled') {
						if (interaction.options._hoistedOptions[i].value) {
							args.push('--scaled');
						}
					} else if (interaction.options._hoistedOptions[i].name === 'tourney') {
						if (interaction.options._hoistedOptions[i].value) {
							args.push('--tourney');
						}
					} else if (interaction.options._hoistedOptions[i].name === 'runningaverage') {
						if (interaction.options._hoistedOptions[i].value) {
							args.push('--runningavg');
						}
					} else {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}
		}
		const guildPrefix = await getGuildPrefix(msg);

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];

		let scaled = false;
		let scoringType = 'vx';
		let tourneyMatch = false;
		let runningAverage = false;
		for (let i = 0; i < args.length; i++) {
			if (args[i].toLowerCase().startsWith('--scaled')) {
				scaled = true;
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--v2')) {
				scoringType = 'v2';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--v1')) {
				scoringType = 'v1';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--tourney')) {
				tourneyMatch = true;
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--vx')) {
				scoringType = 'vx';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--runningavg')) {
				runningAverage = true;
				args.splice(i, 1);
				i--;
			}
		}

		if (!args[0]) {//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				getOsuSkills(msg, args, commandUser.osuUserId, scaled, scoringType, tourneyMatch, runningAverage);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getOsuSkills(msg, args, userDisplayName, scaled, scoringType, tourneyMatch, runningAverage);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getOsuSkills(msg, args, discordUser.osuUserId, scaled, scoringType, tourneyMatch, runningAverage);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
						getOsuSkills(msg, args, args[i], scaled, scoringType, tourneyMatch, runningAverage);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getOsuSkills(msg, args, getIDFromPotentialOsuLink(args[i]), scaled, scoringType, tourneyMatch, runningAverage);
						} else {
							getOsuSkills(msg, args, getIDFromPotentialOsuLink(args[i]), scaled, scoringType, tourneyMatch, runningAverage);
						}
					} else {
						getOsuSkills(msg, args, getIDFromPotentialOsuLink(args[i]), scaled, scoringType, tourneyMatch, runningAverage);
					}
				}
			}
		}
	},
};

async function getOsuSkills(msg, args, username, scaled, scoringType, tourneyMatch, runningAverage) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	osuApi.getUser({ u: username })
		.then(async (user) => {
			let processingMessage = await msg.channel.send(`[${user.name}] Processing...`);

			const topScores = await osuApi.getUserBest({ u: user.name, m: 0, limit: 100 });

			console.log(topScores);

			let mods = [];
			let mappers = [];
			for (let i = 0; i < topScores.length; i++) {
				//Add and count mods
				let modAdded = false;
				for (let j = 0; j < mods.length && !modAdded; j++) {
					if (mods[j].bits === topScores[i].raw_mods) {
						mods[j].amount++;
						modAdded = true;
					}
				}

				if (!modAdded) {
					const modObject = {
						bits: topScores[i].raw_mods,
						modsReadable: getMods(topScores[i].raw_mods).join(''),
						amount: 1
					};

					if (!modObject.modsReadable) {
						modObject.modsReadable = 'NM';
					}

					mods.push(modObject);
				}

				//Add and count mappers
				let mapperAdded = false;
				const dbBeatmap = await getOsuBeatmap(topScores[i].beatmapId, topScores[i].raw_mods);
				for (let j = 0; j < mappers.length && !mapperAdded; j++) {
					if (mappers[j].mapper === dbBeatmap.mapper) {
						mappers[j].amount++;
						mapperAdded = true;
					}
				}

				if (!mapperAdded) {
					mappers.push({
						mapper: dbBeatmap.mapper,
						amount: 1
					});
				}
			}

			quicksortAmount(mods);
			quicksortAmount(mappers);

			console.log(mods);
			console.log(mappers);

			const width = 1500; //px
			const height = 750; //px
			const canvasRenderService = new CanvasRenderService(width, height);

			(async () => {
				const userScores = await DBOsuMultiScores.findAll({
					where: { osuUserId: user.id }
				});

				if (!userScores.length) {
					return processingMessage.edit(`No multi-scores found in the database for ${user.name}.`);
				}

				let oldestDate = new Date();

				oldestDate.setUTCDate(1);
				oldestDate.setUTCHours(0);
				oldestDate.setUTCMinutes(0);

				let matchesPlayed = [];
				quicksort(userScores);
				userScores.forEach(score => {
					if (oldestDate > score.matchStartDate) {
						oldestDate.setUTCFullYear(score.matchStartDate.getUTCFullYear());
						oldestDate.setUTCMonth(score.matchStartDate.getUTCMonth());
					}
				});

				const rawModsData = [];
				const labels = [];
				//Get the base data which is gonna be added up later
				for (let now = new Date(); oldestDate < now; oldestDate.setUTCMonth(oldestDate.getUTCMonth() + 1)) {
					let rawModsDataObject = {
						label: `${(oldestDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${oldestDate.getUTCFullYear()}`,
						totalEvaluation: 0,
						totalCount: 0,
						NMEvaluation: 0,
						NMCount: 0,
						HDEvaluation: 0,
						HDCount: 0,
						HREvaluation: 0,
						HRCount: 0,
						DTEvaluation: 0,
						DTCount: 0,
						FMEvaluation: 0,
						FMCount: 0
					};
					labels.push(rawModsDataObject.label);
					rawModsData.push(rawModsDataObject);
				}

				let uncompletedMonths = [];
				let runningAverageAmount = 75;
				for (let i = 0; i < userScores.length; i++) {
					//Filter out rounds which don't fit the restrictions
					if (scoringType === 'v2' && userScores[i].scoringType !== 'Score v2') {
						continue;
					}
					if (scoringType === 'v1' && userScores[i].scoringType !== 'Score') {
						continue;
					}
					if (tourneyMatch && !userScores[i].tourneyMatch) {
						continue;
					}

					//Push matches for the history txt
					if (!matchesPlayed.includes(`${(userScores[i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${userScores[i].matchStartDate.getUTCFullYear()} - ${userScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${userScores[i].matchId}`)) {
						matchesPlayed.push(`${(userScores[i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${userScores[i].matchStartDate.getUTCFullYear()} - ${userScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${userScores[i].matchId}`);
					}

					for (let j = 0; j < rawModsData.length; j++) {
						if (rawModsData[j].label === `${(userScores[i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${userScores[i].matchStartDate.getUTCFullYear()}`) {
							rawModsData[j].totalEvaluation += parseFloat(userScores[i].evaluation);
							rawModsData[j].totalCount++;

							const sameGameScores = await DBOsuMultiScores.findAll({
								where: { matchId: userScores[i].matchId, gameId: userScores[i].gameId }
							});

							for (let k = 0; k < sameGameScores.length; k++) {
								if (userScores[i].rawMods === sameGameScores[k].rawMods) {
									sameGameScores.splice(k, 1);
									k--;
								}
							}

							//Add values to Mods
							if (sameGameScores.length === 0 && userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '0' || userScores[i].gameRawMods === '1')) {
								rawModsData[j].NMEvaluation += parseFloat(userScores[i].evaluation);
								rawModsData[j].NMCount++;
							} else if (userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '8' || userScores[i].gameRawMods === '9')) {
								rawModsData[j].HDEvaluation += parseFloat(userScores[i].evaluation);
								rawModsData[j].HDCount++;
							} else if (userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '16' || userScores[i].gameRawMods === '17')) {
								rawModsData[j].HREvaluation += parseFloat(userScores[i].evaluation);
								rawModsData[j].HRCount++;
							} else if (userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '64' || userScores[i].gameRawMods === '65' || userScores[i].gameRawMods === '576' || userScores[i].gameRawMods === '577')) {
								rawModsData[j].DTEvaluation += parseFloat(userScores[i].evaluation);
								rawModsData[j].DTCount++;
							} else {
								rawModsData[j].FMEvaluation += parseFloat(userScores[i].evaluation);
								rawModsData[j].FMCount++;
							}

							//Save the maps locally
							getOsuBeatmap(userScores[i].beatmapId, userScores[i].gameRawMods);

							//add to uncompleted months for running avg
							if (runningAverage && rawModsData[j].totalCount < runningAverageAmount && !uncompletedMonths.includes(rawModsData[j])) {
								uncompletedMonths.push(rawModsData[j]);
							}

							for (let k = 0; k < uncompletedMonths.length; k++) {
								if (rawModsData[j].label !== uncompletedMonths[k].label) {

									//Add values to Mods
									if (uncompletedMonths[k].NMCount < 15 && sameGameScores.length === 0 && userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '0' || userScores[i].gameRawMods === '1')) {
										uncompletedMonths[k].NMEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].NMCount++;
										//add to total evaluation
										uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].totalCount++;
									} else if (uncompletedMonths[k].HDCount < 15 && userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '8' || userScores[i].gameRawMods === '9')) {
										uncompletedMonths[k].HDEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].HDCount++;
										//add to total evaluation
										uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].totalCount++;
									} else if (uncompletedMonths[k].HRCount < 15 && userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '16' || userScores[i].gameRawMods === '17')) {
										uncompletedMonths[k].HREvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].HRCount++;
										//add to total evaluation
										uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].totalCount++;
									} else if (uncompletedMonths[k].DTCount < 15 && userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '64' || userScores[i].gameRawMods === '65' || userScores[i].gameRawMods === '576' || userScores[i].gameRawMods === '577')) {
										uncompletedMonths[k].DTEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].DTCount++;
										//add to total evaluation
										uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].totalCount++;
									} else if (uncompletedMonths[k].FMCount < 15) {
										uncompletedMonths[k].FMEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].FMCount++;
										//add to total evaluation
										uncompletedMonths[k].totalEvaluation += parseFloat(userScores[i].evaluation);
										uncompletedMonths[k].totalCount++;
									}

									if (uncompletedMonths[k].totalCount >= runningAverageAmount
										&& uncompletedMonths[k].NMCount >= 15
										&& uncompletedMonths[k].HDCount >= 15
										&& uncompletedMonths[k].HRCount >= 15
										&& uncompletedMonths[k].DTCount >= 15
										&& uncompletedMonths[k].FMCount >= 15) {
										uncompletedMonths.splice(k, 1);
									}
								}
							}
						}
					}
				}

				const totalDatapoints = [];
				const NMDatapoints = [];
				const HDDatapoints = [];
				const HRDatapoints = [];
				const DTDatapoints = [];
				const FMDatapoints = [];
				rawModsData.forEach(rawModsDataObject => {
					let totalValue = NaN;
					if (rawModsDataObject.totalCount) {
						totalValue = rawModsDataObject.totalEvaluation / rawModsDataObject.totalCount;
					}

					let NMValue = NaN;
					if (rawModsDataObject.NMCount) {
						NMValue = rawModsDataObject.NMEvaluation / rawModsDataObject.NMCount;
						if (scaled) {
							NMValue = NMValue / totalValue;
						}
					}
					NMDatapoints.push(NMValue);

					let HDValue = NaN;
					if (rawModsDataObject.HDCount) {
						HDValue = rawModsDataObject.HDEvaluation / rawModsDataObject.HDCount;
						if (scaled) {
							HDValue = HDValue / totalValue;
						}
					}
					HDDatapoints.push(HDValue);

					let HRValue = NaN;
					if (rawModsDataObject.HRCount) {
						HRValue = rawModsDataObject.HREvaluation / rawModsDataObject.HRCount;
						if (scaled) {
							HRValue = HRValue / totalValue;
						}
					}
					HRDatapoints.push(HRValue);

					let DTValue = NaN;
					if (rawModsDataObject.DTCount) {
						DTValue = rawModsDataObject.DTEvaluation / rawModsDataObject.DTCount;
						if (scaled) {
							DTValue = DTValue / totalValue;
						}
					}
					DTDatapoints.push(DTValue);

					let FMValue = NaN;
					if (rawModsDataObject.FMCount) {
						FMValue = rawModsDataObject.FMEvaluation / rawModsDataObject.FMCount;
						if (scaled) {
							FMValue = FMValue / totalValue;
						}
					}
					FMDatapoints.push(FMValue);

					if (scaled) {
						totalValue = totalValue / totalValue;
					}
					totalDatapoints.push(totalValue);
				});

				for (let i = 0; i < totalDatapoints.length; i++) {
					if (isNaN(totalDatapoints[i])) {
						labels.splice(i, 1);
						totalDatapoints.splice(i, 1);
						NMDatapoints.splice(i, 1);
						HDDatapoints.splice(i, 1);
						HRDatapoints.splice(i, 1);
						DTDatapoints.splice(i, 1);
						FMDatapoints.splice(i, 1);
						i--;
					}
				}

				if (labels.length === 1) {
					labels.push(labels[0]);
					totalDatapoints.push(totalDatapoints[0]);
					NMDatapoints.push(NMDatapoints[0]);
					HDDatapoints.push(HDDatapoints[0]);
					HRDatapoints.push(HRDatapoints[0]);
					DTDatapoints.push(DTDatapoints[0]);
					FMDatapoints.push(FMDatapoints[0]);
				}

				const data = {
					labels: labels,
					datasets: [
						{
							label: 'Evaluation (All Mods)',
							data: totalDatapoints,
							borderColor: 'rgb(201, 203, 207)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Evaluation (NM only)',
							data: NMDatapoints,
							borderColor: 'rgb(54, 162, 235)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Evaluation (HD only)',
							data: HDDatapoints,
							borderColor: 'rgb(255, 205, 86)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Evaluation (HR only)',
							data: HRDatapoints,
							borderColor: 'rgb(255, 99, 132)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Evaluation (DT only)',
							data: DTDatapoints,
							borderColor: 'rgb(153, 102, 255)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Evaluation (FM only)',
							data: FMDatapoints,
							borderColor: 'rgb(75, 192, 192)',
							fill: false,
							tension: 0.4
						}
					]
				};

				const configuration = {
					type: 'line',
					data: data,
					options: {
						spanGaps: true,
						responsive: true,
						plugins: {
							title: {
								display: true,
								text: 'Elitebotix Evaluation for submitted matches',
								color: '#FFFFFF',
							},
							legend: {
								labels: {
									color: '#FFFFFF',
								}
							},
						},
						interaction: {
							intersect: false,
						},
						scales: {
							x: {
								display: true,
								title: {
									display: true,
									text: 'Month',
									color: '#FFFFFF'
								},
								grid: {
									color: '#8F8F8F'
								},
								ticks: {
									color: '#FFFFFF',
								},
							},
							y: {
								display: true,
								title: {
									display: true,
									text: 'Evaluation value',
									color: '#FFFFFF'
								},
								grid: {
									color: '#8F8F8F'
								},
								ticks: {
									color: '#FFFFFF',
								},
								suggestedMin: 0,
								suggestedMax: 1.5
							}
						}
					},
				};

				const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

				const attachment = new Discord.MessageAttachment(imageBuffer, `osu-skills-${user.id}.png`);

				await processingMessage.delete();

				let scaledText = '';
				if (scaled) {
					scaledText = ' (Scaled by total evaluation)';
				}

				let tourneyMatchText = 'Casual & Tourney matches';
				if (tourneyMatch) {
					tourneyMatchText = 'Tourney matches only';
				}

				let runningAverageText = '';
				if (runningAverage) {
					runningAverageText = ' (Running Average of at least 15 maps per mod per month)';
				}

				// eslint-disable-next-line no-undef
				matchesPlayed = new Discord.MessageAttachment(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), `multi-matches-${user.id}.txt`);
				msg.channel.send({ content: `[Beta/WIP] Modpool evaluation development for ${user.name} (Score ${scoringType}; ${tourneyMatchText})${scaledText}${runningAverageText}`, files: [attachment, matchesPlayed] });
			})();
		})
		.catch(err => {
			if (err.message === 'Not found') {
				msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces)`);
			} else {
				console.log(err);
			}
		});
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].matchId) >= parseFloat(pivot.matchId)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}

function partitionAmount(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].amount) >= parseFloat(pivot.amount)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortAmount(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionAmount(list, start, end);
		quicksortAmount(list, start, p - 1);
		quicksortAmount(list, p + 1, end);
	}
	return list;
}