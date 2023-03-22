const Discord = require('discord.js');
const osu = require('node-osu');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { DBOsuMultiScores, DBDiscordUsers } = require('../dbObjects');
const { getOsuUserServerMode, getIDFromPotentialOsuLink, getMessageUserDisplayname, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-schedule',
	description: 'Sends an info graph about the schedules of the players',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-schedule')
		.setNameLocalizations({
			'de': 'osu-zeitplan',
			'en-GB': 'osu-schedule',
			'en-US': 'osu-schedule',
		})
		.setDescription('Sends an info graph about the schedules of the players')
		.setDescriptionLocalizations({
			'de': 'Sendet ein Info-Graph über die Zeitpläne der Spieler',
			'en-GB': 'Sends an info graph about the schedules of the players',
			'en-US': 'Sends an info graph about the schedules of the players',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('weekday')
				.setNameLocalizations({
					'de': 'wochentag',
					'en-GB': 'weekday',
					'en-US': 'weekday',
				})
				.setDescription('The day of the week to filter the schedule for')
				.setDescriptionLocalizations({
					'de': 'Der Wochentag, um den Zeitplan zu filtern',
					'en-GB': 'The day of the week to filter the schedule for',
					'en-US': 'The day of the week to filter the schedule for',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Monday', value: '1' },
					{ name: 'Tuesday', value: '2' },
					{ name: 'Wednesday', value: '3' },
					{ name: 'Thursday', value: '4' },
					{ name: 'Friday', value: '5' },
					{ name: 'Saturday', value: '6' },
					{ name: 'Sunday', value: '0' },
				)
		)
		.addStringOption(option =>
			option.setName('team1player1')
				.setNameLocalizations({
					'de': 'team1spieler1',
					'en-GB': 'team1player1',
					'en-US': 'team1player1',
				})
				.setDescription('The first user of the first team')
				.setDescriptionLocalizations({
					'de': 'Der erste Spieler des ersten Teams',
					'en-GB': 'The first user of the first team',
					'en-US': 'The first user of the first team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team1player2')
				.setNameLocalizations({
					'de': 'team1spieler2',
					'en-GB': 'team1player2',
					'en-US': 'team1player2',
				})
				.setDescription('The second user of the first team')
				.setDescriptionLocalizations({
					'de': 'Der zweite Spieler des ersten Teams',
					'en-GB': 'The second user of the first team',
					'en-US': 'The second user of the first team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team1player3')
				.setNameLocalizations({
					'de': 'team1spieler3',
					'en-GB': 'team1player3',
					'en-US': 'team1player3',
				})
				.setDescription('The third user of the first team')
				.setDescriptionLocalizations({
					'de': 'Der dritte Spieler des ersten Teams',
					'en-GB': 'The third user of the first team',
					'en-US': 'The third user of the first team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team1player4')
				.setNameLocalizations({
					'de': 'team1spieler4',
					'en-GB': 'team1player4',
					'en-US': 'team1player4',
				})
				.setDescription('The fourth user of the first team')
				.setDescriptionLocalizations({
					'de': 'Der vierte Spieler des ersten Teams',
					'en-GB': 'The fourth user of the first team',
					'en-US': 'The fourth user of the first team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team1player5')
				.setNameLocalizations({
					'de': 'team1spieler5',
					'en-GB': 'team1player5',
					'en-US': 'team1player5',
				})
				.setDescription('The fifth user of the first team')
				.setDescriptionLocalizations({
					'de': 'Der fünfte Spieler des ersten Teams',
					'en-GB': 'The fifth user of the first team',
					'en-US': 'The fifth user of the first team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team1player6')
				.setNameLocalizations({
					'de': 'team1spieler6',
					'en-GB': 'team1player6',
					'en-US': 'team1player6',
				})
				.setDescription('The sixth user of the first team')
				.setDescriptionLocalizations({
					'de': 'Der sechste Spieler des ersten Teams',
					'en-GB': 'The sixth user of the first team',
					'en-US': 'The sixth user of the first team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team1player7')
				.setNameLocalizations({
					'de': 'team1spieler7',
					'en-GB': 'team1player7',
					'en-US': 'team1player7',
				})
				.setDescription('The seventh user of the first team')
				.setDescriptionLocalizations({
					'de': 'Der siebte Spieler des ersten Teams',
					'en-GB': 'The seventh user of the first team',
					'en-US': 'The seventh user of the first team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team1player8')
				.setNameLocalizations({
					'de': 'team1spieler8',
					'en-GB': 'team1player8',
					'en-US': 'team1player8',
				})
				.setDescription('The eighth user of the first team')
				.setDescriptionLocalizations({
					'de': 'Der achte Spieler des ersten Teams',
					'en-GB': 'The eighth user of the first team',
					'en-US': 'The eighth user of the first team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team2player1')
				.setNameLocalizations({
					'de': 'team2spieler1',
					'en-GB': 'team2player1',
					'en-US': 'team2player1',
				})
				.setDescription('The first user of the second team')
				.setDescriptionLocalizations({
					'de': 'Der erste Spieler des zweiten Teams',
					'en-GB': 'The first user of the second team',
					'en-US': 'The first user of the second team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team2player2')
				.setNameLocalizations({
					'de': 'team2spieler2',
					'en-GB': 'team2player2',
					'en-US': 'team2player2',
				})
				.setDescription('The second user of the second team')
				.setDescriptionLocalizations({
					'de': 'Der zweite Spieler des zweiten Teams',
					'en-GB': 'The second user of the second team',
					'en-US': 'The second user of the second team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team2player3')
				.setNameLocalizations({
					'de': 'team2spieler3',
					'en-GB': 'team2player3',
					'en-US': 'team2player3',
				})
				.setDescription('The third user of the second team')
				.setDescriptionLocalizations({
					'de': 'Der dritte Spieler des zweiten Teams',
					'en-GB': 'The third user of the second team',
					'en-US': 'The third user of the second team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team2player4')
				.setNameLocalizations({
					'de': 'team2spieler4',
					'en-GB': 'team2player4',
					'en-US': 'team2player4',
				})
				.setDescription('The fourth user of the second team')
				.setDescriptionLocalizations({
					'de': 'Der vierte Spieler des zweiten Teams',
					'en-GB': 'The fourth user of the second team',
					'en-US': 'The fourth user of the second team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team2player5')
				.setNameLocalizations({
					'de': 'team2spieler5',
					'en-GB': 'team2player5',
					'en-US': 'team2player5',
				})
				.setDescription('The fifth user of the second team')
				.setDescriptionLocalizations({
					'de': 'Der fünfte Spieler des zweiten Teams',
					'en-GB': 'The fifth user of the second team',
					'en-US': 'The fifth user of the second team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team2player6')
				.setNameLocalizations({
					'de': 'team2spieler6',
					'en-GB': 'team2player6',
					'en-US': 'team2player6',
				})
				.setDescription('The sixth user of the second team')
				.setDescriptionLocalizations({
					'de': 'Der sechste Spieler des zweiten Teams',
					'en-GB': 'The sixth user of the second team',
					'en-US': 'The sixth user of the second team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team2player7')
				.setNameLocalizations({
					'de': 'team2spieler7',
					'en-GB': 'team2player7',
					'en-US': 'team2player7',
				})
				.setDescription('The seventh user of the second team')
				.setDescriptionLocalizations({
					'de': 'Der siebte Spieler des zweiten Teams',
					'en-GB': 'The seventh user of the second team',
					'en-US': 'The seventh user of the second team',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('team2player8')
				.setNameLocalizations({
					'de': 'team2spieler8',
					'en-GB': 'team2player8',
					'en-US': 'team2player8',
				})
				.setDescription('The eighth user of the second team')
				.setDescriptionLocalizations({
					'de': 'Der achte Spieler des zweiten Teams',
					'en-GB': 'The eighth user of the second team',
					'en-US': 'The eighth user of the second team',
				})
				.setRequired(false)
		),
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		let weekday = 7;
		let team1 = [];
		let team2 = [];
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			try {
				await interaction.deferReply();
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

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
					//TODO: add attributes and logdatabasequeries
					logDatabaseQueries(4, 'commands/osu-schedule.js DBDiscordUsers');
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: teams[i][j].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						teams[i][j] = discordUser.osuUserId;
					} else {
						await interaction.followUp(`\`${teams[i][j].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:1064502370710605836>.`);
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
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				await osuApi.getUser({ u: teams[i][j] })
					.then(user => {
						teams[i][j] = user.id;
						teamsReadable[i].push(user.name);
					})
					.catch(async (err) => {
						if (err.message === 'Not found') {
							await interaction.followUp(`Could not find user \`${teams[i][j].replace(/`/g, '')}\`.`);
							teams[i].splice(j, 1);
							j--;
						} else {
							console.error(err);
						}
					});
			}
		}

		if (teams[0].length + teams[1].length === 0) {
			return await interaction.followUp('No users left to look for schedules.');
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

			//TODO: add attributes and logdatabasequeries
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

		const attachment = new Discord.AttachmentBuilder(imageBuffer, { name: 'osu-schedules.png' });

		let weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'All Week'];

		if (interaction) {
			return await interaction.followUp({ content: `${weekdayName[weekday]} Schedule for: ${usersReadable.join(', ')}\nThe data is based on multiplayer matches evaluated by / sent to the bot`, files: [attachment] });
		}

		return await msg.channel.send({ content: `${weekdayName[weekday]} Schedule for: ${usersReadable.join(', ')}\nThe data is based on multiplayer matches evaluated by / sent to the bot`, files: [attachment] });
	},
};