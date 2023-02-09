const { DBDiscordUsers, DBOsuMultiScores, DBDuelRatingHistory } = require('../dbObjects');
const osu = require('node-osu');
const { developers, salesmen, showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { getUserDuelStarRating, getMessageUserDisplayname, logDatabaseQueries, getOsuBeatmap } = require('../utils');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Discord = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'earlyaccess',
	description: 'Has some early access features for patreons if possible',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('earlyaccess')
		.setNameLocalizations({
			'de': 'earlyaccess',
			'en-GB': 'earlyaccess',
			'en-US': 'earlyaccess',
		})
		.setDescription('Has some early access features for patreons if possible')
		.setDescriptionLocalizations({
			'de': 'Hat einige frühe Zugriffsfunktionen für Patreons, wenn möglich',
			'en-GB': 'Has some early access features for patreons if possible',
			'en-US': 'Has some early access features for patreons if possible',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tournamentdifficulty')
				.setNameLocalizations({
					'de': 'turnierschwierigkeit',
					'en-GB': 'tournamentdifficulty',
					'en-US': 'tournamentdifficulty',
				})
				.setDescription('Gets the difficulty of a map for a tournament')
				.setDescriptionLocalizations({
					'de': 'Gibt die Schwierigkeit einer map für ein Turnier an',
					'en-GB': 'Gets the difficulty of a map for a tournament',
					'en-US': 'Gets the difficulty of a map for a tournament',
				})
				.addStringOption(option =>
					option.setName('beatmapid')
						.setDescription('The beatmap ID')
						.setDescriptionLocalizations({
							'de': 'Die Beatmap ID',
							'en-GB': 'The beatmap ID',
							'en-US': 'The beatmap ID',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('modpool')
						.setDescription('The modpool')
						.setDescriptionLocalizations({
							'de': 'Der Modpool',
							'en-GB': 'The modpool',
							'en-US': 'The modpool',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'NM', value: 'NM' },
							{ name: 'HD', value: 'HD' },
							{ name: 'HR', value: 'HR' },
							{ name: 'DT', value: 'DT' },
						)
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}
		}

		logDatabaseQueries(4, 'commands/earlyaccess.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: msg.author.id,
				patreon: true
			}
		});

		if (!developers.includes(msg.author.id) && !salesmen.includes(msg.author.id) && !discordUser) {
			return msg.reply('Earlyaccess commands are reserved for developers and patreons. As soon as they are up to standard for release you will be able to use them.');
		}

		if (interaction && interaction.options.getSubcommand() === 'tournamentdifficulty') {
			let beatmapId = interaction.options.getString('beatmapid');
			let modpool = interaction.options.getString('modpool');

			let modBits = 0;

			if (modpool === 'HD') {
				modBits = 8;
			} else if (modpool === 'HR') {
				modBits = 16;
			} else if (modpool === 'DT') {
				modBits = 64;
			}

			let beatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: modBits });

			if (!beatmap) {
				return await interaction.editReply('Beatmap not found');
			}

			//Get all the scores for the map
			logDatabaseQueries(4, 'commands/earlyaccess.js DBOsuMultiScores tournamentDifficulty');
			let scores = await DBOsuMultiScores.findAll({
				where: {
					beatmapId: beatmapId,
					freeMod: false,
				}
			});

			let plays = [];

			// grab the player IDs, scores, mods, and month
			for (let i = 0; i < scores.length; i++) {
				if (scores[i].warmup) {
					continue;
				}

				if (parseInt(scores[i].gameRawMods) % 2 === 1) {
					scores[i].gameRawMods = parseInt(scores[i].gameRawMods) - 1;
				}
				if (parseInt(scores[i].rawMods) % 2 === 1) {
					scores[i].rawMods = parseInt(scores[i].rawMods) - 1;
				}

				if (parseInt(modBits) !== parseInt(scores[i].rawMods) + parseInt(scores[i].gameRawMods)) {
					continue;
				}

				plays.push({
					osuUserId: scores[i].osuUserId,
					score: scores[i].score,
					month: new Date(scores[i].gameStartDate).getUTCMonth(),
					year: new Date(scores[i].gameStartDate).getUTCFullYear(),
				});
			}

			logDatabaseQueries(4, 'commands/earlyaccess.js DBDuelRatingHistory tournamentDifficulty');
			let allDuelRatingHistories = await DBDuelRatingHistory.findAll({
				where: {
					osuUserId: {
						[Op.in]: plays.map(p => p.osuUserId),
					},
				}
			});

			for (let i = 0; i < plays.length; i++) {
				let duelRatingHistory = allDuelRatingHistories.find(d => d.osuUserId === plays[i].osuUserId && d.month === plays[i].month && d.year === plays[i].year);

				if (!duelRatingHistory) {
					plays.splice(i, 1);
					i--;
					continue;
				}

				if (modpool === 'NM') {
					plays[i].score = plays[i].score / 1;
					plays[i].duelRating = duelRatingHistory.osuNoModDuelStarRating;
				} else if (modpool === 'HD') {
					plays[i].score = plays[i].score / 1.06;
					plays[i].duelRating = duelRatingHistory.osuHiddenDuelStarRating;
				} else if (modpool === 'HR') {
					plays[i].score = plays[i].score / 1.1;
					plays[i].duelRating = duelRatingHistory.osuHardRockDuelStarRating;
				} else if (modpool === 'DT') {
					plays[i].score = plays[i].score / 1.2;
					plays[i].duelRating = duelRatingHistory.osuDoubleTimeDuelStarRating;
				}

				if (!plays[i].duelRating) {
					plays.splice(i, 1);
					i--;
					continue;
				}

				plays[i].duelRating = parseFloat(plays[i].duelRating);

				if (plays[i].score < 20000) {
					plays[i].score = 20000;
				}

				// calculate the expected SR
				// y=a (x + (b-r))²+c
				// r = (ab+sqrt(-a(c-y))+ax)/a
				// y = plays[i].score
				// x = plays[i].duelRating
				// r = ? (the expected duel rating)
				const a = 120000;
				const b = -1.67;
				const c = 20000;

				let helpRating = (a * b + Math.sqrt(-a * (c - plays[i].score)) + a * plays[i].duelRating) / a;

				plays[i].expectedDuelRating = plays[i].duelRating - (helpRating - plays[i].duelRating);
			}

			if (plays.length === 0) {
				return await interaction.editReply('No plays found');
			}

			// Get the average expected duel rating
			let averageExpectedDuelRating = 0;
			for (let i = 0; i < plays.length; i++) {
				averageExpectedDuelRating += plays[i].expectedDuelRating;
			}
			averageExpectedDuelRating /= plays.length;

			return await interaction.editReply(`The tournament difficulty for ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] with ${modpool} is ${averageExpectedDuelRating.toFixed(2)} based on ${plays.length} plays.`);
		}

		if (args[0] === 'duelRatingDevelopment') {
			if (!developers.includes(msg.author.id)) {
				return msg.reply('This feature is currently restricted to developers');
			}

			let discordUser = null;
			let username = null;
			if (args[1]) {
				username = args[1];
				logDatabaseQueries(4, 'commands/earlyaccess.js DBDiscordUsers duelRatingDevelopment 1');
				discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: {
							[Op.ne]: null
						},
						[Op.or]: {
							osuUserId: username,
							osuName: username,
							userId: username.replace('<@', '').replace('>', '').replace('!', ''),
						}
					}
				});
			} else {
				logDatabaseQueries(4, 'commands/earlyaccess.js DBDiscordUsers duelRatingDevelopment 2');
				discordUser = await DBDiscordUsers.findOne({
					where: {
						userId: msg.author.id,
						osuUserId: {
							[Op.ne]: null
						},
					}
				});

				if (!discordUser) {
					username = msg.author.username;
					username = await getMessageUserDisplayname(msg);
				}
			}

			let osuUser = { osuUserId: null, osuName: null };

			if (discordUser) {
				osuUser.osuUserId = discordUser.osuUserId;
				osuUser.osuName = discordUser.osuName;
			}

			//Get the user from the API if needed
			if (!osuUser.osuUserId) {
				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				try {
					// eslint-disable-next-line no-undef
					process.send('osu!API');
					const user = await osuApi.getUser({ u: username });
					osuUser.osuUserId = user.id;
					osuUser.osuName = user.name;
				} catch (error) {
					return await msg.reply({ content: `Could not find user \`${username.replace(/`/g, '')}\`.`, ephemeral: true });
				}
			}

			let processingMessage = await msg.reply('Processing...');

			logDatabaseQueries(4, 'commands/earlyaccess.js DBOsuMultiScores duelRatingDevelopment');
			let oldestScore = await DBOsuMultiScores.findOne({
				where: {
					osuUserId: osuUser.osuUserId,
					tourneyMatch: true,
					scoringType: 'Score v2',
					mode: 'Standard',
				},
				order: [
					['gameEndDate', 'ASC']
				]
			});

			if (!oldestScore) {
				return await processingMessage.edit({ content: 'No scores found for this user', ephemeral: true });
			}

			let duelRatings = [await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: msg.client })];

			//Set the date to the beginning of the week
			let date = new Date();
			date.setUTCDate(date.getUTCDate() - date.getUTCDay());
			date.setUTCHours(23, 59, 59, 999);

			let iterator = 0;
			let startTime = date - oldestScore.gameEndDate;
			let lastUpdate = new Date();

			while (date > oldestScore.gameEndDate) {
				iterator++;
				if (new Date() - lastUpdate > 15000) {
					processingMessage.edit(`Processing... (${iterator} weeks deep | ${(100 - (100 / startTime * (date - oldestScore.gameEndDate))).toFixed(2)}%)`);
					lastUpdate = new Date();
				}
				let duelRating = await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: msg.client, date: date });
				duelRatings.push(duelRating);
				date.setUTCDate(date.getUTCDate() - 7);
			}

			let labels = [];

			for (let i = 0; i < duelRatings.length; i++) {
				if (i === 0) {
					labels.push('Today');
				} else if (i === 1) {
					labels.push(`${i} week ago`);
				} else {
					labels.push(`${i} weeks ago`);
				}
			}

			labels.reverse();

			for (let i = 0; i < 6; i++) {
				let history = [];
				let type = null;

				for (let j = 0; j < duelRatings.length; j++) {
					if (i === 0) {
						history.push(duelRatings[j].total);
						type = 'Total';
					} else if (i === 1) {
						history.push(duelRatings[j].noMod);
						type = 'No Mod';
					} else if (i === 2) {
						history.push(duelRatings[j].hidden);
						type = 'Hidden';
					} else if (i === 3) {
						history.push(duelRatings[j].hardRock);
						type = 'Hard Rock';
					} else if (i === 4) {
						history.push(duelRatings[j].doubleTime);
						type = 'Double Time';
					} else if (i === 5) {
						history.push(duelRatings[j].freeMod);
						type = 'Free Mod';
					}
				}

				history.reverse();

				let masterHistory = [];
				let diamondHistory = [];
				let platinumHistory = [];
				let goldHistory = [];
				let silverHistory = [];
				let bronzeHistory = [];

				for (let j = 0; j < history.length; j++) {
					let masterRating = null;
					let diamondRating = null;
					let platinumRating = null;
					let goldRating = null;
					let silverRating = null;
					let bronzeRating = null;

					if (history[j] > 7) {
						masterRating = history[j];
					} else if (history[j] > 6.4) {
						diamondRating = history[j];
					} else if (history[j] > 5.8) {
						platinumRating = history[j];
					} else if (history[j] > 5.2) {
						goldRating = history[j];
					} else if (history[j] > 4.6) {
						silverRating = history[j];
					} else {
						bronzeRating = history[j];
					}

					masterHistory.push(masterRating);
					diamondHistory.push(diamondRating);
					platinumHistory.push(platinumRating);
					goldHistory.push(goldRating);
					silverHistory.push(silverRating);
					bronzeHistory.push(bronzeRating);
				}

				const width = 1500; //px
				const height = 750; //px
				const canvasRenderService = new ChartJSNodeCanvas({ width, height });

				const data = {
					labels: labels,
					datasets: [
						{
							label: 'Master',
							data: masterHistory,
							borderColor: 'rgb(255, 174, 251)',
							fill: true,
							backgroundColor: 'rgba(255, 174, 251, 0.6)',
							tension: 0.4
						},
						{
							label: 'Diamond',
							data: diamondHistory,
							borderColor: 'rgb(73, 176, 255)',
							fill: true,
							backgroundColor: 'rgba(73, 176, 255, 0.6)',
							tension: 0.4
						},
						{
							label: 'Platinum',
							data: platinumHistory,
							borderColor: 'rgb(29, 217, 165)',
							fill: true,
							backgroundColor: 'rgba(29, 217, 165, 0.6)',
							tension: 0.4
						},
						{
							label: 'Gold',
							data: goldHistory,
							borderColor: 'rgb(255, 235, 71)',
							fill: true,
							backgroundColor: 'rgba(255, 235, 71, 0.6)',
							tension: 0.4
						},
						{
							label: 'Silver',
							data: silverHistory,
							borderColor: 'rgb(181, 181, 181)',
							fill: true,
							backgroundColor: 'rgba(181, 181, 181, 0.6)',
							tension: 0.4
						},
						{
							label: 'Bronze',
							data: bronzeHistory,
							borderColor: 'rgb(240, 121, 0)',
							fill: true,
							backgroundColor: 'rgba(240, 121, 0, 0.6)',
							tension: 0.4
						},
					]
				};

				const configuration = {
					type: 'line',
					data: data,
					options: {
						responsive: true,
						plugins: {
							title: {
								display: true,
								text: `Duel Rating History (${type})`,
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
									text: 'Duel Rating',
									color: '#FFFFFF'
								},
								grid: {
									color: '#8F8F8F'
								},
								ticks: {
									color: '#FFFFFF',
								},
							}
						}
					},
				};

				const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
				if (i === 0) {
					processingMessage.delete();
				}
				await msg.reply({ content: `${type} Duel Rating History for ${osuUser.osuName}`, files: [new Discord.AttachmentBuilder(imageBuffer, { name: `duelRatingHistory-${osuUser.osuUserId}.png` })] });
			}
		} else {
			msg.reply('Invalid command');
		}
	},
};