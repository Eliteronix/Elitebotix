const Discord = require('discord.js');
const osu = require('node-osu');
const { CanvasRenderService } = require('chartjs-node-canvas');
const { DBOsuMultiScores, DBDiscordUsers } = require('../dbObjects');
const { getGuildPrefix, getOsuUserServerMode, getIDFromPotentialOsuLink, getMessageUserDisplayname } = require('../utils');

module.exports = {
	name: 'osu-schedule',
	// aliases: ['os', 'o-s'],
	description: 'Sends an info graph about the schedules of the players',
	usage: '<username> [username] ... (Use "_" instead of spaces)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	//guildOnly: true,
	// args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	async execute(msg, args) {
		const guildPrefix = await getGuildPrefix(msg);

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		let users = [];

		if (!args[0]) {//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				users.push(commandUser.osuUserId);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				users.push(userDisplayName);
			}
		}

		//Get profiles by arguments
		for (let i = 0; i < args.length; i++) {
			if (args[i].startsWith('<@') && args[i].endsWith('>')) {
				const discordUser = await DBDiscordUsers.findOne({
					where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
				});

				if (discordUser && discordUser.osuUserId) {
					users.push(discordUser.osuUserId);
				} else {
					msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
					users.push(args[i]);
				}
			} else {

				if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
					if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
						users.push(getIDFromPotentialOsuLink(args[i]));
					} else {
						users.push(getIDFromPotentialOsuLink(args[i]));
					}
				} else {
					users.push(getIDFromPotentialOsuLink(args[i]));
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

		let usersReadable = [];
		for (let i = 0; i < users.length; i++) {
			await osuApi.getUser({ u: users[i] })
				.then(user => {
					users[i] = user.id;
					usersReadable.push(user.name);
				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user \`${users[i].replace(/`/g, '')}\`. (Use "_" instead of spaces)`);
						users.splice(i, 1);
						i--;
					} else {
						console.log(err);
					}
				});
		}

		if (users.length === 0) {
			return msg.channel.send('No users left to look for schedules.');
		}

		const width = 1500; //px
		const height = 750; //px
		const canvasRenderService = new CanvasRenderService(width, height);

		const labels = [];
		for (let i = 0; i < 24; i++) {
			labels.push(`${i} UTC`);
		}

		let datasets = [];

		let colors = [];

		for (let i = 0; i < users.length; i++) {
			let startRed = 135;
			let startGreen = 206;
			let startBlue = 250;

			let endRed = 0;
			let endGreen = 0;
			let endBlue = 128;

			let currentRed = ((startRed - endRed) / users.length * (i + 1) + endRed);
			let currentGreen = ((startGreen - endGreen) / users.length * (i + 1) + endGreen);
			let currentBlue = ((startBlue - endBlue) / users.length * (i + 1) + endBlue);

			colors.push(`#${Math.round(currentRed).toString(16)}${Math.round(currentGreen).toString(16)}${Math.round(currentBlue).toString(16)}`);
		}

		for (let i = 0; i < users.length; i++) {
			let data = [];

			const allMatches = await DBOsuMultiScores.findAll({
				where: { osuUserId: users[i] }
			});

			let maxCount = 0;
			for (let j = 0; j < 24; j++) {
				let count = 0;
				for (let k = 0; k < allMatches.length; k++) {
					if (allMatches[k].gameStartDate.getUTCHours() === j) {
						count++;
						allMatches.splice(k, 1);
						k--;
					}
				}
				data.push(count);
				if (count > maxCount) {
					maxCount = count;
				}
			}

			for (let j = 0; j < data.length; j++) {
				data[j] = data[j] / maxCount;
			}

			datasets.push({
				label: usersReadable[i],
				data: data,
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

		msg.channel.send(`Schedule for: ${usersReadable.join(', ')}\nThe data is based on multiplayer matches evaluated by / sent to the bot`, attachment);
	},
};