const { DBDiscordUsers, DBOsuMultiGameScores } = require('../../dbObjects');
const osu = require('node-osu');
const { Op } = require('sequelize');
const { getUserDuelStarRating, logDatabaseQueries, logOsuAPICalls } = require('../../utils');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Discord = require('discord.js');

module.exports = {
	name: 'duelRatingDevelopment',
	usage: '[player]',
	// eslint-disable-next-line no-unused-vars
	async execute(interaction) {
		let discordUser = null;
		let username = null;
		if (interaction.options.getString('argument')) {
			username = interaction.options.getString('argument');
			logDatabaseQueries(4, 'commands/earlyaccess.js DBDiscordUsers duelRatingDevelopment 1');
			discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId', 'osuName'],
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
				attributes: ['osuUserId', 'osuName'],
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.ne]: null
					},
				}
			});

			if (!discordUser) {
				username = interaction.user.username;

				if (interaction.member) {
					username = interaction.member.displayName;
				}
			}
		}

		let osuUser = { osuUserId: null, osuName: null };

		if (discordUser) {
			osuUser.osuUserId = discordUser.osuUserId;
			osuUser.osuName = discordUser.osuName;
		}

		//Get the user from the API if needed
		if (!osuUser.osuUserId) {
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			try {
				logOsuAPICalls('admin/duelRatingDevelopment.js');
				const user = await osuApi.getUser({ u: username });
				osuUser.osuUserId = user.id;
				osuUser.osuName = user.name;
			} catch (error) {
				return await interaction.editReply({ content: `Could not find user \`${username.replace(/`/g, '')}\`.`, ephemeral: true });
			}
		}

		let processingMessage = await interaction.editReply('Processing...');

		logDatabaseQueries(4, 'commands/earlyaccess.js DBOsuMultiGameScores duelRatingDevelopment');
		let oldestScore = await DBOsuMultiGameScores.findOne({
			attributes: ['gameId', 'gameEndDate'],
			where: {
				osuUserId: osuUser.osuUserId,
				tourneyMatch: true,
				scoringType: 3,
				mode: 0,
			},
			order: [
				['gameId', 'ASC']
			]
		});

		if (!oldestScore) {
			return await processingMessage.edit({ content: 'No scores found for this user', ephemeral: true });
		}

		let duelRatings = [await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: interaction.client })];

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
			let duelRating = await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: interaction.client, date: date });
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

			let grandmasterHistory = [];
			let masterHistory = [];
			let diamondHistory = [];
			let platinumHistory = [];
			let goldHistory = [];
			let silverHistory = [];
			let bronzeHistory = [];

			for (let j = 0; j < history.length; j++) {
				let grandmasterRating = null;
				let masterRating = null;
				let diamondRating = null;
				let platinumRating = null;
				let goldRating = null;
				let silverRating = null;
				let bronzeRating = null;

				if (history[j] > 7.6) {
					grandmasterRating = history[j];
				} else if (history[j] > 7) {
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

				grandmasterHistory.push(grandmasterRating);
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
						label: 'Grandmaster',
						data: grandmasterHistory,
						borderColor: 'rgb(88, 28, 255)',
						fill: true,
						backgroundColor: 'rgba(88, 28, 255, 0.6)',
						tension: 0.4
					},
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
				await processingMessage.delete();
			}
			await interaction.followUp({ content: `${type} Duel Rating History for ${osuUser.osuName}`, files: [new Discord.AttachmentBuilder(imageBuffer, { name: `duelRatingHistory-${osuUser.osuUserId}.png` })] });
		}
	},
};