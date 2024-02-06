const { DBDiscordUsers, DBOsuGuildTrackers, DBOsuBeatmaps, DBOsuMultiGameScores, DBOsuMultiMatches } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { fitTextOnMiddleCanvas, humanReadable, roundedRect, getRankImage, getModImage, getGameModeName, getLinkModeName, getMods, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getAccuracy, getIDFromPotentialOsuLink, getOsuBeatmap, logDatabaseQueries, multiToBanchoScore, gatariToBanchoScore, logOsuAPICalls } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');
const ObjectsToCsv = require('objects-to-csv');

module.exports = {
	name: 'osu-top',
	description: 'Sends an info card about the topplays of the specified player',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-top')
		.setNameLocalizations({
			'de': 'osu-top',
			'en-GB': 'osu-top',
			'en-US': 'osu-top',
		})
		.setDescription('Sends an info card about the topplays of the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über die Topplays des angegebenen Spielers',
			'en-GB': 'Sends an info card about the topplays of the specified player',
			'en-US': 'Sends an info card about the topplays of the specified player',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('sorting')
				.setNameLocalizations({
					'de': 'sortierung',
					'en-GB': 'sorting',
					'en-US': 'sorting',
				})
				.setDescription('Sort your top plays by...')
				.setDescriptionLocalizations({
					'de': 'Sortiere deine Topplays nach...',
					'en-GB': 'Sort your top plays by...',
					'en-US': 'Sort your top plays by...',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Approach Rate', value: 'ar' },
					{ name: 'Circle Size', value: 'cs' },
					{ name: 'Overall Difficulty', value: 'od' },
					{ name: 'HP Drain', value: 'drain' },
					{ name: 'Beats Per Minute', value: 'bpm' },
					{ name: 'Length', value: 'length' },
					{ name: 'Recent', value: 'recent' },
					{ name: 'Star Rating', value: 'sr' },
					{ name: 'Accuracy', value: 'acc' },
				)
		)
		.addStringOption(option =>
			option.setName('ascending')
				.setNameLocalizations({
					'de': 'aufsteigend',
					'en-GB': 'ascending',
					'en-US': 'ascending',
				})
				.setDescription('Sort your top plays in ascending order?')
				.setDescriptionLocalizations({
					'de': 'Sortiere deine Topplays aufsteigend?',
					'en-GB': 'Sort your top plays in ascending order?',
					'en-US': 'Sort your top plays in ascending order?',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'True', value: 'True' },
				)
		)
		.addIntegerOption(option =>
			option.setName('amount')
				.setNameLocalizations({
					'de': 'anzahl',
					'en-GB': 'amount',
					'en-US': 'amount',
				})
				.setDescription('The amount of topplays to be displayed')
				.setDescriptionLocalizations({
					'de': 'Die Anzahl der anzuzeigenden Topplays',
					'en-GB': 'The amount of topplays to be displayed',
					'en-US': 'The amount of topplays to be displayed',
				})
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(100)
		)
		.addNumberOption(option =>
			option.setName('gamemode')
				.setNameLocalizations({
					'de': 'spielmodus',
					'en-GB': 'gamemode',
					'en-US': 'gamemode',
				})
				.setDescription('Gamemode')
				.setDescriptionLocalizations({
					'de': 'Spielmodus',
					'en-GB': 'Gamemode',
					'en-US': 'Gamemode',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Standard', value: 0 },
					{ name: 'Taiko', value: 1 },
					{ name: 'Catch The Beat', value: 2 },
					{ name: 'Mania', value: 3 },
				)
		)
		.addStringOption(option =>
			option.setName('server')
				.setNameLocalizations({
					'de': 'server',
					'en-GB': 'server',
					'en-US': 'server',
				})
				.setDescription('The server from which the results will be displayed')
				.setDescriptionLocalizations({
					'de': 'Der Server, von dem die Ergebnisse angezeigt werden',
					'en-GB': 'The server from which the results will be displayed',
					'en-US': 'The server from which the results will be displayed',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Bancho', value: 'bancho' },
					{ name: 'Ripple', value: 'ripple' },
					{ name: 'Gatari', value: 'gatari' },
					{ name: 'Tournaments', value: 'tournaments' },
					{ name: 'Mixed (Bancho & Tournaments)', value: 'mixed' },
				)
		)
		.addStringOption(option =>
			option.setName('username')
				.setNameLocalizations({
					'de': 'nutzername',
					'en-GB': 'username',
					'en-US': 'username',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username2')
				.setNameLocalizations({
					'de': 'nutzername2',
					'en-GB': 'username2',
					'en-US': 'username2',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username3')
				.setNameLocalizations({
					'de': 'nutzername3',
					'en-GB': 'username3',
					'en-US': 'username3',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username4')
				.setNameLocalizations({
					'de': 'nutzername4',
					'en-GB': 'username4',
					'en-US': 'username4',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username5')
				.setNameLocalizations({
					'de': 'nutzername5',
					'en-GB': 'username5',
					'en-US': 'username5',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('csv')
				.setNameLocalizations({
					'de': 'csv',
					'en-GB': 'csv',
					'en-US': 'csv',
				})
				.setDescription('Should a csv file be attached')
				.setDescriptionLocalizations({
					'de': 'Soll eine csv Datei angehängt werden',
					'en-GB': 'Should a csv file be attached',
					'en-US': 'Should a csv file be attached',
				})
				.setRequired(false)
		),
	async execute(msg, args, interaction) {
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

		let csv = false;

		if (interaction.options.getBoolean('csv')) {
			csv = true;
		}

		let sorting = interaction.options.getString('sorting');

		let limit = interaction.options.getInteger('amount') || 10;

		let order = false;

		if (interaction.options.getString('ascending')) {
			order = true;
		}

		let tracking = interaction.options.getBoolean('tracking');

		let usernames = [];

		if (interaction.options.getString('username')) {
			usernames.push(interaction.options.getString('username'));
		}

		if (interaction.options.getString('username2')) {
			usernames.push(interaction.options.getString('username2'));
		}

		if (interaction.options.getString('username3')) {
			usernames.push(interaction.options.getString('username3'));
		}

		if (interaction.options.getString('username4')) {
			usernames.push(interaction.options.getString('username4'));
		}

		if (interaction.options.getString('username5')) {
			usernames.push(interaction.options.getString('username5'));
		}

		logDatabaseQueries(4, 'commands/osu-top.js DBDiscordUsers commandUser');
		const commandUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuMainMode', 'osuMainServer'],
			where: {
				userId: interaction.user.id
			},
		});

		let gamemode = interaction.options.getNumber('gamemode');

		if (!gamemode) {
			if (commandUser && commandUser.osuMainMode) {
				gamemode = commandUser.osuMainMode;
			} else {
				gamemode = 0;
			}
		}

		let server = interaction.options.getString('server');

		if (!server) {
			if (commandUser && commandUser.osuMainServer) {
				server = commandUser.osuMainServer;
			} else {
				server = 'bancho';
			}
		}

		if (!usernames[0]) {
			//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				getTopPlays(interaction, commandUser.osuUserId, server, gamemode, false, sorting, limit, tracking, order, csv);
			} else {
				let userDisplayName = interaction.user.username;

				if (interaction.member) {
					userDisplayName = interaction.member.displayName;
				}

				getTopPlays(interaction, userDisplayName, server, gamemode, false, sorting, limit, tracking, order, csv);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < usernames.length; i++) {
				if (usernames[i].startsWith('<@') && usernames[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-top.js DBDiscordUsers 1');
					const discordUser = await DBDiscordUsers.findOne({
						attributes: ['osuUserId'],
						where: {
							userId: usernames[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						getTopPlays(interaction, discordUser.osuUserId, server, gamemode, false, sorting, limit, tracking, order, csv);
					} else {
						await interaction.followUp(`\`${usernames[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						getTopPlays(interaction, usernames[i], server, gamemode, false, sorting, limit, tracking, order, csv);
					}
				} else {

					if (usernames.length === 1 && !(usernames[0].startsWith('<@')) && !(usernames[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getTopPlays(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, true, sorting, limit, tracking, order, csv);
						} else {
							getTopPlays(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, false, sorting, limit, tracking, order, csv);
						}
					} else {
						getTopPlays(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, false, sorting, limit, tracking, order, csv);
					}
				}
			}
		}
	}
};

async function getTopPlays(interaction, username, server, mode, noLinkedAccount, sorting, limit, tracking, order, csv) {
	if (server === 'bancho') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		logOsuAPICalls('commands/osu-top.js getUser Bancho');
		osuApi.getUser({ u: username, m: mode })
			.then(async (user) => {
				updateOsuDetailsforUser(interaction.client, user, mode);

				const canvasWidth = 1000;
				const canvasHeight = 83 + limit * 41.66666;

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				for (let i = 0; i < canvas.height / background.height; i++) {
					for (let j = 0; j < canvas.width / background.width; j++) {
						ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
					}
				}

				let elements = [canvas, ctx, user];

				elements = await drawTitle(elements, server, mode, sorting, order);

				elements = await drawTopPlays(elements, server, mode, interaction, sorting, limit, order, tracking);

				let scores = elements[3];

				await drawFooter(elements);

				//Create as an attachment
				const files = [new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-top-${user.id}-mode${mode}.png` })];

				if (csv) {
					let csv = new ObjectsToCsv(scores);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					files.push(new Discord.AttachmentBuilder(buffer, { name: `osu-top-${user.id}-mode${mode}.csv` }));
				}

				//If created by osu-tracking
				if (tracking) {
					await interaction.followUp({ content: `\`${user.name}\` got ${limit} new top play(s)!`, files: files });
				} else {
					logDatabaseQueries(4, 'commands/osu-top.js DBDiscordUsers 2');
					const linkedUser = await DBDiscordUsers.findOne({
						attributes: ['userId'],
						where: {
							osuUserId: user.id
						}
					});

					if (linkedUser && linkedUser.userId) {
						noLinkedAccount = false;
					}

					//Send attachment
					let sentMessage;
					if (noLinkedAccount) {
						sentMessage = await interaction.followUp({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nFeel free to use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`, files: files });
					} else {
						sentMessage = await interaction.followUp({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>`, files: files });
					}
					await sentMessage.react('👤');
					await sentMessage.react('📈');
				}
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else if (err.message === 'Missing Permissions') {
					logDatabaseQueries(4, 'commands/osu-top.js DBOsuGuildTrackers destroy 1');
					DBOsuGuildTrackers.destroy({
						where: {
							channelId: interaction.channel.id
						}
					});
				} else {
					console.error(err);
				}
			});
	} else if (server === 'ripple') {
		fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				}

				let user = rippleToBanchoUser(responseJson[0]);

				const canvasWidth = 1000;
				const canvasHeight = 83 + limit * 41.66666;

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				let elements = [canvas, ctx, user];

				elements = await drawTitle(elements, server, mode, sorting, order);

				elements = await drawTopPlays(elements, server, mode, interaction, sorting, limit, order);

				let scores = elements[3];

				await drawFooter(elements);

				//Create as an attachment
				const files = [new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-top-${user.id}-mode${mode}.png` })];

				if (csv) {
					let csv = new ObjectsToCsv(scores);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					files.push(new Discord.AttachmentBuilder(buffer, { name: `osu-top-${user.id}-mode${mode}.csv` }));
				}

				//Send attachment
				await interaction.followUp({ content: `\`${user.name}\`: <https://ripple.moe/u/${user.id}?mode=${mode}>`, files: files });
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'gatari') {
		let gatariUser = await fetch(`https://api.gatari.pw/users/get?u=${username}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson.users.length) {
					await interaction.followUp(`Couldn't find user \`${username.replace(/`/g, '')}\` on Gatari.`);
					return;
				}

				return responseJson.users[0];
			})
			.catch(async (err) => {
				await interaction.followUp(`An error occured while trying to get user \`${username.replace(/`/g, '')}\`.`);
				console.error(err);
			});

		if (!gatariUser) {
			return;
		}

		let user = {
			id: gatariUser.id,
			name: gatariUser.username,
			country: gatariUser.country,
		};

		const canvasWidth = 1000;
		const canvasHeight = 83 + limit * 41.66666;

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		//Get context and load the image
		const ctx = canvas.getContext('2d');
		const background = await Canvas.loadImage('./other/osu-background.png');
		ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

		let elements = [canvas, ctx, user];

		elements = await drawTitle(elements, server, mode, sorting, order);

		elements = await drawTopPlays(elements, server, mode, interaction, sorting, limit, order);

		let scores = elements[3];

		await drawFooter(elements);

		//Create as an attachment
		const files = [new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-top-${user.id}-mode${mode}.png` })];

		if (csv) {
			let csv = new ObjectsToCsv(scores);
			csv = await csv.toString();
			// eslint-disable-next-line no-undef
			const buffer = Buffer.from(csv);
			//Create as an attachment
			files.push(new Discord.AttachmentBuilder(buffer, { name: `osu-top-${user.id}-mode${mode}.csv` }));
		}

		//Send attachment
		await interaction.followUp({ content: `\`${user.name}\`: <https://osu.gatari.pw/u/${user.id}?mode=${mode}>`, files: files });
	} else if (server === 'tournaments' || server === 'mixed') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		logOsuAPICalls('commands/osu-top.js getUser tournaments');
		osuApi.getUser({ u: username, m: mode })
			.then(async (user) => {
				updateOsuDetailsforUser(interaction.client, user, mode);

				const canvasWidth = 1000;
				const canvasHeight = 83 + limit * 41.66666 + 50;

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				for (let i = 0; i < canvas.height / background.height; i++) {
					for (let j = 0; j < canvas.width / background.width; j++) {
						ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
					}
				}

				let elements = [canvas, ctx, user];

				elements = await drawTitle(elements, server, mode, sorting, order);

				elements = await drawTopPlays(elements, server, mode, interaction, sorting, limit, order, tracking);

				let scores = elements[3];

				await drawFooter(elements);

				//Create as an attachment
				const files = [new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-top-${user.id}-mode${mode}.png` })];

				if (csv) {
					let csv = new ObjectsToCsv(scores);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					files.push(new Discord.AttachmentBuilder(buffer, { name: `osu-top-${user.id}-mode${mode}.csv` }));
				}

				//If created by osu-tracking
				if (tracking) {
					await interaction.followUp({ content: `\`${user.name}\` got ${limit} new top play(s)!`, files: files });
				} else {
					logDatabaseQueries(4, 'commands/osu-top.js DBDiscordUsers 3');
					const linkedUser = await DBDiscordUsers.findOne({
						attributes: ['userId'],
						where: {
							osuUserId: user.id
						}
					});

					if (linkedUser && linkedUser.userId) {
						noLinkedAccount = false;
					}

					//Send attachment
					let sentMessage;
					try {
						if (noLinkedAccount) {
							sentMessage = await interaction.followUp({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nFeel free to use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`, files: files });
						} else {
							sentMessage = await interaction.followUp({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>`, files: files });
						}
					} catch (err) {
						if (err.message === 'Invalid Webhook Token') {
							sentMessage = await interaction.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>`, files: files });
						} else {
							console.error(err);
						}
					}

					try {
						await sentMessage.react('👤');
						await sentMessage.react('📈');
					} catch (err) {
						//Nothing
					}
				}
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	}
}

async function drawTitle(input, server, mode, sorting, order) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let serverDisplay = '';

	if (server !== 'bancho') {
		serverDisplay = `[${server}] `;
	}

	let sortingText = '';

	if (sorting !== null) {
		sortingText = 'sorted by ';
		if (sorting == 'recent') {
			sortingText += 'date ';
		} else if (sorting == 'ar') {
			sortingText += 'AR ';
		} else if (sorting == 'cs') {
			sortingText += 'CS ';
		} else if (sorting == 'drain') {
			sortingText += 'HP ';
		} else if (sorting == 'od') {
			sortingText += 'OD ';
		} else if (sorting == 'bpm') {
			sortingText += 'BPM ';
		} else if (sorting == 'length') {
			sortingText += 'length ';
		} else if (sorting == 'sr') {
			sortingText += 'Star Rating ';
		} else if (sorting == 'acc') {
			sortingText += 'Accuracy ';
		}
	}

	let gameMode = getGameModeName(mode);
	let title;
	let orderText = '';
	if (order) {
		orderText = 'in ascending order ';
	}

	title = `✰ ${serverDisplay}${user.name}'s ${gameMode} top plays ${sortingText}${orderText}✰`;
	if (user.name.endsWith('s') || user.name.endsWith('x')) {
		title = `✰ ${serverDisplay}${user.name}' ${gameMode} top plays ${sortingText}${orderText}✰`;
	}

	roundedRect(ctx, canvas.width / 2 - title.length * 8.5, 500 / 50, title.length * 17, 500 / 12, 5, '28', '28', '28', 0.75);

	// Write the title of the player
	ctx.font = '30px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	fitTextOnMiddleCanvas(ctx, title, 30, 'comfortaa, sans-serif', 41, canvas.width, 25);

	const output = [canvas, ctx, user];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let today = new Date().toLocaleDateString();

	try {
		ctx.font = '12px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 5);
	} catch (err) {
		console.error(input);
		console.error(err);
	}

	const output = [canvas, ctx, user];
	return output;
}

async function drawTopPlays(input, server, mode, interaction, sorting, showLimit, order, tracking) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	let scores = [];

	let limit = showLimit;

	if (sorting) {
		limit = 100;
	}

	let totalRankedPP = 0;
	let rankedBonusPP = 0;
	let totalUnrankedPP = 0;
	let unrankedBonusPP = 0;

	if (server === 'bancho') {
		logOsuAPICalls('commands/osu-top.js getUserBest bancho');
		scores = await osuApi.getUserBest({ u: user.name, m: mode, limit: limit });
	} else if (server === 'ripple') {
		const response = await fetch(`https://www.ripple.moe/api/get_user_best?u=${user.name}&m=${mode}&limit=${limit}`);
		const responseJson = await response.json();
		if (!responseJson[0]) {
			return await interaction.followUp(`Could not find user \`${user.name.replace(/`/g, '')}\`.`);
		}

		for (let i = 0; i < responseJson.length; i++) {

			let score = rippleToBanchoScore(responseJson[i]);

			scores.push(score);
		}
	} else if (server === 'gatari') {
		let gatariUserBest = await fetch(`https://api.gatari.pw/user/scores/best?id=${user.id}&l=${limit}&p=1&mode=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson.scores.length) {
					await interaction.followUp(`Couldn't find user best for \`${user.name.replace(/`/g, '')}\` on Gatari.`);
					return;
				}

				return responseJson.scores;
			})
			.catch(async (err) => {
				await interaction.followUp(`An error occured while trying to get user \`${user.name.replace(/`/g, '')}\`.`);
				console.error(err);
			});

		if (!gatariUserBest) {
			return;
		}

		for (let i = 0; i < gatariUserBest.length; i++) {
			let gatariScore = gatariUserBest[i];

			gatariScore.username = user.name;
			gatariScore.user_id = user.id;
			gatariScore.beatmap_id = gatariScore.beatmap.beatmap_id;

			let score = gatariToBanchoScore(gatariScore);

			scores.push(score);
		}
	} else if (server === 'tournaments') {
		let topPlayData = await getTournamentTopPlayData(user.id, mode);

		totalRankedPP = topPlayData.totalRankedPP;
		rankedBonusPP = topPlayData.rankedBonusPP;
		totalUnrankedPP = topPlayData.totalUnrankedPP;
		unrankedBonusPP = topPlayData.unrankedBonusPP;
		scores = topPlayData.scores;
	} else if (server === 'mixed') {
		let banchoTopPlays = await osuApi.getUserBest({ u: user.name, m: mode, limit: 100 });

		let topPlayData = await getTournamentTopPlayData(user.id, mode, true);

		let tournamentTopPlays = topPlayData.scores;

		scores = banchoTopPlays.concat(tournamentTopPlays);

		scores.sort((a, b) => {
			return parseFloat(b.pp) - parseFloat(a.pp);
		});

		// Remove duplicates
		for (let i = 0; i < scores.length; i++) {
			for (let j = i + 1; j < scores.length; j++) {
				if (scores[i].beatmapId == scores[j].beatmapId) {
					scores.splice(j, 1);
					j--;
				}
			}
		}

		// Calculate total pp
		let banchoTotalPP = parseFloat(user.pp.raw);

		// Calculate the part of the pp that is coming from the bancho top 100
		let banchoTopPlaysPP = 0;

		for (let i = 0; i < banchoTopPlays.length; i++) {
			banchoTopPlaysPP += parseFloat(banchoTopPlays[i].pp) * Math.pow(0.95, (i));
		}

		let additionalPP = banchoTotalPP - banchoTopPlaysPP;

		// Calculate the pp with the new scores
		let newScoresPP = 0;

		for (let i = 0; i < scores.length && i < 100; i++) {
			newScoresPP += parseFloat(scores[i].pp) * Math.pow(0.95, (i));
		}

		totalRankedPP = newScoresPP + additionalPP;
	}


	let sortedScores = [];
	let beatmaps = [];

	for (let i = 0; i < scores.length; i++) {
		scores[i].acc = getAccuracy(scores[i], mode) * 100;
	}

	if (sorting && sorting == 'recent') {
		for (let i = 0; i < scores.length; i++) {
			scores[i].best = i + 1;
		}

		scores.sort((a, b) => {
			return Date.parse(b.raw_date) - Date.parse(a.raw_date);
		});
	} else if (sorting && sorting == 'acc') {
		scores = scores.sort((a, b) => {
			return parseFloat(b.acc) - parseFloat(a.acc);
		});
	}

	let now = new Date();
	if (now.getUTCDate() === 1 && now.getUTCMonth() === 3) {
		beatmaps.push(await getOsuBeatmap({ beatmapId: '658127', modBits: 16 }));
	}

	for (let i = 0; i < limit && i < scores.length; i++) {
		let dbBeatmap = await getOsuBeatmap({ beatmapId: scores[i].beatmapId, modBits: scores[i].raw_mods });
		if (dbBeatmap) {
			beatmaps.push(dbBeatmap);
		} else {
			scores.splice(i, 1);
			i--;
		}
	}

	if (sorting) {
		if (sorting == 'ar') {
			beatmaps.sort((a, b) => {
				return parseFloat(b.approachRate) - parseFloat(a.approachRate);
			});
		} else if (sorting == 'cs') {
			beatmaps.sort((a, b) => {
				return parseFloat(b.circleSize) - parseFloat(a.circleSize);
			});
		} else if (sorting == 'od') {
			beatmaps.sort((a, b) => {
				return parseFloat(b.overallDifficulty) - parseFloat(a.overallDifficulty);
			});
		} else if (sorting == 'drain') {
			beatmaps.sort((a, b) => {
				return parseFloat(b.hpDrain) - parseFloat(a.hpDrain);
			});
		} else if (sorting == 'bpm') {
			beatmaps.sort((a, b) => {
				return parseFloat(b.bpm) - parseFloat(a.bpm);
			});
		} else if (sorting == 'length') {
			beatmaps.sort((a, b) => {
				return parseFloat(b.totalLength) - parseFloat(a.totalLength);
			});
		} else if (sorting == 'sr') {
			beatmaps.sort((a, b) => {
				return parseFloat(b.difficultyRating) - parseFloat(a.difficultyRating);
			});
		}
	}


	if (now.getUTCDate() === 1 && now.getUTCMonth() === 3) {
		sortedScores.push({
			score: '150551330',
			user: {
				name: user.name,
				id: user.id
			},
			beatmapId: '658127',
			counts: {
				'50': '0',
				'100': '7',
				'300': '1965',
				geki: '223',
				katu: '6',
				miss: '1'
			},
			maxCombo: '2358',
			perfect: false,
			raw_date: '2016-01-02 23:49:11',
			rank: 'A',
			pp: '727',
			hasReplay: false,
			raw_mods: 16,
			beatmap: undefined,
			matchName: 'WYSI',
		});
	}

	for (let i = 0; i < beatmaps.length && i < limit; i++) {
		for (let j = 0; j < scores.length; j++) {
			if (beatmaps[i].beatmapId === scores[j].beatmapId.toString()) {
				sortedScores.push(scores[j]);
			}
		}
	}

	if (order) {
		sortedScores.reverse();
		beatmaps.reverse();
	}

	let exportScores = [];

	for (let i = 0; i < sortedScores.length && i < showLimit; i++) {
		if ((server === 'tournaments' || server === 'mixed') && sortedScores[i].beatmap) {
			exportScores.push({
				score: sortedScores[i].score,
				osuUserId: sortedScores[i].user.id,
				beatmapId: sortedScores[i].beatmapId,
				raw_date: sortedScores[i].raw_date,
				rank: sortedScores[i].rank,
				pp: sortedScores[i].pp,
				raw_mods: sortedScores[i].raw_mods,
				title: sortedScores[i].beatmap.title,
				artist: sortedScores[i].beatmap.artist,
				difficulty: sortedScores[i].beatmap.difficulty,
				mode: sortedScores[i].beatmap.mode,
				approvalStatus: sortedScores[i].beatmap.approvalStatus,
			});
		} else {
			exportScores.push({
				score: sortedScores[i].score,
				osuUserId: sortedScores[i].user.id,
				beatmapId: sortedScores[i].beatmapId,
				raw_date: sortedScores[i].raw_date,
				rank: sortedScores[i].rank,
				pp: sortedScores[i].pp,
				raw_mods: sortedScores[i].raw_mods,
			});
		}

		let red = '70';
		let green = '57';
		let blue = '63';

		if (server === 'mixed' && sortedScores[i].matchName) {
			red = '63';
			green = '78';
			blue = '96';
		}

		roundedRect(ctx, canvas.width / 70, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 35, 500 / 13, 500 / 70, red, green, blue, 0.75);

		const rankImage = await Canvas.loadImage(getRankImage(sortedScores[i].rank));
		ctx.drawImage(rankImage, canvas.width / 35, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 - 500 / 31.25 / 2, 32, 16);

		ctx.font = 'bold 18px comfortaa, sans-serif';
		ctx.fillStyle = '#FF66AB';
		ctx.textAlign = 'right';
		ctx.fillText(humanReadable(Math.round(sortedScores[i].pp)) + 'pp', (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

		let beatmapTitle = `${beatmaps[i].title} by ${beatmaps[i].artist}`;
		const maxSize = canvas.width / 250 * 19;
		if (beatmapTitle.length > maxSize) {
			beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
		}

		//Write Difficulty per map
		ctx.font = 'bold 10px comfortaa, sans-serif';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'left';
		ctx.fillText(beatmaps[i].difficulty, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);

		let today = new Date();

		const todayMilliseconds = today.getTime();	//Get the time (milliseconds since January 1, 1970)

		const scoreMilliseconds = Date.parse(sortedScores[i].raw_date); //Get the time (milliseconds since January 1, 1970)

		let timeDifference = todayMilliseconds - scoreMilliseconds;

		let achievedTime = new Date().toLocaleDateString();

		if (timeDifference < 60000) { //if achieved in the last minute
			achievedTime = `${Math.round(timeDifference / 1000)} second(s) ago`;
		} else if (timeDifference < 3600000) { //if achieved in the last hour
			achievedTime = `${Math.round(timeDifference / 60000)} minute(s) ago`;
		} else if (timeDifference < 86400000) { //if achieved in the last 24 hours
			achievedTime = `${Math.round(timeDifference / 3600000)} hour(s) ago`;
		} else if (timeDifference < 2678400000) { //if achieved in the last 31 days
			achievedTime = `${Math.round(timeDifference / 86400000)} day(s) ago`;
		} else if (timeDifference < 31536000000) { //if achieved in the last year
			achievedTime = `${Math.round(timeDifference / 2678400000)} month(s) ago`;
		} else { //else achieved years ago
			achievedTime = `${Math.round(timeDifference / 31536000000)} year(s) ago`;
		}

		//Write achieved on per map
		ctx.font = 'bold 10px comfortaa, sans-serif';
		ctx.fillStyle = '#A08C95';
		ctx.textAlign = 'left';
		if (server === 'tournaments' || server === 'mixed' && sortedScores[i].matchName) {
			ctx.fillText(`${achievedTime} in ${sortedScores[i].matchName}`, (canvas.width / 35) * 3 + ctx.measureText(beatmaps[i].difficulty).width + canvas.width / 100, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		} else if (server === 'mixed') {
			ctx.fillText(`${achievedTime} on bancho`, (canvas.width / 35) * 3 + ctx.measureText(beatmaps[i].difficulty).width + canvas.width / 100, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		} else {
			ctx.fillText(achievedTime, (canvas.width / 35) * 3 + ctx.measureText(beatmaps[i].difficulty).width + canvas.width / 100, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		}

		let combo;

		if (mode === 3) {
			combo = `(${sortedScores[i].maxCombo}x)`;
		} else {
			combo = `(${sortedScores[i].maxCombo}/${beatmaps[i].maxCombo})`;
		}

		// Write accuracy and combo per map
		ctx.font = 'bold 10px comfortaa, sans-serif';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'right';
		ctx.fillText(combo, (canvas.width / 28) * 23.4, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		ctx.fillText(Math.round(sortedScores[i].acc * 100) / 100 + '%', (canvas.width / 28) * 24.75, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);

		if (tracking) {
			// Write hits
			ctx.font = 'bold 10px comfortaa, sans-serif';
			ctx.fillStyle = '#FFCC22';
			ctx.textAlign = 'right';

			let hits = `${sortedScores[i].counts['300']}/${sortedScores[i].counts['100']}/${sortedScores[i].counts['50']}/${sortedScores[i].counts.miss}`;
			if (mode === 1) {
				hits = `${sortedScores[i].counts['300']}/${sortedScores[i].counts['100']}/${sortedScores[i].counts.miss}`;
			} else if (mode === 2) {
				hits = `${sortedScores[i].counts['300']}/${sortedScores[i].counts['100']}/${sortedScores[i].counts['katu']}/${sortedScores[i].counts.miss}`;
			} else if (mode === 3) {
				hits = `${sortedScores[i].counts['geki']}/${sortedScores[i].counts['300']}/${sortedScores[i].counts['katu']}/${sortedScores[i].counts['100']}/${sortedScores[i].counts['50']}/${sortedScores[i].counts.miss}`;
			}

			ctx.fillText(hits, (canvas.width / 28) * 23.4 - ctx.measureText(combo).width - 10, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		}


		const mods = getMods(sortedScores[i].raw_mods);

		let sortingText = '';
		if (sorting !== null) {
			if (sorting == 'ar') {
				sortingText = ` (AR: ${beatmaps[i].approachRate})`;
			} else if (sorting == 'cs') {
				sortingText = ` (CS: ${beatmaps[i].circleSize})`;
			} else if (sorting == 'drain') {
				sortingText = ` (HP: ${beatmaps[i].drain})`;
			} else if (sorting == 'od') {
				sortingText = ` (OD: ${beatmaps[i].overallDifficulty})`;
			} else if (sorting == 'bpm') {
				sortingText = ` (BPM: ${beatmaps[i].bpm})`;
			} else if (sorting == 'length') {
				const totalLengthSeconds = (beatmaps[i].totalLength % 60) + '';
				const totalLengthMinutes = (beatmaps[i].totalLength - beatmaps[i].totalLength % 60) / 60;
				const totalLength = totalLengthMinutes + ':' + Math.round(totalLengthSeconds).toString().padStart(2, '0');
				sortingText = ` (Length: ${totalLength})`;
			} else if (sorting == 'sr') {
				sortingText = ` (${Math.round(beatmaps[i].starRating * 100) / 100}*)`;
			} else if (sorting == 'recent') {
				sortingText = ` (#${sortedScores[i].best})`;
			}
		}

		//Write title and sortingText per map
		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'left';
		ctx.fillText(beatmapTitle + sortingText, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

		//Write mods per map
		for (let j = 0; j < mods.length; j++) {
			const modImage = await Canvas.loadImage(getModImage(mods[mods.length - j - 1]));
			ctx.drawImage(modImage, (canvas.width / 28) * 24.75 - (canvas.width / 1000 * 23) * (j + 1), 500 / 8 + (500 / 12) * i + (500 / 12) / 5, canvas.width / 1000 * 23, 500 / 125 * 4);
		}
	}

	//Write the tournament pp
	if (server === 'tournaments' || server === 'mixed') {
		logDatabaseQueries(4, 'commands/osu-top.js DBDiscordUsers 4');
		let discordUsers = await DBDiscordUsers.findAll({
			attributes: ['osuPP', 'taikoPP', 'catchPP', 'maniaPP', 'osuRank'],
		});

		//Find the closest users to the PP values
		let closestUnrankedPPUser = discordUsers[0];
		let closestRankedPPUser = discordUsers[0];
		for (let i = 0; i < discordUsers.length; i++) {
			let currentDiscordUserPP = discordUsers[i].osuPP;
			let closestUnrankedPP = closestUnrankedPPUser.osuPP;
			let closestRankedPP = closestRankedPPUser.osuPP;

			if (mode === 1) {
				currentDiscordUserPP = discordUsers[i].taikoPP;
				closestUnrankedPP = closestUnrankedPPUser.taikoPP;
				closestRankedPP = closestRankedPPUser.taikoPP;
			} else if (mode === 2) {
				currentDiscordUserPP = discordUsers[i].catchPP;
				closestUnrankedPP = closestUnrankedPPUser.catchPP;
				closestRankedPP = closestRankedPPUser.catchPP;
			} else if (mode === 3) {
				currentDiscordUserPP = discordUsers[i].maniaPP;
				closestUnrankedPP = closestUnrankedPPUser.maniaPP;
				closestRankedPP = closestRankedPPUser.maniaPP;
			}

			if (Math.abs(currentDiscordUserPP - totalUnrankedPP) < Math.abs(closestUnrankedPP - totalUnrankedPP)) {
				closestUnrankedPPUser = discordUsers[i];
			}

			if (Math.abs(currentDiscordUserPP - totalRankedPP) < Math.abs(closestRankedPP - totalRankedPP)) {
				closestRankedPPUser = discordUsers[i];
			}
		}

		ctx.font = '15px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'left';
		if (server === 'tournaments') {
			ctx.fillText(`Total pp from tournaments (including unranked): ${humanReadable(Math.round(totalUnrankedPP))}pp (Bonus pp: ${humanReadable(Math.round(unrankedBonusPP))}) -> ~#${closestUnrankedPPUser.osuRank}`, canvas.width / 140, canvas.height - 50);
			ctx.fillText(`Total pp from tournaments (only ranked): ${humanReadable(Math.round(totalRankedPP))}pp (Bonus pp: ${humanReadable(Math.round(rankedBonusPP))}) -> ~#${closestRankedPPUser.osuRank}`, canvas.width / 140, canvas.height - 25);
		} else if (server === 'mixed') {
			ctx.fillText(`Total pp on bancho: ${humanReadable(Math.round(user.pp.raw))}pp -> ~#${user.pp.rank}`, canvas.width / 140, canvas.height - 50);
			ctx.fillText(`Total pp from bancho & tournaments (only ranked): ${humanReadable(Math.round(totalRankedPP))}pp -> ~#${closestRankedPPUser.osuRank}`, canvas.width / 140, canvas.height - 25);
		}
	}

	const output = [canvas, ctx, user, exportScores];
	return output;
}

async function getTournamentTopPlayData(osuUserId, mode, mixed = false) {

	let where = {
		osuUserId: osuUserId,
		mode: mode,
		tourneyMatch: true,
		score: {
			[Op.gte]: 10000,
		},
	};

	if (mixed) {
		where.scoringType = 3;
	}

	//Get all scores from tournaments
	logDatabaseQueries(4, 'commands/osu-top.js DBOsuMultiGameScores');
	let multiScores = await DBOsuMultiGameScores.findAll({
		attributes: [
			'id',
			'score',
			'gameRawMods',
			'rawMods',
			'teamType',
			'pp',
			'beatmapId',
			'createdAt',
			'osuUserId',
			'count50',
			'count100',
			'count300',
			'countGeki',
			'countKatu',
			'countMiss',
			'maxCombo',
			'perfect',
			'mode',
			'matchId',
			'gameStartDate',
		],
		where: where
	});

	logDatabaseQueries(4, 'commands/osu-top.js DBOsuMultiMatches 2');
	let multiMatches = await DBOsuMultiMatches.findAll({
		attributes: [
			'matchId',
			'matchName',
		],
		where: {
			matchId: {
				[Op.in]: multiScores.map(score => score.matchId)
			}
		}
	});

	for (let i = 0; i < multiScores.length; i++) {
		if (multiScores[i].teamType === 1 || multiScores[i].teamType === 3) {
			multiScores.splice(i, 1);
			i--;
		}

		multiScores[i].matchName = multiMatches.find(match => match.matchId === multiScores[i].matchId).matchName;
	}

	//Translate the scores to bancho scores
	for (let i = 0; i < multiScores.length; i++) {
		if (parseInt(multiScores[i].gameRawMods) % 2 === 1) {
			multiScores[i].gameRawMods = parseInt(multiScores[i].gameRawMods) - 1;
		}
		if (parseInt(multiScores[i].rawMods) % 2 === 1) {
			multiScores[i].rawMods = parseInt(multiScores[i].rawMods) - 1;
		}
		multiScores[i] = await multiToBanchoScore(multiScores[i]);

		if (!multiScores[i].pp || parseFloat(multiScores[i].pp) > 2000 || !parseFloat(multiScores[i].pp)) {
			multiScores.splice(i, 1);
			i--;
			continue;
		}
	}

	//Sort scores by pp
	multiScores.sort((a, b) => parseFloat(b.pp) - parseFloat(a.pp));

	//Remove duplicates by beatmapId
	for (let i = 0; i < multiScores.length; i++) {
		for (let j = i + 1; j < multiScores.length; j++) {
			if (multiScores[i].beatmapId === multiScores[j].beatmapId) {
				multiScores.splice(j, 1);
				j--;
			}
		}
	}

	//Calculate total pp values
	let beatmapSets = [];
	let rankedBeatmapSets = [];
	let unrankedPP = 0;
	let rankedPP = 0;
	let unrankedPlayCounter = 1;
	let rankedPlayCounter = 1;

	logDatabaseQueries(4, 'commands/osu-top.js DBOsuBeatmaps 1');
	let dbBeatmaps = await DBOsuBeatmaps.findAll({
		attributes: [
			'id',
			'beatmapId',
			'beatmapsetId',
			'approvalStatus',
			'mods',
			'updatedAt',
			'starRating',
			'maxCombo',
			'mode',
		],
		where: {
			beatmapId: {
				[Op.in]: multiScores.map(score => score.beatmapId)
			},
			mods: 0
		}
	});

	for (let i = 0; i < multiScores.length; i++) {
		let dbBeatmap = dbBeatmaps.find(dbBeatmap => parseInt(dbBeatmap.beatmapId) === multiScores[i].beatmapId);

		multiScores[i].beatmap = await getOsuBeatmap({ beatmapId: multiScores[i].beatmapId, beatmap: dbBeatmap });

		if (mixed) {
			if (!multiScores[i].beatmap || multiScores[i].beatmap.approvalStatus !== 'Approved' && multiScores[i].beatmap.approvalStatus !== 'Ranked') {
				multiScores.splice(i, 1);
				i--;
				continue;
			}
		}

		if (multiScores[i].beatmap && !beatmapSets.includes(multiScores[i].beatmap.beatmapsetId)) {
			beatmapSets.push(multiScores[i].beatmap.beatmapsetId);

			if (multiScores[i].beatmap.approvalStatus === 'Approved' || multiScores[i].beatmap.approvalStatus === 'Ranked') {
				rankedBeatmapSets.push(multiScores[i].beatmap.beatmapsetId);
			}
		}

		if (multiScores[i].pp) {
			unrankedPP += parseFloat(multiScores[i].pp) * Math.pow(0.95, (unrankedPlayCounter - 1));
			unrankedPlayCounter++;

			if (multiScores[i].beatmap && !getMods(multiScores[i].raw_mods).includes('RX') && (multiScores[i].beatmap.approvalStatus === 'Approved' || multiScores[i].beatmap.approvalStatus === 'Ranked')) {
				rankedPP += parseFloat(multiScores[i].pp) * Math.pow(0.95, (rankedPlayCounter - 1));
				rankedPlayCounter++;
			}
		}
	}

	let unrankedBonusPP = 416.6667 * (1 - (Math.pow(0.9994, beatmapSets.length)));
	let rankedBonusPP = 416.6667 * (1 - (Math.pow(0.9994, rankedBeatmapSets.length)));

	let totalRankedPP = rankedPP + rankedBonusPP;
	let totalUnrankedPP = unrankedPP + unrankedBonusPP;

	let data = {
		unrankedBonusPP: unrankedBonusPP,
		rankedBonusPP: rankedBonusPP,
		totalRankedPP: totalRankedPP,
		totalUnrankedPP: totalUnrankedPP,
		scores: []
	};

	//Feed the scores into the array
	for (let i = 0; i < multiScores.length && i < 100; i++) {
		if (multiScores[i].pp) {
			data.scores.push(multiScores[i]);
		}
	}

	return data;
}