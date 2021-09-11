const Discord = require('discord.js');
const osu = require('node-osu');
const { CanvasRenderService } = require('chartjs-node-canvas');
const { DBOsuMultiScores, DBDiscordUsers } = require('../dbObjects');
const { getGuildPrefix, getOsuUserServerMode, getIDFromPotentialOsuLink, getMessageUserDisplayname, populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'osu-skills',
	// aliases: ['os', 'o-s'],
	description: 'Sends an info card about the skills of the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces; Use --scaled to scale by totalEvaluation (better for mods); Use --vx/--v1 to change scoring type filter; Use --tourney to filter by tourney matches only)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
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
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}

			if (args[2]) {
				args[2] = '--tourney';
			} else {
				args.splice(2, 1);
			}

			if (args[0]) {
				args[0] = '--scaled';
			} else {
				args.splice(0, 1);
			}
		}
		const guildPrefix = await getGuildPrefix(msg);

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];

		let scaled = false;
		let scoringType = 'vx';
		let tourneyMatch = false;
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
			}
		}

		if (!args[0]) {//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				getOsuSkills(msg, args, commandUser.osuUserId, scaled, scoringType, tourneyMatch);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getOsuSkills(msg, args, userDisplayName, scaled, scoringType, tourneyMatch);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getOsuSkills(msg, args, discordUser.osuUserId, scaled, scoringType, tourneyMatch);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
						getOsuSkills(msg, args, args[i], scaled, scoringType, tourneyMatch);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getOsuSkills(msg, args, getIDFromPotentialOsuLink(args[i]), scaled, scoringType, tourneyMatch);
						} else {
							getOsuSkills(msg, args, getIDFromPotentialOsuLink(args[i]), scaled, scoringType, tourneyMatch);
						}
					} else {
						getOsuSkills(msg, args, getIDFromPotentialOsuLink(args[i]), scaled, scoringType, tourneyMatch);
					}
				}
			}
		}
	},
};

async function getOsuSkills(msg, args, username, scaled, scoringType, tourneyMatch) {
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

			const width = 1500; //px
			const height = 750; //px
			const canvasRenderService = new CanvasRenderService(width, height);

			(async () => {
				const userScores = await DBOsuMultiScores.findAll({
					where: { osuUserId: user.id }
				});

				if (!userScores.length) {
					return processingMessage.edit(`No scores found in the database for ${user.name}.`);
				}

				let oldestDate = new Date();

				oldestDate.setUTCDate(1);
				oldestDate.setUTCHours(0);
				oldestDate.setUTCMinutes(0);

				userScores.forEach(score => {
					if (oldestDate > score.matchStartDate) {
						oldestDate.setUTCFullYear(score.matchStartDate.getUTCFullYear());
						oldestDate.setUTCMonth(score.matchStartDate.getUTCMonth());
					}
				});

				const rawData = [];
				const labels = [];
				for (let now = new Date(); oldestDate < now; oldestDate.setUTCMonth(oldestDate.getUTCMonth() + 1)) {
					let rawDataObject = {
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
					labels.push(rawDataObject.label);
					rawData.push(rawDataObject);
				}

				for (let i = 0; i < userScores.length; i++) {
					if (scoringType === 'v2' && userScores[i].scoringType !== 'Score v2') {
						continue;
					}
					if (scoringType === 'v1' && userScores[i].scoringType === 'Score v1') {
						continue;
					}
					if (tourneyMatch && !userScores[i].tourneyMatch) {
						continue;
					}

					for (let j = 0; j < rawData.length; j++) {
						if (rawData[j].label === `${(userScores[i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${userScores[i].matchStartDate.getUTCFullYear()}`) {
							rawData[j].totalEvaluation += parseFloat(userScores[i].evaluation);
							rawData[j].totalCount++;
							const sameGameScores = await DBOsuMultiScores.findAll({
								where: { matchId: userScores[i].matchId, gameId: userScores[i].gameId }
							});

							for (let k = 0; k < sameGameScores.length; k++) {
								if (userScores[i].rawMods === sameGameScores[k].rawMods) {
									sameGameScores.splice(k, 1);
									k--;
								}
							}

							if (sameGameScores.length === 0 && userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '0' || userScores[i].gameRawMods === '1')) {
								rawData[j].NMEvaluation += parseFloat(userScores[i].evaluation);
								rawData[j].NMCount++;
							} else if (userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '8' || userScores[i].gameRawMods === '9')) {
								rawData[j].HDEvaluation += parseFloat(userScores[i].evaluation);
								rawData[j].HDCount++;
							} else if (userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '16' || userScores[i].gameRawMods === '17')) {
								rawData[j].HREvaluation += parseFloat(userScores[i].evaluation);
								rawData[j].HRCount++;
							} else if (userScores[i].rawMods === '0' && (userScores[i].gameRawMods === '64' || userScores[i].gameRawMods === '65' || userScores[i].gameRawMods === '576' || userScores[i].gameRawMods === '577')) {
								rawData[j].DTEvaluation += parseFloat(userScores[i].evaluation);
								rawData[j].DTCount++;
							} else {
								rawData[j].FMEvaluation += parseFloat(userScores[i].evaluation);
								rawData[j].FMCount++;
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
				rawData.forEach(rawDataObject => {
					let totalValue = NaN;
					if (rawDataObject.totalCount) {
						totalValue = rawDataObject.totalEvaluation / rawDataObject.totalCount;
					}

					let NMValue = NaN;
					if (rawDataObject.NMCount) {
						NMValue = rawDataObject.NMEvaluation / rawDataObject.NMCount;
						if (scaled) {
							NMValue = NMValue / totalValue;
						}
					}
					NMDatapoints.push(NMValue);

					let HDValue = NaN;
					if (rawDataObject.HDCount) {
						HDValue = rawDataObject.HDEvaluation / rawDataObject.HDCount;
						if (scaled) {
							HDValue = HDValue / totalValue;
						}
					}
					HDDatapoints.push(HDValue);

					let HRValue = NaN;
					if (rawDataObject.HRCount) {
						HRValue = rawDataObject.HREvaluation / rawDataObject.HRCount;
						if (scaled) {
							HRValue = HRValue / totalValue;
						}
					}
					HRDatapoints.push(HRValue);

					let DTValue = NaN;
					if (rawDataObject.DTCount) {
						DTValue = rawDataObject.DTEvaluation / rawDataObject.DTCount;
						if (scaled) {
							DTValue = DTValue / totalValue;
						}
					}
					DTDatapoints.push(DTValue);

					let FMValue = NaN;
					if (rawDataObject.FMCount) {
						FMValue = rawDataObject.FMEvaluation / rawDataObject.FMCount;
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

				msg.channel.send({ content: `[Beta/WIP] Modpool evaluation development for ${user.name} (Score ${scoringType}; ${tourneyMatchText})${scaledText}`, files: [attachment] });
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