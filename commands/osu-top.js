const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { getGuildPrefix, humanReadable, roundedRect, getRankImage, getModImage, getGameModeName, getLinkModeName, getMods, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname, getAccuracy, getIDFromPotentialOsuLink, populateMsgFromInteraction, getOsuBeatmap, logDatabaseQueries, multiToBanchoScore, saveOsuMultiScores, pause } = require('../utils');
const fetch = require('node-fetch');
const { Permissions } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-top',
	aliases: ['osu-plays', 'osu-topplays', 'osu-best'],
	description: 'Sends an info card about the topplays of the specified player',
	usage: '[username] [username] ... (Use `_` instead of spaces; Use `--b` for bancho / `--r` for ripple; Use `--s`/`--t`/`--c`/`--m` for modes; `--n` / `--new` / `--recent` for recent scores; `--25` for top 25...)',
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
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Players are being processed');

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'new') {
						if (interaction.options._hoistedOptions[i].value) {
							args.push('--new');
						}
					} else if (interaction.options._hoistedOptions[i].name === 'amount') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else if (interaction.options._hoistedOptions[i].name === 'gamemode') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else if (interaction.options._hoistedOptions[i].name === 'server') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}
		}
		const guildPrefix = await getGuildPrefix(msg);

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		const server = commandConfig[1];
		const mode = commandConfig[2];

		let limit = 10;
		let tracking = false;
		let sorting = null;

		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--new' || args[i] === '--recent' || args[i] === '--n') {
				sorting = 'recent';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--ar' || args[i] === '--approach' || args[i] === '--approachrate') {
				sorting = 'ar';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--cs' || args[i] === '--size' || args[i] === '--circlesize') {
				sorting = 'cs';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--od' || args[i] === '--diff' || args[i] === '--overalldifficulty') {
				sorting = 'od';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--hp' || args[i] === '--hpdrain' || args[i] === '--drain') {
				sorting = 'drain';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--length') {
				sorting = 'length';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--bpm' || args[i] === '--beatsperminute') { // who the fuck would use beats per fucking minute smh
				sorting = 'bpm';
				args.splice(i, 1);
				i--;
			} else if (args[i].startsWith('--') && !isNaN(args[i].replace('--', ''))) {
				limit = parseInt(args[i].replace('--', ''));
				if (limit > 100) {
					limit = 100;
				} else if (limit < 1) {
					limit = 1;
				}
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--tracking') {
				tracking = true;
				args.splice(i, 1);
				i--;
			}
		}

		if (!args[0]) {
			//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				getTopPlays(msg, commandUser.osuUserId, server, mode, false, sorting, limit, tracking);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getTopPlays(msg, userDisplayName, server, mode, false, sorting, limit, tracking);
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
						getTopPlays(msg, discordUser.osuUserId, server, mode, false, sorting, limit, tracking);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
						getTopPlays(msg, args[i], server, mode, false, sorting, limit, tracking);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getTopPlays(msg, getIDFromPotentialOsuLink(args[i]), server, mode, true, sorting, limit, tracking);
						} else {
							getTopPlays(msg, getIDFromPotentialOsuLink(args[i]), server, mode, false, sorting, limit, tracking);
						}
					} else {
						getTopPlays(msg, getIDFromPotentialOsuLink(args[i]), server, mode, false, sorting, limit, tracking);
					}
				}
			}
		}
	}
};

async function getTopPlays(msg, username, server, mode, noLinkedAccount, sorting, limit, tracking) {
	if (server === 'bancho') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		osuApi.getUser({ u: username, m: mode })
			.then(async (user) => {
				updateOsuDetailsforUser(user, mode);

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

				elements = await drawTitle(elements, server, mode, sorting);

				elements = await drawTopPlays(elements, server, mode, msg, sorting, limit);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-top-${user.id}-mode${mode}.png`);

				//If created by osu-tracking
				if (tracking) {
					await msg.channel.send({ content: `\`${user.name}\` got ${limit} new top play(s)!`, files: [attachment] });
				} else {
					//Define prefix command
					let guildPrefix = await getGuildPrefix(msg);

					//Send attachment
					let sentMessage;
					if (noLinkedAccount) {
						sentMessage = await msg.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, files: [attachment] });
					} else {
						sentMessage = await msg.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>`, files: [attachment] });
					}
					await sentMessage.react('👤');
					await sentMessage.react('📈');
				}

				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use \`_\` instead of spaces; Use \`--r\` for ripple; \`--s\`/\`--t\`/\`--c\`/\`--m\` for modes; \`--n\` / \`--new\` / \`--recent\` for recent scores; \`--25\` for top 25...)`);
				} else {
					console.log(err);
				}
			});
	} else if (server === 'ripple') {
		let processingMessage = await msg.channel.send(`[\`${username.replace(/`/g, '')}\`] Processing...`);
		fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use \`_\` instead of spaces; Use \`--b\` for bancho; Use \`--s\`/\`--t\`/\`--c\`/\`--m\` for modes; \`--n\` / \`--new\` / \`--recent\` for recent scores; \`--25\` for top 25...)`);
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

				elements = await drawTitle(elements, server, mode, sorting);

				elements = await drawTopPlays(elements, server, mode, msg, sorting, limit);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-top-${user.id}-mode${mode}.png`);

				//Send attachment
				await msg.channel.send({ content: `\`${user.name}\`: <https://ripple.moe/u/${user.id}?mode=${mode}>\nSpectate: <osu://spectate/${user.id}>`, files: [attachment] });
				processingMessage.delete();
			})
			.catch(err => {
				processingMessage.delete();
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use \`_\` instead of spaces; Use \`--b\` for bancho; Use \`--s\`/\`--t\`/\`--c\`/\`--m\` for modes; \`--n\` / \`--new\` / \`--recent\` for recent scores; \`--25\` for top 25...)`);
				} else {
					console.log(err);
				}
			});
	} else if (server === 'tournaments') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		osuApi.getUser({ u: username, m: mode })
			.then(async (user) => {
				updateOsuDetailsforUser(user, mode);

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

				elements = await drawTitle(elements, server, mode, sorting);

				elements = await drawTopPlays(elements, server, mode, msg, sorting, limit, processingMessage);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-top-${user.id}-mode${mode}.png`);

				//If created by osu-tracking
				if (tracking) {
					await msg.channel.send({ content: `\`${user.name}\` got ${limit} new top play(s)!`, files: [attachment] });
				} else {
					//Send attachment
					let sentMessage;
					if (noLinkedAccount) {
						sentMessage = await msg.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\nFeel free to use \`/osu-link connect:${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, files: [attachment] });
					} else {
						sentMessage = await msg.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>`, files: [attachment] });
					}
					await sentMessage.react('👤');
					await sentMessage.react('📈');
				}

				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use \`_\` instead of spaces; Use \`--r\` for ripple; \`--s\`/\`--t\`/\`--c\`/\`--m\` for modes; \`--n\` / \`--new\` / \`--recent\` for recent scores; \`--25\` for top 25...)`);
				} else {
					console.log(err);
				}
			});
	}
}

async function drawTitle(input, server, mode, sorting) {
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
		}
	}

	let gameMode = getGameModeName(mode);
	let title;

	title = `✰ ${serverDisplay}${user.name}'s ${gameMode} top plays ${sortingText}✰`;
	if (user.name.endsWith('s') || user.name.endsWith('x')) {
		title = `✰ ${serverDisplay}${user.name}' ${gameMode} top plays ${sortingText}✰`;
	}

	roundedRect(ctx, canvas.width / 2 - title.length * 8.5, 500 / 50, title.length * 17, 500 / 12, 5, '28', '28', '28', 0.75);

	// Write the title of the player
	ctx.font = '30px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(title, canvas.width / 2, 500 / 12);

	const output = [canvas, ctx, user];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = '12px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 5);

	const output = [canvas, ctx, user];
	return output;
}

async function drawTopPlays(input, server, mode, msg, sorting, showLimit, processingMessage) {
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

	if (server === 'bancho') {
		scores = await osuApi.getUserBest({ u: user.name, m: mode, limit: limit });
	} else if (server === 'ripple') {
		const response = await fetch(`https://www.ripple.moe/api/get_user_best?u=${user.name}&m=${mode}&limit=${limit}`);
		const responseJson = await response.json();
		if (!responseJson[0]) {
			return msg.channel.send(`Could not find user \`${user.name.replace(/`/g, '')}\`.`);
		}

		for (let i = 0; i < responseJson.length; i++) {

			let score = rippleToBanchoScore(responseJson[i]);

			scores.push(score);
		}
	} else if (server === 'tournaments') {
		let modeName = getGameModeName(mode);
		modeName = modeName.substring(0, 1).toUpperCase() + modeName.substring(1);

		if (modeName === 'Catch') {
			modeName = 'Catch the Beat';
		}

		//Get all scores from tournaments
		logDatabaseQueries(4, 'commands/osu-top.js DBOsuMultiScores');
		let multiScores = await DBOsuMultiScores.findAll({
			where: {
				osuUserId: user.id,
				mode: modeName,
				tourneyMatch: true,
				score: {
					[Op.gte]: 10000
				}
			}
		});

		for (let i = 0; i < multiScores.length; i++) {
			if (parseInt(multiScores[i].score) <= 10000) {
				multiScores.splice(i, 1);
				i--;
			}
		}

		let multisToUpdate = [];
		for (let i = 0; i < multiScores.length; i++) {
			if (!multiScores[i].maxCombo && !multisToUpdate.includes(multiScores[i].matchId)) {
				multisToUpdate.push(multiScores[i].matchId);
			}
		}

		for (let i = 0; i < multisToUpdate.length; i++) {
			processingMessage.edit(`[One time process] Updating legacy scores for ${user.name}... ${i + 1}/${multisToUpdate.length}`);
			await osuApi.getMatch({ mp: multisToUpdate[i] })
				.then(async (match) => {
					await saveOsuMultiScores(match);
				})
				.catch(() => {
					//Nothing
				});
			await pause(5000);
		}

		//Get all scores from tournaments
		logDatabaseQueries(4, 'commands/osu-top.js DBOsuMultiScores2');
		multiScores = await DBOsuMultiScores.findAll({
			where: {
				osuUserId: user.id,
				mode: modeName,
				tourneyMatch: true,
				score: {
					[Op.gte]: 10000
				}
			}
		});

		for (let i = 0; i < multiScores.length; i++) {
			if (parseInt(multiScores[i].score) <= 10000 || multiScores[i].teamType === 'Tag Team vs' || multiScores[i].teamType === 'Tag Co-op') {
				multiScores.splice(i, 1);
				i--;
			}
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
		}

		//Sort scores by pp
		quicksortPP(multiScores);

		//Remove duplicates by beatmapId
		for (let i = 0; i < multiScores.length; i++) {
			for (let j = i + 1; j < multiScores.length; j++) {
				if (multiScores[i].beatmapId === multiScores[j].beatmapId) {
					multiScores.splice(j, 1);
					j--;
				}
			}
		}

		//Feed the scores into the array
		for (let i = 0; i < multiScores.length && i < 100; i++) {
			if (multiScores[i].pp) {
				scores.push(multiScores[i]);
			}
		}
	}

	let sortedScores = [];
	let beatmaps = [];

	if (sorting && sorting == 'recent') {
		quicksortRecent(scores);
	}

	let now = new Date();
	if (now.getUTCDate() === 1 && now.getUTCMonth() === 3) {
		beatmaps.push(await getOsuBeatmap({ beatmapId: '658127', modBits: 16 }));
	}

	for (let i = 0; i < showLimit && i < scores.length; i++) {
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
			quicksortAR(beatmaps);
		} else if (sorting == 'cs') {
			quicksortCS(beatmaps);
		} else if (sorting == 'od') {
			quicksortOD(beatmaps);
		} else if (sorting == 'drain') {
			quicksortHP(beatmaps);
		} else if (sorting == 'bpm') {
			quicksortBPM(beatmaps);
		} else if (sorting == 'length') {
			quicksortLength(beatmaps);
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

	for (let i = 0; i < beatmaps.length && i < showLimit; i++) {
		for (let j = 0; j < scores.length; j++) {
			if (beatmaps[i].beatmapId === scores[j].beatmapId) {
				sortedScores.push(scores[j]);
			}
		}
	}

	for (let i = 0; i < sortedScores.length && i < showLimit; i++) {
		roundedRect(ctx, canvas.width / 70, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 35, 500 / 13, 500 / 70, '70', '57', '63', 0.75);

		const rankImage = await Canvas.loadImage(getRankImage(sortedScores[i].rank));
		ctx.drawImage(rankImage, canvas.width / 35, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 - 500 / 31.25 / 2, canvas.width / 31.25, 500 / 31.25);

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

		// timeDifference = 545678;

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
		if (server === 'tournaments') {
			ctx.fillText(`${achievedTime} in ${sortedScores[i].matchName}`, (canvas.width / 35) * 3 + parseInt(beatmaps[i].difficulty.length) * 6 + canvas.width / 50, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		} else {
			ctx.fillText(achievedTime, (canvas.width / 35) * 3 + parseInt(beatmaps[i].difficulty.length) * 6 + canvas.width / 50, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		}
		let accuracy = getAccuracy(sortedScores[i], mode) * 100;

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
		ctx.fillText(Math.round(accuracy * 100) / 100 + '%', (canvas.width / 28) * 24.75, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);

		const mods = getMods(sortedScores[i].raw_mods);
		let arrow = '';
		if (mods.includes('DT') || mods.includes('NC')) {
			arrow = '^';
		}

		let sortingText = '';
		if (sorting !== null) {
			if (sorting == 'ar') {
				sortingText = ` (AR: ${beatmaps[i].approachRate + arrow})`;
			} else if (sorting == 'cs') {
				sortingText = ` (CS: ${beatmaps[i].circleSize})`;
			} else if (sorting == 'drain') {
				sortingText = ` (HP: ${beatmaps[i].drain + arrow})`;
			} else if (sorting == 'od') {
				sortingText = ` (OD: ${beatmaps[i].overallDifficulty + arrow})`;
			} else if (sorting == 'bpm') {
				sortingText = ` (BPM: ${beatmaps[i].bpm})`;
			} else if (sorting == 'length') {
				const totalLengthSeconds = (beatmaps[i].totalLength % 60) + '';
				const totalLengthMinutes = (beatmaps[i].totalLength - beatmaps[i].totalLength % 60) / 60;
				const totalLength = totalLengthMinutes + ':' + Math.round(totalLengthSeconds).toString().padStart(2, '0');
				sortingText = ` (Length: ${totalLength})`;
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

	const output = [canvas, ctx, user];
	return output;
}

function partitionRecent(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (Date.parse(list[j].raw_date) >= Date.parse(pivot.raw_date)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortRecent(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionRecent(list, start, end);
		quicksortRecent(list, start, p - 1);
		quicksortRecent(list, p + 1, end);
	}
	return list;
}

function partitionAR(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].approachRate) >= parseFloat(pivot.approachRate)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}
function quicksortAR(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionAR(list, start, end);
		quicksortAR(list, start, p - 1);
		quicksortAR(list, p + 1, end);
	}
	return list;
}
function partitionCS(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].circleSize) >= parseFloat(pivot.circleSize)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortCS(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionCS(list, start, end);
		quicksortCS(list, start, p - 1);
		quicksortCS(list, p + 1, end);
	}
	return list;
}
function partitionOD(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].overallDifficulty) >= parseFloat(pivot.overallDifficulty)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortOD(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionOD(list, start, end);
		quicksortOD(list, start, p - 1);
		quicksortOD(list, p + 1, end);
	}
	return list;
}
function partitionHP(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].hpDrain) >= parseFloat(pivot.hpDrain)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortHP(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionHP(list, start, end);
		quicksortHP(list, start, p - 1);
		quicksortHP(list, p + 1, end);
	}
	return list;
}
function partitionBPM(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].bpm) >= parseFloat(pivot.bpm)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function partitionPP(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].pp) >= parseFloat(pivot.pp)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortBPM(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionBPM(list, start, end);
		quicksortBPM(list, start, p - 1);
		quicksortBPM(list, p + 1, end);
	}
	return list;
}
function partitionLength(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].totalLength) >= parseFloat(pivot.totalLength)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}
function quicksortLength(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionLength(list, start, end);
		quicksortLength(list, start, p - 1);
		quicksortLength(list, p + 1, end);
	}
	return list;
}

function quicksortPP(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionPP(list, start, end);
		quicksortPP(list, start, p - 1);
		quicksortPP(list, p + 1, end);
	}
	return list;
}
