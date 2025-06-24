const { DBDiscordUsers, DBOsuMultiGameScores, DBOsuMultiMatches, DBOsuMultiGames } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('@napi-rs/canvas');
const { roundedRect, rippleToBanchoUser, getOsuUserServerMode, getMessageUserDisplayname, getIDFromPotentialOsuLink, populateMsgFromInteraction, getOsuBeatmap, getMapListCover, awaitWebRequestPermission, logOsuAPICalls } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError, matchMakingAcronyms } = require('../config.json');
const Sequelize = require('sequelize');
const ObjectsToCsv = require('objects-to-csv');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-mostplayed',
	description: 'Sends an info card about the most played maps of the specified player',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-mostplayed')
		.setNameLocalizations({
			'de': 'osu-meistgespielt',
			'en-GB': 'osu-mostplayed',
			'en-US': 'osu-mostplayed',
		})
		.setDescription('Sends an info card about the most played maps of the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über die am meisten gespielten maps des angegebenen Spielers',
			'en-GB': 'Sends an info card about the most played maps of the specified player',
			'en-US': 'Sends an info card about the most played maps of the specified player',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('user')
				.setNameLocalizations({
					'de': 'spieler',
					'en-GB': 'user',
					'en-US': 'user',
				})
				.setDescription('Get the stats for a user')
				.setDescriptionLocalizations({
					'de': 'Holen Sie sich die Statistiken für einen Benutzer',
					'en-GB': 'Get the stats for a user',
					'en-US': 'Get the stats for a user',
				})
				.addIntegerOption(option =>
					option
						.setName('amount')
						.setNameLocalizations({
							'de': 'menge',
							'en-GB': 'amount',
							'en-US': 'amount',
						})
						.setDescription('The amount of most played maps to be displayed')
						.setDescriptionLocalizations({
							'de': 'Die Anzahl der am meisten gespielten maps, die angezeigt werden sollen',
							'en-GB': 'The amount of most played maps to be displayed',
							'en-US': 'The amount of most played maps to be displayed',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('server')
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
							{ name: 'Bancho', value: 'b' },
							{ name: 'Ripple', value: 'r' },
							{ name: 'Tournaments', value: 'tournaments' },
						)
				)
				.addStringOption(option =>
					option
						.setName('mode')
						.setNameLocalizations({
							'de': 'modus',
							'en-GB': 'mode',
							'en-US': 'mode',
						})
						.setDescription('The gamemode you want to get the leaderboard from (tourney only)')
						.setDescriptionLocalizations({
							'de': 'Der Gamemode, von dem Sie die Bestenliste erhalten möchten (nur Tourney)',
							'en-GB': 'The gamemode you want to get the leaderboard from (tourney only)',
							'en-US': 'The gamemode you want to get the leaderboard from (tourney only)',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'Standard', value: 'Standard' },
							{ name: 'Taiko', value: 'Taiko' },
							{ name: 'Catch the Beat', value: 'Catch the Beat' },
							{ name: 'Mania', value: 'Mania' },
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
		)
		.addSubcommand(subcommand =>
			subcommand.setName('tourneybeatmaps')
				.setNameLocalizations({
					'de': 'turnierbeatmaps',
					'en-GB': 'tourneybeatmaps',
					'en-US': 'tourneybeatmaps',
				})
				.setDescription('Get the stats for most played beatmaps in tournaments')
				.setDescriptionLocalizations({
					'de': 'Erhalte die Statistiken für die meistgespielten Beatmaps in Turnieren',
					'en-GB': 'Get the stats for most played beatmaps in tournaments',
					'en-US': 'Get the stats for most played beatmaps in tournaments',
				})
				.addIntegerOption(option =>
					option.setName('amount')
						.setNameLocalizations({
							'de': 'anzahl',
							'en-GB': 'amount',
							'en-US': 'amount',
						})
						.setDescription('The amount of most played maps to be displayed')
						.setDescriptionLocalizations({
							'de': 'Die Anzahl der am meisten gespielten Maps, die angezeigt werden sollen',
							'en-GB': 'The amount of most played maps to be displayed',
							'en-US': 'The amount of most played maps to be displayed',
						})
						.setRequired(false)
				)
				.addIntegerOption(option =>
					option.setName('page')
						.setNameLocalizations({
							'de': 'seite',
							'en-GB': 'page',
							'en-US': 'page',
						})
						.setDescription('The page of the results')
						.setDescriptionLocalizations({
							'de': 'Die Seite der Ergebnisse',
							'en-GB': 'The page of the results',
							'en-US': 'The page of the results',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option.setName('dontfiltermm')
						.setNameLocalizations({
							'de': 'mmnichtfiltern',
							'en-GB': 'dontfiltermm',
							'en-US': 'dontfiltermm',
						})
						.setDescription('Should matchmaking (ETX/o!mm) matches not be filtered out')
						.setDescriptionLocalizations({
							'de': 'Sollten Matchmaking (ETX/o!mm) Matches nicht gefiltert werden',
							'en-GB': 'Should matchmaking (ETX/o!mm) matches not be filtered out',
							'en-US': 'Should matchmaking (ETX/o!mm) matches not be filtered out',
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
						.setDescription('Should the results be displayed as a csv file')
						.setDescriptionLocalizations({
							'de': 'Sollen die Ergebnisse als csv Datei angezeigt werden',
							'en-GB': 'Should the results be displayed as a csv file',
							'en-US': 'Should the results be displayed as a csv file',
						})
						.setRequired(false)
				)
		),
	// {
	// 	'name': 'modpool',
	// 	'description': 'The modpool the maps appeared in',
	// 	'type': 3,
	// 	'required': false,
	// 	'choices': [
	// 		{
	// 			'name': 'NM',
	// 			'value': 'NM',
	// 		},
	// 		{
	// 			'name': 'HD',
	// 			'value': 'HD',
	// 		},
	// 		{
	// 			'name': 'HR',
	// 			'value': 'HR',
	// 		},
	// 		{
	// 			'name': 'DT',
	// 			'value': 'DT',
	// 		},
	// 		{
	// 			'name': 'FM',
	// 			'value': 'FM',
	// 		}
	// 	]
	// },
	async execute(interaction, msg, args) {
		//TODO: Remove message code and replace with interaction code
		if (!interaction) {
			return;
		}

		if (interaction.options.getSubcommand() === 'user') {
			msg = await populateMsgFromInteraction(interaction);

			try {
				//TODO: Deferreply
				//await interaction.deferReply();
				await interaction.reply('Processing...');
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
					if (interaction.options._hoistedOptions[i].name === 'server') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else if (interaction.options._hoistedOptions[i].name === 'amount') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else if (interaction.options._hoistedOptions[i].name !== 'mode') {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}

			let mode = interaction.options.getString('mode');

			const commandConfig = await getOsuUserServerMode(msg, args);
			const commandUser = commandConfig[0];
			const server = commandConfig[1];

			let limit = 10;

			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('--') && !isNaN(args[i].replace('--', ''))) {
					limit = parseInt(args[i].replace('--', ''));
					if (limit > 100) {
						limit = 100;
					} else if (limit < 1) {
						limit = 1;
					}
					args.splice(i, 1);
					i--;
				}
			}

			if (!args[0]) {
				//Get profile by author if no argument
				if (commandUser && commandUser.osuUserId) {
					getMostPlayed(msg, commandUser.osuUserId, server, mode, false, limit);
				} else {
					const userDisplayName = await getMessageUserDisplayname(msg);
					getMostPlayed(msg, userDisplayName, server, mode, false, limit);
				}
			} else {
				//Get profiles by arguments
				for (let i = 0; i < args.length; i++) {
					if (args[i].startsWith('<@') && args[i].endsWith('>')) {
						//TODO: add attributes
						const discordUser = await DBDiscordUsers.findOne({
							where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
						});

						if (discordUser && discordUser.osuUserId) {
							getMostPlayed(msg, discordUser.osuUserId, server, mode, false, limit);
						} else {
							await msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${msg.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
							getMostPlayed(msg, args[i], server, mode, false, limit);
						}
					} else {
						if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
							if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
								getMostPlayed(msg, getIDFromPotentialOsuLink(args[i]), server, mode, true, limit);
							} else {
								getMostPlayed(msg, getIDFromPotentialOsuLink(args[i]), server, mode, false, limit);
							}
						} else {
							getMostPlayed(msg, getIDFromPotentialOsuLink(args[i]), server, mode, false, limit);
						}
					}
				}
			}
		} else if (interaction.options.getSubcommand() === 'tourneybeatmaps') {
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

			let amount = 10;
			if (interaction.options.getInteger('amount')) {
				amount = interaction.options.getInteger('amount');
			}

			if (amount < 5) {
				amount = 5;
			} else if (amount > 100) {
				amount = 100;
			}

			let page = 1;
			if (interaction.options.getInteger('page')) {
				page = interaction.options.getInteger('page');
			}

			let csv = false;
			if (interaction.options.getBoolean('csv')) {
				csv = interaction.options.getBoolean('csv');
			}

			let mostplayed = null;

			if (interaction.options.getBoolean('dontfiltermm')) {
				mostplayed = await DBOsuMultiGames.findAll({
					attributes: ['beatmapId', [Sequelize.fn('SUM', Sequelize.col('scores')), 'playcount']],
					where: {
						warmup: false,
						beatmapId: {
							[Op.gt]: 0,
						},
						tourneyMatch: true,
					},
					group: ['beatmapId'],
					order: [[Sequelize.fn('SUM', Sequelize.col('scores')), 'DESC']],
				});

				mostplayed = mostplayed.map(item => item.dataValues);
			} else {
				let mostplayedGrouped = await DBOsuMultiGames.findAll({
					attributes: ['matchId', 'beatmapId', [Sequelize.fn('SUM', Sequelize.col('scores')), 'playcount']],
					where: {
						warmup: false,
						beatmapId: {
							[Op.gt]: 0,
						},
						tourneyMatch: true,
					},
					group: ['matchId', 'beatmapId'],
					order: [[Sequelize.fn('SUM', Sequelize.col('scores')), 'DESC']],
				});

				let matchIds = [...new Set(mostplayedGrouped.map(item => item.matchId))];

				let matchMakingMatchData = await DBOsuMultiMatches.findAll({
					attributes: ['matchId'],
					where: {
						matchId: {
							[Op.in]: matchIds
						},
						acronym: {
							[Op.in]: matchMakingAcronyms
						},
					},
					group: ['matchId']
				});

				let matchMakingMatchIds = [...new Set(matchMakingMatchData.map(item => item.matchId))];

				mostplayed = await DBOsuMultiGames.findAll({
					attributes: ['beatmapId', [Sequelize.fn('SUM', Sequelize.col('scores')), 'playcount']],
					where: {
						warmup: false,
						beatmapId: {
							[Op.gt]: 0,
						},
						tourneyMatch: true,
						matchId: {
							[Op.notIn]: matchMakingMatchIds,
						},
					},
					group: ['beatmapId'],
					order: [[Sequelize.fn('SUM', Sequelize.col('scores')), 'DESC']],
				});

				mostplayed = mostplayed.map(item => item.dataValues);
			}

			let data = [];
			for (let i = 0; i < mostplayed.length; i++) {
				data.push({
					beatmapId: mostplayed[i].beatmapId,
					playcount: mostplayed[i].playcount,
				});
			}

			let totalPages = Math.ceil(data.length / amount);

			if (page > totalPages) {
				page = totalPages;
			}

			let dataOnPage = data.slice((page - 1) * amount, page * amount);

			for (let i = 0; i < dataOnPage.length; i++) {
				let beatmap = await getOsuBeatmap({ beatmapId: dataOnPage[i].beatmapId });
				if (beatmap) {
					dataOnPage[i].title = beatmap.title;
					dataOnPage[i].artist = beatmap.artist;
					dataOnPage[i].mapper = beatmap.mapper;
					dataOnPage[i].difficulty = beatmap.difficulty;
					dataOnPage[i].beatmapsetId = beatmap.beatmapsetId;
					dataOnPage[i].noModMap = beatmap.noModMap;
					dataOnPage[i].hiddenMap = beatmap.hiddenMap;
					dataOnPage[i].hardRockMap = beatmap.hardRockMap;
					dataOnPage[i].doubleTimeMap = beatmap.doubleTimeMap;
					dataOnPage[i].freeModMap = beatmap.freeModMap;
					dataOnPage[i].approvalStatus = beatmap.approvalStatus;
				} else {
					dataOnPage[i].title = 'Unavailable';
					dataOnPage[i].artist = 'Unavailable';
					dataOnPage[i].mapper = 'Unavailable';
					dataOnPage[i].difficulty = 'Unavailable';
					dataOnPage[i].beatmapsetId = 'Unavailable';
					dataOnPage[i].noModMap = false;
					dataOnPage[i].hiddenMap = false;
					dataOnPage[i].hardRockMap = false;
					dataOnPage[i].doubleTimeMap = false;
					dataOnPage[i].freeModMap = false;
					dataOnPage[i].approvalStatus = 'Unavailable';
				}
			}

			const canvasWidth = 1000;
			const canvasHeight = 83 + dataOnPage.length * 41.66666;

			Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');
			Canvas.GlobalFonts.registerFromPath('./other/arial unicode ms.otf', 'arial');

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

			let elements = [canvas, ctx, dataOnPage];

			elements = await drawTitle(elements, 'tourneybeatmaps', dataOnPage);

			for (let i = 0; i < dataOnPage.length; i++) {
				// Draw the rectangle
				roundedRect(ctx, canvas.width / 13, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 10, 500 / 13, 500 / 70, '70', '57', '63', 0.75);

				// draw another rectangle for the image
				roundedRect(ctx, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38, 500 / 70, '70', '57', '63', 0.75);
				ctx.save();
				ctx.clip();
				try {
					let beatmapImage = await getMapListCover(dataOnPage[i].beatmapsetId, dataOnPage[i].beatmapId, interaction.client);
					ctx.drawImage(beatmapImage, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38);
				} catch (err) {
					// Nothing
				}
				ctx.restore();
				ctx.font = 'bold 18px comfortaa, arial';
				ctx.fillStyle = '#FF66AB';
				ctx.textAlign = 'right';

				// Draw title and difficutly per beatmap
				let beatmapTitle = `${dataOnPage[i].title} [${dataOnPage[i].difficulty}] by ${dataOnPage[i].artist}`;
				const maxSize = canvas.width / 250 * 19;
				if (beatmapTitle.length > maxSize) {
					beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
				}
				ctx.font = 'bold 15px comfortaa, arial';
				ctx.fillStyle = '#FFFFFF';
				ctx.textAlign = 'left';
				ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

				// Draw playcount per beatmap
				ctx.font = 'bold 18px comfortaa, arial';
				ctx.fillStyle = '#FFCC22';
				ctx.textAlign = 'right';
				ctx.fillText('➤ ' + dataOnPage[i].playcount, (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

				//Write mapper per map
				ctx.font = 'bold 10px comfortaa, arial';
				ctx.fillStyle = '#98838C';
				ctx.textAlign = 'left';
				ctx.fillText(`Mapped by ${dataOnPage[i].mapper}`, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
			}

			await drawFooter(elements, totalPages, page);

			//Create as an attachment
			const files = [new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: `osu-mostplayed-maps-${amount}-${page}.png` })];

			//Send the attachment
			if (csv) {
				let csvData = [];

				for (let i = 0; i < dataOnPage.length; i++) {
					csvData.push({
						rank: i + 1 + amount * (page - 1),
						beatmapId: dataOnPage[i].beatmapId,
						playcount: dataOnPage[i].playcount,
						noModMap: dataOnPage[i].noModMap,
						hiddenMap: dataOnPage[i].hiddenMap,
						hardRockMap: dataOnPage[i].hardRockMap,
						doubleTimeMap: dataOnPage[i].doubleTimeMap,
						freeModMap: dataOnPage[i].freeModMap,
						title: dataOnPage[i].title,
						artist: dataOnPage[i].artist,
						difficulty: dataOnPage[i].difficulty,
						mapper: dataOnPage[i].mapper,
						beatmapsetId: dataOnPage[i].beatmapsetId,
						approvalStatus: dataOnPage[i].approvalStatus,
					});
				}


				let data = [];
				for (let i = 0; i < csvData.length; i++) {
					data.push(csvData[i]);

					if (i % 10000 === 0 && i > 0 || csvData.length - 1 === i) {
						let csv = new ObjectsToCsv(data);
						csv = await csv.toString();
						const buffer = Buffer.from(csv);
						//Create as an attachment
						files.push(new Discord.AttachmentBuilder(buffer, { name: `osu-mostplayed-maps-${amount * page}.csv` }));

						data = [];
					}
				}
			}

			try {
				await interaction.editReply({ files: files });
			} catch (error) {
				if (error.message !== 'Unknown Message') {
					console.error(error);
				}
			}
		}
	}
};

async function getMostPlayed(msg, username, server, mode, noLinkedAccount, limit) {
	if (server === 'bancho' || server === 'tournaments') {
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			notFoundAsError: true,
			completeScores: false,
			parseNumeric: false,
		});

		logOsuAPICalls('commands/osu-mostplayed.js');
		osuApi.getUser({ u: username })
			.then(async (user) => {

				let processingMessage = await msg.channel.send(`[${user.name}] Processing...`);

				const canvasWidth = 1000;
				const canvasHeight = 83 + limit * 41.66666;

				Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');
				Canvas.GlobalFonts.registerFromPath('./other/arial unicode ms.otf', 'arial');

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

				elements = await drawTitle(elements, server);

				elements = await drawMostPlayed(elements, server, mode, limit, msg.client);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: `osu-mostplayed-${user.id}.png` });

				//TODO: add attributes
				const linkedUser = await DBDiscordUsers.findOne({
					where: { osuUserId: user.id }
				});

				if (linkedUser && linkedUser.userId) {
					noLinkedAccount = false;
				}

				//Send attachment
				let sentMessage;
				if (noLinkedAccount) {
					sentMessage = await msg.channel.send({ content: `${user.name}: <https://osu.ppy.sh/users/${user.id}>\nFeel free to use </osu-link connect:${msg.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`, files: [attachment] });
				} else {
					sentMessage = await msg.channel.send({ content: `${user.name}: <https://osu.ppy.sh/users/${user.id}>`, files: [attachment] });
				}
				await sentMessage.react('👤');
				await sentMessage.react('📈');

				await processingMessage.delete();

			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'ripple') {
		let processingMessage = await msg.channel.send(`[\`${username.replace(/`/g, '')}\`] Processing...`);
		fetch(`https://www.ripple.moe/api/get_user?u=${username}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return await msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				}

				let user = rippleToBanchoUser(responseJson[0]);

				const canvasWidth = 1000;
				const canvasHeight = 83 + limit * 41.66666;

				Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');
				Canvas.GlobalFonts.registerFromPath('./other/arial unicode ms.otf', 'arial');

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				let elements = [canvas, ctx, user];

				elements = await drawTitle(elements, server);

				elements = await drawMostPlayed(elements, server, mode, limit, msg.client);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: `osu-mostplayed-ripple-${user.id}.png` });

				//Send attachment
				await msg.channel.send({ content: `\`${user.name}\`: <https://ripple.moe/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>`, files: [attachment] });
				await processingMessage.delete();
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	}
}

async function drawMostPlayed(input, server, mode, limit, client) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let link;
	let showLimit = limit;
	if (server === 'bancho') {
		await awaitWebRequestPermission(`https://osu.ppy.sh/users/${user.id}/beatmapsets/most_played?limit=${limit}`, client);
		link = await fetch(`https://osu.ppy.sh/users/${user.id}/beatmapsets/most_played?limit=${limit}`).then(res => res.json());

		for (let i = 0; i < link.length && i < showLimit; i++) {
			// Draw the rectangle
			roundedRect(ctx, canvas.width / 13, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 10, 500 / 13, 500 / 70, '70', '57', '63', 0.75);

			// draw another rectangle for the image
			roundedRect(ctx, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38, 500 / 70, '70', '57', '63', 0.75);
			ctx.save();
			ctx.clip();
			try {
				let beatmapImage = await getMapListCover(link[i].beatmapset.id, link[i].beatmap.id, client);
				ctx.drawImage(beatmapImage, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38);
			} catch (err) {
				// Nothing
			}
			ctx.restore();
			ctx.font = 'bold 18px comfortaa, arial';
			ctx.fillStyle = '#FF66AB';
			ctx.textAlign = 'right';

			// Draw title and difficutly per beatmap
			let beatmapTitle = `${link[i].beatmapset.title} [${link[i].beatmap.version}] by ${link[i].beatmapset.artist}`;
			const maxSize = canvas.width / 250 * 19;
			if (beatmapTitle.length > maxSize) {
				beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
			}
			ctx.font = 'bold 15px comfortaa, arial';
			ctx.fillStyle = '#FFFFFF';
			ctx.textAlign = 'left';
			ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

			// Draw playcount per beatmap
			ctx.font = 'bold 18px comfortaa, arial';
			ctx.fillStyle = '#FFCC22';
			ctx.textAlign = 'right';
			ctx.fillText('➤ ' + link[i].count, (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

			//Write mapper per map
			ctx.font = 'bold 10px comfortaa, arial';
			ctx.fillStyle = '#98838C';
			ctx.textAlign = 'left';
			ctx.fillText(`Mapped by ${link[i].beatmapset.creator}`, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		}
	} else if (server === 'ripple') {
		link = await fetch(`http://ripple.moe/api/v1/users/most_played?name=${user.name}&l=${limit}`).then(res => res.json());

		for (let i = 0; i < link.beatmaps.length; i++) {
			let beatmaps = [];
			let beatmap = await getOsuBeatmap({ beatmapId: link.beatmaps[i].beatmap.beatmap_id, modbits: 0 });
			if (beatmap) {
				beatmaps.push(beatmap);
			}

			for (let j = 0; j < beatmaps.length && i < showLimit; j++) {
				// Draw the rectangle
				roundedRect(ctx, canvas.width / 13, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 10, 500 / 13, 500 / 70, '70', '57', '63', 0.75);
				// draw another rectangle for the image
				roundedRect(ctx, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38, 500 / 70, '70', '57', '63', 0.75);
				ctx.save();
				ctx.clip();
				try {
					let beatmapImage = await getMapListCover(beatmaps[j].beatmapsetId, beatmaps[j].beatmapId, client);
					ctx.drawImage(beatmapImage, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38);
				} catch (err) {
					// Nothing
				}
				ctx.restore();
				ctx.font = 'bold 18px comfortaa, arial';
				ctx.fillStyle = '#FF66AB';
				ctx.textAlign = 'right';

				// Draw title and difficutly per beatmap
				let beatmapTitle = `${beatmaps[j].title} [${beatmaps[j].difficulty}] by ${beatmaps[j].artist}`;
				const maxSize = canvas.width / 250 * 19;
				if (beatmapTitle.length > maxSize) {
					beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
				}
				ctx.font = 'bold 15px comfortaa, arial';
				ctx.fillStyle = '#FFFFFF';
				ctx.textAlign = 'left';
				ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

				// Draw playcount per beatmap
				ctx.font = 'bold 18px comfortaa, arial';
				ctx.fillStyle = '#FFCC22';
				ctx.textAlign = 'right';
				ctx.fillText('➤ ' + link.beatmaps[i].playcount, (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

				//Write mapper per map
				ctx.font = 'bold 10px comfortaa, arial';
				ctx.fillStyle = '#98838C';
				ctx.textAlign = 'left';
				ctx.fillText(`Mapped by ${beatmaps[j].mapper}`, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
			}
		}
	} else if (server === 'tournaments') {
		let multiScores = await DBOsuMultiGameScores.findAll({
			attributes: ['beatmapId', 'mode'],
			where: {
				osuUserId: user.id,
				score: {
					[Op.gte]: 10000
				},
				tourneyMatch: true
			},
		});

		let mostplayed = [];
		let beatmapIds = [];

		for (let i = 0; i < multiScores.length; i++) {
			if (mode && mode !== multiScores[i].mode) {
				continue;
			}

			if (!beatmapIds.includes(multiScores[i].beatmapId)) {
				beatmapIds.push(multiScores[i].beatmapId);
				mostplayed.push({
					beatmapId: multiScores[i].beatmapId,
					playcount: 1
				});
			} else {
				mostplayed[beatmapIds.indexOf(multiScores[i].beatmapId)].playcount++;
			}
		}

		mostplayed.sort((a, b) => b.playcount - a.playcount);

		for (let i = 0; i < mostplayed.length && i < showLimit; i++) {
			let beatmap = await getOsuBeatmap({ beatmapId: mostplayed[i].beatmapId, modbits: 0 });

			if (!beatmap) {
				mostplayed.splice(i, 1);
				i--;
				continue;
			}

			// Draw the rectangle
			roundedRect(ctx, canvas.width / 13, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 10, 500 / 13, 500 / 70, '70', '57', '63', 0.75);

			ctx.save();
			try {
				// draw another rectangle for the image
				roundedRect(ctx, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38, 500 / 70, '70', '57', '63', 0.75);
				ctx.clip();
				let beatmapImage = await getMapListCover(beatmap.beatmapsetId, beatmap.beatmapId, client);
				ctx.drawImage(beatmapImage, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38);
				ctx.font = 'bold 18px comfortaa, arial';
				ctx.fillStyle = '#FF66AB';
				ctx.textAlign = 'right';
			} catch (e) {
				//Nothing
			}
			ctx.restore();

			// Draw title and difficutly per beatmap
			let beatmapTitle = `${beatmap.title} [${beatmap.difficulty}] by ${beatmap.artist}`;
			const maxSize = canvas.width / 250 * 19;
			if (beatmapTitle.length > maxSize) {
				beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
			}
			ctx.font = 'bold 15px comfortaa, arial';
			ctx.fillStyle = '#FFFFFF';
			ctx.textAlign = 'left';
			ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

			// Draw playcount per beatmap
			ctx.font = 'bold 18px comfortaa, arial';
			ctx.fillStyle = '#FFCC22';
			ctx.textAlign = 'right';
			ctx.fillText('➤ ' + mostplayed[i].playcount, (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

			//Write mapper per map
			ctx.font = 'bold 10px comfortaa, arial';
			ctx.fillStyle = '#98838C';
			ctx.textAlign = 'left';
			ctx.fillText(`Mapped by ${beatmap.mapper}`, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		}
	}

	return [canvas, ctx, user];
}

async function drawTitle(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let serverDisplay = '';

	if (server !== 'bancho') {
		serverDisplay = `[${server}] `;
	}
	let title;

	if (server !== 'tourneybeatmaps') {
		title = `✰ ${serverDisplay}${user.name}'s most played maps ✰`;
		if (user.name.endsWith('s') || user.name.endsWith('x')) {
			title = `✰ ${serverDisplay}${user.name}' most played maps ✰`;
		}
	} else {
		title = '✰ Most played beatmaps in tournaments ✰';
	}

	roundedRect(ctx, canvas.width / 2 - title.length * 8.5, 500 / 50, title.length * 17, 500 / 12, 5, '28', '28', '28', 0.75);

	// Write the title of the player
	ctx.font = '30px comfortaa, arial';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(title, canvas.width / 2, 500 / 12);

	return [canvas, ctx, user];
}

async function drawFooter(input, totalPages, page) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = '12px comfortaa, arial';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 5);

	if (page) {
		ctx.textAlign = 'left';
		ctx.fillText(`Page ${page} of ${totalPages}`, canvas.width / 140, canvas.height - 5);
	}

	return [canvas, ctx, user];
}