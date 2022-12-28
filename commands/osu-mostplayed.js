const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { roundedRect, rippleToBanchoUser, getOsuUserServerMode, getMessageUserDisplayname, getIDFromPotentialOsuLink, populateMsgFromInteraction, logDatabaseQueries, getOsuBeatmap, getMapListCover } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const Sequelize = require('sequelize');
const ObjectsToCsv = require('objects-to-csv');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-mostplayed',
	// aliases: ['osu-plays', 'osu-topplays', 'osu-best'],
	description: 'Sends an info card about the most played maps of the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces; Use --b for bancho / --r for ripple; --25 for top 25...)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (!interaction) {
			return;
		}

		if (interaction.options._subcommand === 'user') {
			msg = await populateMsgFromInteraction(interaction);

			try {
				await interaction.reply('Players are being processed');
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}
			args = [];
			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'server') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else if (interaction.options._hoistedOptions[i].name === 'amount') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}

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
					getMostPlayed(msg, commandUser.osuUserId, server, false, limit);
				} else {
					const userDisplayName = await getMessageUserDisplayname(msg);
					getMostPlayed(msg, userDisplayName, server, false, limit);
				}
			} else {
				//Get profiles by arguments
				for (let i = 0; i < args.length; i++) {
					if (args[i].startsWith('<@') && args[i].endsWith('>')) {
						logDatabaseQueries(4, 'commands/osu-top.js DBDiscordUsers');
						const discordUser = await DBDiscordUsers.findOne({
							where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
						});

						if (discordUser && discordUser.osuUserId) {
							getMostPlayed(msg, discordUser.osuUserId, server, false, limit);
						} else {
							msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`/osu-link connect username:<username>\`.`);
							getMostPlayed(msg, args[i], server, false, limit);
						}
					} else {
						if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
							if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
								getMostPlayed(msg, getIDFromPotentialOsuLink(args[i]), server, true, limit);
							} else {
								getMostPlayed(msg, getIDFromPotentialOsuLink(args[i]), server, false, limit);
							}
						} else {
							getMostPlayed(msg, getIDFromPotentialOsuLink(args[i]), server, false, limit);
						}
					}
				}
			}
		} else if (interaction.options._subcommand === 'tourneybeatmaps') {
			try {
				await interaction.deferReply();
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
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
				mostplayed = await DBOsuMultiScores.findAll({
					attributes: ['beatmapId', [Sequelize.fn('COUNT', Sequelize.col('beatmapId')), 'playcount']],
					where: {
						warmup: false,
						beatmapId: {
							[Op.gt]: 0,
						},
					},
					group: ['beatmapId'],
					order: [[Sequelize.fn('COUNT', Sequelize.col('beatmapId')), 'DESC']],
				});
			} else {
				mostplayed = await DBOsuMultiScores.findAll({
					attributes: ['beatmapId', [Sequelize.fn('COUNT', Sequelize.col('beatmapId')), 'playcount']],
					where: {
						warmup: false,
						beatmapId: {
							[Op.gt]: 0,
						},
						matchName: {
							[Op.and]: {
								[Op.notLike]: 'ETX%:%',
								[Op.notLike]: 'o!mm%:%',
							}
						},
					},
					group: ['beatmapId'],
					order: [[Sequelize.fn('COUNT', Sequelize.col('beatmapId')), 'DESC']],
				});
			}

			let data = [];
			for (let i = 0; i < mostplayed.length; i++) {
				data.push({
					beatmapId: mostplayed[i].beatmapId,
					playcount: mostplayed[i].dataValues.playcount,
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
					let beatmapImage = await getMapListCover(dataOnPage[i].beatmapsetId, dataOnPage[i].beatmapId);
					ctx.drawImage(beatmapImage, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38);
				} catch (err) {
					// Nothing
				}
				ctx.restore();
				ctx.font = 'bold 18px comfortaa, sans-serif';
				ctx.fillStyle = '#FF66AB';
				ctx.textAlign = 'right';

				// Draw title and difficutly per beatmap
				let beatmapTitle = `${dataOnPage[i].title} [${dataOnPage[i].difficulty}] by ${dataOnPage[i].artist}`;
				const maxSize = canvas.width / 250 * 19;
				if (beatmapTitle.length > maxSize) {
					beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
				}
				ctx.font = 'bold 15px comfortaa, sans-serif';
				ctx.fillStyle = '#FFFFFF';
				ctx.textAlign = 'left';
				ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

				// Draw playcount per beatmap
				ctx.font = 'bold 18px comfortaa, sans-serif';
				ctx.fillStyle = '#FFCC22';
				ctx.textAlign = 'right';
				ctx.fillText('➤ ' + dataOnPage[i].playcount, (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

				//Write mapper per map
				ctx.font = 'bold 10px comfortaa, sans-serif';
				ctx.fillStyle = '#98838C';
				ctx.textAlign = 'left';
				ctx.fillText(`Mapped by ${dataOnPage[i].mapper}`, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
			}

			await drawFooter(elements, totalPages, page);

			//Create as an attachment
			const files = [new Discord.MessageAttachment(canvas.toBuffer(), `osu-mostplayed-maps-${amount}-${page}.png`)];

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
						// eslint-disable-next-line no-undef
						const buffer = Buffer.from(csv);
						//Create as an attachment
						files.push(new Discord.MessageAttachment(buffer, `osu-mostplayed-maps-${amount * page}.csv`));

						data = [];
					}
				}
			}

			await interaction.editReply({ files: files });
		}
	}
};

async function getMostPlayed(msg, username, server, noLinkedAccount, limit) {
	if (server === 'bancho' || server === 'tournaments') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			notFoundAsError: true,
			completeScores: false,
			parseNumeric: false,
		});

		osuApi.getUser({ u: username })
			.then(async (user) => {

				let processingMessage = await msg.channel.send(`[${user.name}] Processing...`);

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

				elements = await drawTitle(elements, server);

				elements = await drawMostPlayed(elements, server, limit);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-mostplayed-${user.id}.png`);

				logDatabaseQueries(4, 'commands/osu-mostplayed.js DBDiscordUsers Bancho linkedUser');
				const linkedUser = await DBDiscordUsers.findOne({
					where: { osuUserId: user.id }
				});

				if (linkedUser && linkedUser.userId) {
					noLinkedAccount = false;
				}

				//Send attachment
				let sentMessage;
				if (noLinkedAccount) {
					sentMessage = await msg.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}>\nFeel free to use \`/osu-link connect username:${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, files: [attachment] });
				} else {
					sentMessage = await msg.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}>`, files: [attachment] });
				}
				await sentMessage.react('👤');
				await sentMessage.react('📈');

				processingMessage.delete();

			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --r for ripple; --s/--t/--c/--m for modes; --n / --new / --recent for recent scores; --25 for top 25...)`);
				} else {
					console.log(err);
				}
			});
	} else if (server === 'ripple') {
		let processingMessage = await msg.channel.send(`[\`${username.replace(/`/g, '')}\`] Processing...`);
		fetch(`https://www.ripple.moe/api/get_user?u=${username}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --b for bancho; Use --s/--t/--c/--m for modes; --n / --new / --recent for recent scores; --25 for top 25...)`);
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

				elements = await drawTitle(elements, server);

				elements = await drawMostPlayed(elements, server, limit);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-mostplayed-ripple-${user.id}.png`);

				//Send attachment
				await msg.channel.send({ content: `\`${user.name}\`: <https://ripple.moe/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>`, files: [attachment] });
				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --b for bancho; Use --s/--t/--c/--m for modes; --n / --new / --recent for recent scores; --25 for top 25...)`);
				} else {
					console.log(err);
				}
			});
	}
}

async function drawMostPlayed(input, server, limit) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let link;
	let showLimit = limit;
	if (server === 'bancho') {
		link = await fetch(`https://osu.ppy.sh/users/${user.id}/beatmapsets/most_played?limit=${limit}`).then(res => res.json());

		for (let i = 0; i < link.length && i < showLimit; i++) {
			// Draw the rectangle
			roundedRect(ctx, canvas.width / 13, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 10, 500 / 13, 500 / 70, '70', '57', '63', 0.75);

			// draw another rectangle for the image
			roundedRect(ctx, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38, 500 / 70, '70', '57', '63', 0.75);
			ctx.save();
			ctx.clip();
			try {
				let beatmapImage = await getMapListCover(link[i].beatmapset.id, link[i].beatmap.id);
				ctx.drawImage(beatmapImage, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38);
			} catch (err) {
				// Nothing
			}
			ctx.restore();
			ctx.font = 'bold 18px comfortaa, sans-serif';
			ctx.fillStyle = '#FF66AB';
			ctx.textAlign = 'right';

			// Draw title and difficutly per beatmap
			let beatmapTitle = `${link[i].beatmapset.title} [${link[i].beatmap.version}] by ${link[i].beatmapset.artist}`;
			const maxSize = canvas.width / 250 * 19;
			if (beatmapTitle.length > maxSize) {
				beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
			}
			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillStyle = '#FFFFFF';
			ctx.textAlign = 'left';
			ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

			// Draw playcount per beatmap
			ctx.font = 'bold 18px comfortaa, sans-serif';
			ctx.fillStyle = '#FFCC22';
			ctx.textAlign = 'right';
			ctx.fillText('➤ ' + link[i].count, (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

			//Write mapper per map
			ctx.font = 'bold 10px comfortaa, sans-serif';
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
					let beatmapImage = await getMapListCover(beatmaps[j].beatmapsetId, beatmaps[j].beatmapId);
					ctx.drawImage(beatmapImage, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38);
				} catch (err) {
					// Nothing
				}
				ctx.restore();
				ctx.font = 'bold 18px comfortaa, sans-serif';
				ctx.fillStyle = '#FF66AB';
				ctx.textAlign = 'right';

				// Draw title and difficutly per beatmap
				let beatmapTitle = `${beatmaps[j].title} [${beatmaps[j].difficulty}] by ${beatmaps[j].artist}`;
				const maxSize = canvas.width / 250 * 19;
				if (beatmapTitle.length > maxSize) {
					beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
				}
				ctx.font = 'bold 15px comfortaa, sans-serif';
				ctx.fillStyle = '#FFFFFF';
				ctx.textAlign = 'left';
				ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

				// Draw playcount per beatmap
				ctx.font = 'bold 18px comfortaa, sans-serif';
				ctx.fillStyle = '#FFCC22';
				ctx.textAlign = 'right';
				ctx.fillText('➤ ' + link.beatmaps[i].playcount, (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

				//Write mapper per map
				ctx.font = 'bold 10px comfortaa, sans-serif';
				ctx.fillStyle = '#98838C';
				ctx.textAlign = 'left';
				ctx.fillText(`Mapped by ${beatmaps[j].mapper}`, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
			}
		}
	} else if (server === 'tournaments') {
		// Keeping this here because its the cooler way to do it but the filtering doesn't work properly
		// let mostplayed = await DBOsuMultiScores.findAll({
		// 	where: { osuUserId: user.id },
		// 	group: ['beatmapId'],
		// 	attributes: ['beatmapId', [sequelize.fn('COUNT', 'beatmapId'), 'playcount']],
		// 	order: [[sequelize.fn('COUNT', 'beatmapId'), 'DESC']],
		// 	limit: limit * 2
		// });

		let multiScores = await DBOsuMultiScores.findAll({
			where: { osuUserId: user.id },
		});

		let mostplayed = [];
		let beatmapIds = [];

		for (let i = 0; i < multiScores.length; i++) {
			if (parseInt(multiScores[i].score) < 10000 || !multiScores[i].tourneyMatch) {
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
				let beatmapImage = await getMapListCover(beatmap.beatmapsetId, beatmap.beatmapId);
				ctx.drawImage(beatmapImage, canvas.width / 23, 500 / 8 + (500 / 12) * i, 38, 38);
				ctx.font = 'bold 18px comfortaa, sans-serif';
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
			ctx.font = 'bold 15px comfortaa, sans-serif';
			ctx.fillStyle = '#FFFFFF';
			ctx.textAlign = 'left';
			ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

			// Draw playcount per beatmap
			ctx.font = 'bold 18px comfortaa, sans-serif';
			ctx.fillStyle = '#FFCC22';
			ctx.textAlign = 'right';
			ctx.fillText('➤ ' + mostplayed[i].playcount, (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

			//Write mapper per map
			ctx.font = 'bold 10px comfortaa, sans-serif';
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
	ctx.font = '30px comfortaa, sans-serif';
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

	ctx.font = '12px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 5);

	if (page) {
		ctx.textAlign = 'left';
		ctx.fillText(`Page ${page} of ${totalPages}`, canvas.width / 140, canvas.height - 5);
	}

	return [canvas, ctx, user];
}