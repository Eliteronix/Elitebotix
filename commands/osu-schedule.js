const Discord = require('discord.js');
const osu = require('node-osu');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { DBOsuMultiScores, DBDiscordUsers } = require('../dbObjects');
const { getOsuUserServerMode, getIDFromPotentialOsuLink, getMessageUserDisplayname, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-schedule',
	description: 'Sends an info graph about the schedules of the players',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		let weekday = 7;
		let team1 = [];
		let team2 = [];
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Players are being processed');

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'weekday') {
						weekday = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name.startsWith('team1')) {
						team1.push(interaction.options._hoistedOptions[i].value);
						args.push(interaction.options._hoistedOptions[i].value);
					} else {
						team2.push(interaction.options._hoistedOptions[i].value);
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}
		} else {
			for (let i = 0; i < args.length; i++) {
				team1.push(args[i]);
			}
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];

		if (!args[0]) {//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				team1.push(commandUser.osuUserId);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				team1.push(userDisplayName);
			}
		}

		let teams = [team1, team2];

		//Get profiles by arguments
		for (let i = 0; i < teams.length; i++) {
			for (let j = 0; j < teams[i].length; j++) {
				if (teams[i][j].startsWith('<@') && teams[i][j].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-schedule.js DBDiscordUsers');
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: teams[i][j].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						teams[i][j] = discordUser.osuUserId;
					} else {
						msg.channel.send(`\`${teams[i][j].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:1023849632599658496>.`);
						teams[i].splice(j, 1);
						j--;
					}
				} else {
					teams[i][j] = getIDFromPotentialOsuLink(teams[i][j]);
				}
			}
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let teamsReadable = [[], []];
		for (let i = 0; i < teams.length; i++) {
			for (let j = 0; j < teams[i].length; j++) {
				await osuApi.getUser({ u: teams[i][j] })
					.then(user => {
						teams[i][j] = user.id;
						teamsReadable[i].push(user.name);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find user \`${teams[i][j].replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
							teams[i].splice(j, 1);
							j--;
						} else {
							console.error(err);
						}
					});
			}
		}

		if (teams[0].length + teams[1].length === 0) {
			return msg.channel.send('No users left to look for schedules.');
		}

		const width = 1500; //px
		const height = 750; //px
		const canvasRenderService = new ChartJSNodeCanvas({ width, height });

		const labels = [];
		for (let i = 0; i < 24; i++) {
			labels.push(`${i} UTC`);
		}

		let datasets = [];

		let colors = [];
		let startRed = 135;
		let startGreen = 206;
		let startBlue = 250;

		let endRed = 0;
		let endGreen = 0;
		let endBlue = 128;

		for (let i = 0; i < teams[0].length; i++) {
			let currentRed = ((startRed - endRed) / teams[0].length * (i + 1) + endRed);
			let currentGreen = ((startGreen - endGreen) / teams[0].length * (i + 1) + endGreen);
			let currentBlue = ((startBlue - endBlue) / teams[0].length * (i + 1) + endBlue);

			colors.push(`#${Math.round(currentRed).toString(16)}${Math.round(currentGreen).toString(16)}${Math.round(currentBlue).toString(16)}`);
		}

		startRed = 255;
		startGreen = 175;
		startBlue = 122;

		endRed = 170;
		endGreen = 20;
		endBlue = 0;

		for (let i = 0; i < teams[1].length; i++) {
			let currentRed = ((startRed - endRed) / teams[1].length * (i + 1) + endRed);
			let currentGreen = ((startGreen - endGreen) / teams[1].length * (i + 1) + endGreen);
			let currentBlue = ((startBlue - endBlue) / teams[1].length * (i + 1) + endBlue);

			colors.push(`#${Math.round(currentRed).toString(16)}${Math.round(currentGreen).toString(16)}${Math.round(currentBlue).toString(16)}`);
		}

		let users = [];
		let usersReadable = [];

		for (let i = 0; i < teams.length; i++) {
			for (let j = 0; j < teams[i].length; j++) {
				users.push(teams[i][j]);
				usersReadable.push(teamsReadable[i][j]);
			}
		}

		for (let i = 0; i < users.length; i++) {
			let data = [];

			logDatabaseQueries(4, 'commands/osu-schedule.js DBOsuMultiScores');
			const allMatches = await DBOsuMultiScores.findAll({
				where: {
					osuUserId: users[i],
					score: {
						[Op.gte]: 10000
					}
				}
			});

			for (let j = 0; j < allMatches.length; j++) {
				if (parseInt(allMatches[j].score) <= 10000
					|| weekday != 7 && new Date(allMatches[j].gameStartDate).getUTCDay() != weekday) {
					allMatches.splice(j, 1);
					j--;
				}
			}

			for (let j = 0; j < 24; j++) {
				let count = 0;
				for (let k = 0; k < allMatches.length; k++) {
					if (new Date(allMatches[k].gameStartDate).getUTCHours() === j) {
						count++;
						allMatches.splice(k, 1);
						k--;
					}
				}
				data.push(count);
			}

			let filteredData = [];
			let maxAmount = 0;
			for (let j = 0; j < data.length; j++) {
				if (data[j]) {
					let filteredPoint = (data[(j - 1 + 24) % 24] + data[j] + data[(j + 1) % 24]) / 3;
					filteredData.push(filteredPoint);
					if (filteredPoint > maxAmount) {
						maxAmount = filteredPoint;
					}
				} else {
					filteredData.push(0);
				}
			}

			for (let j = 0; j < filteredData.length; j++) {
				filteredData[j] = filteredData[j] / maxAmount;
			}

			datasets.push({
				label: usersReadable[i],
				data: filteredData,
				backgroundColor: colors[i],
				fill: true,
			});
		}

		const data = {
			labels: labels,
			datasets: datasets
		};

		const configuration = {
			type: 'bar',
			data: data,
			options: {
				plugins: {
					title: {
						display: true,
						text: 'Stacked schedules',
						color: '#FFFFFF',
					},
					legend: {
						labels: {
							color: '#FFFFFF',
						}
					},
				},
				responsive: true,
				scales: {
					x: {
						stacked: true,
						title: {
							display: true,
							text: 'Time',
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
						stacked: true,
						grid: {
							color: '#8F8F8F'
						},
						ticks: {
							color: '#FFFFFF',
						},
					}
				}
			}
		};

		const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

		const attachment = new Discord.MessageAttachment(imageBuffer, 'osu-schedules.png');

		let weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'All Week'];

		msg.channel.send({ content: `${weekdayName[weekday]} Schedule for: ${usersReadable.join(', ')}\nThe data is based on multiplayer matches evaluated by / sent to the bot`, files: [attachment] });
	},
};