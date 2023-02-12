const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { humanReadable, roundedRect, getModImage, getLinkModeName, getMods, getGameMode, roundedImage, getBeatmapModeId, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname, getAccuracy, getIDFromPotentialOsuLink, populateMsgFromInteraction, getOsuBeatmap, getBeatmapApprovalStatusImage, logDatabaseQueries, getGameModeName, getOsuPP, getBeatmapCover } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-recent',
	aliases: ['ors'],
	description: 'Sends an info card about the last score of the specified player',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-recent')
		.setNameLocalizations({
			'de': 'osu-recent',
			'en-GB': 'osu-recent',
			'en-US': 'osu-recent',
		})
		.setDescription('Sends an info card about the last score of the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über den letzten Score des angegebenen Spielers',
			'en-GB': 'Sends an info card about the last score of the specified player',
			'en-US': 'Sends an info card about the last score of the specified player',
		})
		.setDMPermission(true)
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
			option.setName('pass')
				.setNameLocalizations({
					'de': 'pass',
					'en-GB': 'pass',
					'en-US': 'pass',
				})
				.setDescription('Show the recent pass?')
				.setDescriptionLocalizations({
					'de': 'Zeige den letzten Pass?',
					'en-GB': 'Show the recent pass?',
					'en-US': 'Show the recent pass?',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'True', value: '--pass' }
				)
		)
		.addStringOption(option =>
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
					{ name: 'Standard', value: '--s' },
					{ name: 'Taiko', value: '--t' },
					{ name: 'Catch The Beat', value: '--c' },
					{ name: 'Mania', value: '--m' },
				)
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
		),
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			try {
				//TODO: Deferreply
				await interaction.reply('Players are being processed');
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
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}
		}
		let pass = false;
		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--pass') {
				pass = true;
				args.splice(i, 1);
				i--;
			}
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		const server = commandConfig[1];
		const mode = commandConfig[2];

		if (!args[0]) {//Get profile by author if no argument
			//get discordUser from db
			if (commandUser && commandUser.osuUserId) {
				getScore(msg, commandUser.osuUserId, server, mode, false, pass);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getScore(msg, userDisplayName, server, mode, false, pass);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-recent.js DBDiscordUsers');
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getScore(msg, discordUser.osuUserId, server, mode, false, pass);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:1064502370710605836>.`);
						getScore(msg, args[i], server, mode);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getScore(msg, getIDFromPotentialOsuLink(args[i]), server, mode, true, pass);
						} else {
							getScore(msg, getIDFromPotentialOsuLink(args[i]), server, mode, false, pass);
						}
					} else {
						getScore(msg, getIDFromPotentialOsuLink(args[i]), server, mode, false, pass);
					}
				}
			}
		}
	},
};

async function getScore(msg, username, server, mode, noLinkedAccount, pass) {
	if (server === 'bancho') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});
		let i = 0;
		// eslint-disable-next-line no-undef
		process.send('osu!API');
		osuApi.getUserRecent({ u: username, m: mode })
			.then(async (scores) => {
				if (!(scores[0])) {
					return msg.channel.send(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				} else {
					if (pass) {
						do {
							i++;
						} while (scores[i] && scores[i].rank == 'F');
						if (!scores[i] || scores[i].rank == 'F') {
							return msg.channel.send(`Couldn't find any recent passes for \`${username.replace(/`/g, '')}\`.`);
						}
					}
				}

				const dbBeatmap = await getOsuBeatmap({ beatmapId: scores[i].beatmapId, modBits: 0 });
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const user = await osuApi.getUser({ u: username, m: mode });
				updateOsuDetailsforUser(user, mode);

				let mapRank = 0;
				//Get the map leaderboard and fill the maprank if found
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				await osuApi.getScores({ b: dbBeatmap.beatmapId, m: mode, limit: 100 })
					.then(async (mapScores) => {
						for (let j = 0; j < mapScores.length && !mapRank; j++) {
							if (scores[i].raw_mods === mapScores[j].raw_mods && scores[i].user.id === mapScores[j].user.id && scores[i].score === mapScores[j].score) {
								mapRank = j + 1;
							}
						}
					})
					// eslint-disable-next-line no-unused-vars
					.catch(err => {
						//Nothing
					});


				const beatmapMode = getBeatmapModeId(dbBeatmap);

				let lookedUpScore;

				try {
					// eslint-disable-next-line no-undef
					process.send('osu!API');
					lookedUpScore = await osuApi.getScores({ b: scores[i].beatmapId, u: user.id, m: beatmapMode, mods: scores[i].raw_mods });
				} catch (err) {
					//No score found
				}

				let processingMessage = await msg.channel.send(`[${user.name}] Processing...`);

				const canvasWidth = 1000;
				const canvasHeight = 500;

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				let elements = [canvas, ctx, scores[i], dbBeatmap, user];
				if (lookedUpScore) {
					elements = [canvas, ctx, scores[i], dbBeatmap, user, lookedUpScore[0]];
				}

				elements = await drawTitle(elements, mode);

				elements = await drawCover(elements, mode);

				elements = await drawFooter(elements);

				elements = await drawAccInfo(elements, mode, mapRank);

				await drawUserInfo(elements, server);

				//Create as an attachment
				const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-recent-${user.id}-${dbBeatmap.beatmapId}-${scores[i].raw_mods}.png` });

				let sentMessage;

				logDatabaseQueries(4, 'commands/osu-recent.js DBDiscordUsers Bancho linkedUser');
				const linkedUser = await DBDiscordUsers.findOne({
					where: { osuUserId: user.id }
				});

				if (linkedUser && linkedUser.userId) {
					noLinkedAccount = false;
				}

				//Send attachment
				if (noLinkedAccount) {
					sentMessage = await msg.channel.send({ content: `${user.name}: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nBeatmap: <https://osu.ppy.sh/b/${dbBeatmap.beatmapId}>\nFeel free to use </osu-link connect:1064502370710605836> if the specified account is yours.`, files: [attachment] });
				} else {
					sentMessage = await msg.channel.send({ content: `${user.name}: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nBeatmap: <https://osu.ppy.sh/b/${dbBeatmap.beatmapId}>`, files: [attachment] });
				}
				processingMessage.delete();
				if (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved' || dbBeatmap.approvalStatus === 'Qualified' || dbBeatmap.approvalStatus === 'Loved') {
					sentMessage.react('<:COMPARE:827974793365159997>');
				}
				await sentMessage.react('🗺️');
				await sentMessage.react('👤');
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'ripple') {
		let processingMessage = await msg.channel.send(`[\`${username.replace(/`/g, '')}\`] Processing...`);
		fetch(`https://www.ripple.moe/api/get_user_recent?u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return msg.channel.send(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				}

				let score = rippleToBanchoScore(responseJson[0]);

				const dbBeatmap = await getOsuBeatmap({ beatmapId: score.beatmapId, modBits: 0 });
				fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
					.then(async (response) => {
						const responseJson = await response.json();
						if (!responseJson[0]) {
							return msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						}

						let user = rippleToBanchoUser(responseJson[0]);

						const canvasWidth = 1000;
						const canvasHeight = 500;

						Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

						//Create Canvas
						const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

						//Get context and load the image
						const ctx = canvas.getContext('2d');
						const background = await Canvas.loadImage('./other/osu-background.png');
						ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

						let elements = [canvas, ctx, score, dbBeatmap, user, score];

						elements = await drawTitle(elements, mode);

						elements = await drawCover(elements, mode);

						elements = await drawFooter(elements);

						elements = await drawAccInfo(elements, mode);

						await drawUserInfo(elements, server);

						//Create as an attachment
						const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-recent-${user.id}-${dbBeatmap.beatmapId}-${score.raw_mods}.png` });

						//Send attachment
						const sentMessage = await msg.channel.send({ content: `${user.name}: <https://ripple.moe/u/${user.id}?mode=${mode}>\nBeatmap: <https://osu.ppy.sh/b/${dbBeatmap.beatmapId}>`, files: [attachment] });
						processingMessage.delete();
						if (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved' || dbBeatmap.approvalStatus === 'Qualified' || dbBeatmap.approvalStatus === 'Loved') {
							sentMessage.react('<:COMPARE:827974793365159997>');
						}
						await sentMessage.react('🗺️');
						await sentMessage.react('👤');

					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						} else {
							console.error(err);
						}
					});
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	}
}

async function drawTitle(input, mode) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];
	let lookedUpScore = input[5];

	const gameMode = getGameMode(beatmap);
	const modePic = await Canvas.loadImage(`./other/mode-${gameMode}.png`);
	const beatmapStatusIcon = await Canvas.loadImage(getBeatmapApprovalStatusImage(beatmap));
	const starImage = await Canvas.loadImage('./other/overall-difficulty.png');

	ctx.drawImage(beatmapStatusIcon, 10, 5, canvas.height / 500 * 35, canvas.height / 500 * 35);
	ctx.drawImage(modePic, canvas.width / 1000 * 10, canvas.height / 500 * 40, canvas.height / 500 * 35, canvas.height / 500 * 35);

	if (gameMode === 'osu' && mode !== 0) {
		const modePic = await Canvas.loadImage(`./other/mode-${getGameModeName(mode)}.png`);
		ctx.drawImage(modePic, canvas.width / 1000 * 20, canvas.height / 500 * 40, canvas.height / 500 * 35, canvas.height / 500 * 35);
	}

	// Write the title of the beatmap
	ctx.font = '30px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';

	let outputString = `${beatmap.title} by ${beatmap.artist}`;
	let shortened = false;
	while (ctx.measureText(outputString + '...').width > 930) {
		shortened = true;
		outputString = outputString.substring(0, outputString.length - 1);
	}

	if (shortened) {
		outputString += '...';
	}

	ctx.fillText(outputString, 60, 35);

	ctx.font = '25px comfortaa, sans-serif';

	const mods = getMods(score.raw_mods);

	if (mods.includes('NC')) {
		for (let i = 0, changed = false; i < mods.length && changed === false; i++) {
			if (mods[i] === 'NC') {
				mods[i] = 'DT';
				changed = true;
			}
		}
	}

	ctx.drawImage(starImage, 55, 42, canvas.height / 500 * 35, canvas.height / 500 * 35);
	if (mods.includes('DT') || mods.includes('HT') || mods.includes('HR') || mods.includes('EZ')) {
		let modMap = beatmap;
		if (mods.includes('DT') && mods.includes('HR')) {
			modMap = await getOsuBeatmap({ beatmapId: beatmap.beatmapId, modBits: 80 });
		} else if (mods.includes('DT') && mods.includes('EZ')) {
			modMap = await getOsuBeatmap({ beatmapId: beatmap.beatmapId, modBits: 66 });
		} else if (mods.includes('DT')) {
			modMap = await getOsuBeatmap({ beatmapId: beatmap.beatmapId, modBits: 64 });
		} else if (mods.includes('HT') && mods.includes('HR')) {
			modMap = await getOsuBeatmap({ beatmapId: beatmap.beatmapId, modBits: 272 });
		} else if (mods.includes('HT') && mods.includes('EZ')) {
			modMap = await getOsuBeatmap({ beatmapId: beatmap.beatmapId, modBits: 258 });
		} else if (mods.includes('HT')) {
			modMap = await getOsuBeatmap({ beatmapId: beatmap.beatmapId, modBits: 256 });
		} else if (mods.includes('EZ')) {
			modMap = await getOsuBeatmap({ beatmapId: beatmap.beatmapId, modBits: 2 });
		} else if (mods.includes('HR')) {
			modMap = await getOsuBeatmap({ beatmapId: beatmap.beatmapId, modBits: 16 });
		}
		ctx.fillText(`${Math.round(beatmap.starRating * 100) / 100} (${Math.round(modMap.starRating * 100) / 100} with ${mods.join('')})  ${beatmap.difficulty} mapped by ${beatmap.mapper}`, canvas.width / 1000 * 90, canvas.height / 500 * 70);
	} else {
		ctx.fillText(`${Math.round(beatmap.starRating * 100) / 100}  ${beatmap.difficulty} mapped by ${beatmap.mapper}`, canvas.width / 1000 * 90, canvas.height / 500 * 70);
	}

	const output = [canvas, ctx, score, beatmap, user, lookedUpScore];
	return output;
}

async function drawCover(input, mode) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];
	let lookedUpScore = input[5];

	let background;

	ctx.globalAlpha = 0.6;

	//Draw a shape onto the main canvas in the top left
	background = await getBeatmapCover(beatmap.beatmapsetId, beatmap.beatmapId);
	ctx.drawImage(background, 0, canvas.height / 6.25, canvas.width, background.height / background.width * canvas.width);

	ctx.globalAlpha = 1;

	let gradeSS;
	let gradeS;

	const mods = getMods(score.raw_mods);

	if (mods.includes('HD')) {
		gradeSS = await Canvas.loadImage('./other/rank_pictures/XH_Rank.png');
		gradeS = await Canvas.loadImage('./other/rank_pictures/SH_Rank.png');
	} else {
		gradeSS = await Canvas.loadImage('./other/rank_pictures/X_Rank.png');
		gradeS = await Canvas.loadImage('./other/rank_pictures/S_Rank.png');
	}

	const gradeA = await Canvas.loadImage('./other/rank_pictures/A_Rank.png');
	const gradeB = await Canvas.loadImage('./other/rank_pictures/B_Rank.png');
	const gradeC = await Canvas.loadImage('./other/rank_pictures/C_Rank.png');
	const gradeD = await Canvas.loadImage('./other/rank_pictures/D_Rank.png');

	ctx.globalAlpha = 0.2;

	if (score.rank === 'XH' || score.rank === 'X') {
		ctx.globalAlpha = 1;
	}
	ctx.drawImage(gradeSS, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 40 + canvas.height / 6.25, 32, 16);
	if (score.rank === 'XH' || score.rank === 'X') {
		ctx.globalAlpha = 0.5;
	} else if (score.rank === 'SH' || score.rank === 'S') {
		ctx.globalAlpha = 1;
	}
	ctx.drawImage(gradeS, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 68 + canvas.height / 6.25, 32, 16);
	if (score.rank === 'SH' || score.rank === 'S') {
		ctx.globalAlpha = 0.5;
	} else if (score.rank === 'A') {
		ctx.globalAlpha = 1;
	}
	ctx.drawImage(gradeA, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 96 + canvas.height / 6.25, 32, 16);
	if (score.rank === 'A') {
		ctx.globalAlpha = 0.5;
	} else if (score.rank === 'B') {
		ctx.globalAlpha = 1;
	}
	ctx.drawImage(gradeB, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 124 + canvas.height / 6.25, 32, 16);
	if (score.rank === 'B') {
		ctx.globalAlpha = 0.5;
	} else if (score.rank === 'C') {
		ctx.globalAlpha = 1;
	}
	ctx.drawImage(gradeC, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 152 + canvas.height / 6.25, 32, 16);
	if (score.rank === 'C') {
		ctx.globalAlpha = 0.5;
	} else if (score.rank === 'D') {
		ctx.globalAlpha = 1;
	}
	ctx.drawImage(gradeD, canvas.width / 900 * 50, (background.height / background.width * canvas.width) / 250 * 180 + canvas.height / 6.25, 32, 16);

	ctx.globalAlpha = 1;

	//Calculate accuracy
	let accuracy = getAccuracy(score, mode);

	ctx.beginPath();
	ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 90, 0, (2 * Math.PI));
	ctx.strokeStyle = '#000000';
	ctx.lineWidth = 23;
	ctx.stroke();

	var gradient = ctx.createLinearGradient(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 28 + canvas.height / 6.25, canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 208 + canvas.height / 6.25);
	gradient.addColorStop(0, '#65C8FA'); //Blue
	gradient.addColorStop(1, '#B2FE67'); // Green


	//Draw inner circle
	ctx.beginPath();
	ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 90, Math.PI * -0.5, (2 * Math.PI) * accuracy + Math.PI * -0.5);
	ctx.strokeStyle = gradient;
	ctx.lineWidth = 23;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) + Math.PI * -0.5);
	ctx.strokeStyle = '#BE0089'; //Red/Pink / SS Color
	ctx.lineWidth = 4;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.99 + Math.PI * -0.5);
	ctx.strokeStyle = '#0D8790'; //Blue / S Color
	ctx.lineWidth = 4;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.92 + Math.PI * -0.5);
	ctx.strokeStyle = '#72C904'; //Green / A Color
	ctx.lineWidth = 4;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.86 + Math.PI * -0.5);
	ctx.strokeStyle = '#D99D03'; //Yellow / B Color
	ctx.lineWidth = 4;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.8 + Math.PI * -0.5);
	ctx.strokeStyle = '#EA7948'; //Orange / C Color
	ctx.lineWidth = 4;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 118 + canvas.height / 6.25, 75, Math.PI * -0.5, (2 * Math.PI) * 0.6 + Math.PI * -0.5);
	ctx.strokeStyle = '#FF5858'; //Red / D Color
	ctx.lineWidth = 4;
	ctx.stroke();

	//Write rank
	ctx.font = '70px comfortaa, sans-serif';
	ctx.textAlign = 'center';
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 4;
	ctx.strokeText(score.rank.replace('X', 'SS').replace('H', ''), canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 140 + canvas.height / 6.25);
	ctx.fillStyle = '#FFFFFF';
	ctx.fillText(score.rank.replace('X', 'SS').replace('H', ''), canvas.width / 900 * 190, (background.height / background.width * canvas.width) / 250 * 140 + canvas.height / 6.25);

	//mods
	for (let i = 0; i < mods.length; i++) {
		const modImage = await Canvas.loadImage(getModImage(mods[i]));
		ctx.drawImage(modImage, canvas.width / 900 * 300 + canvas.width / 1000 * 40 * i, (background.height / background.width * canvas.width) / 250 * 28 + canvas.height / 6.25, canvas.width / 1000 * 33, canvas.height / 500 * 23);
	}

	//Write Score
	ctx.font = '60px comfortaa, sans-serif';
	ctx.textAlign = 'left';
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 4;
	ctx.strokeText(humanReadable(score.score), canvas.width / 900 * 300, (background.height / background.width * canvas.width) / 250 * 100 + canvas.height / 6.25);
	ctx.fillStyle = '#FFFFFF';
	ctx.fillText(humanReadable(score.score), canvas.width / 900 * 300, (background.height / background.width * canvas.width) / 250 * 100 + canvas.height / 6.25);

	roundedRect(ctx, canvas.width / 900 * 300, (background.height / background.width * canvas.width) / 250 * 125 + canvas.height / 6.25, 220, 50, 5, '00', '00', '00', 0.75);

	let month = 'January';
	if (score.raw_date.substring(5, 7) === '02') {
		month = 'February';
	} else if (score.raw_date.substring(5, 7) === '03') {
		month = 'March';
	} else if (score.raw_date.substring(5, 7) === '04') {
		month = 'April';
	} else if (score.raw_date.substring(5, 7) === '05') {
		month = 'May';
	} else if (score.raw_date.substring(5, 7) === '06') {
		month = 'June';
	} else if (score.raw_date.substring(5, 7) === '07') {
		month = 'July';
	} else if (score.raw_date.substring(5, 7) === '08') {
		month = 'August';
	} else if (score.raw_date.substring(5, 7) === '09') {
		month = 'September';
	} else if (score.raw_date.substring(5, 7) === '10') {
		month = 'October';
	} else if (score.raw_date.substring(5, 7) === '11') {
		month = 'November';
	} else if (score.raw_date.substring(5, 7) === '12') {
		month = 'December';
	}
	const formattedSubmitDate = `${score.raw_date.substring(8, 10)} ${month} ${score.raw_date.substring(0, 4)} ${score.raw_date.substring(11, 16)}`;

	//Write Played By and Submitted on
	ctx.font = '10px comfortaa, sans-serif';
	ctx.textAlign = 'left';
	ctx.fillStyle = '#FFFFFF';
	ctx.fillText('Played by', canvas.width / 900 * 310, (background.height / background.width * canvas.width) / 250 * 140 + canvas.height / 6.25);
	ctx.fillText(user.name, canvas.width / 900 * 380, (background.height / background.width * canvas.width) / 250 * 140 + canvas.height / 6.25);
	ctx.fillText('Submitted on', canvas.width / 900 * 310, (background.height / background.width * canvas.width) / 250 * 162 + canvas.height / 6.25);
	ctx.fillText(formattedSubmitDate, canvas.width / 900 * 380, (background.height / background.width * canvas.width) / 250 * 162 + canvas.height / 6.25);

	const output = [canvas, ctx, score, beatmap, user, lookedUpScore];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];
	let lookedUpScore = input[5];

	let today = new Date().toLocaleDateString();

	ctx.font = '12px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

	const output = [canvas, ctx, score, beatmap, user, lookedUpScore];
	return output;
}

async function drawAccInfo(input, mode, mapRank) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];
	let lookedUpScore = input[5];

	if (mapRank > 0) {
		//Draw completion
		roundedRect(ctx, canvas.width / 1000 * 450, canvas.height / 500 * 395, 116, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('Global Rank', canvas.width / 1000 * 453 + 55, canvas.height / 500 * 415);
		ctx.fillText(`#${mapRank}`, canvas.width / 1000 * 453 + 55, canvas.height / 500 * 440);
	}

	if (score.rank === 'F') {
		//Calculate Completion
		const beatmapObjects = parseInt(beatmap.circles) + parseInt(beatmap.sliders) + parseInt(beatmap.spinners);
		let scoreHits = parseInt(score.counts[300]) + parseInt(score.counts[100]) + parseInt(score.counts[50]) + parseInt(score.counts.miss);
		//Mania needs to add geki and katu
		if (mode === 3) {
			scoreHits = scoreHits + parseInt(score.counts.geki) + parseInt(score.counts.katu);
		}
		const completion = 100 / beatmapObjects * scoreHits;

		//Draw completion
		roundedRect(ctx, canvas.width / 1000 * 453, canvas.height / 500 * 395, 110, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('Completion', canvas.width / 1000 * 453 + 55, canvas.height / 500 * 415);
		ctx.fillText(`${Math.round(completion * 100) / 100}%`, canvas.width / 1000 * 453 + 55, canvas.height / 500 * 440);
	}

	//Calculate accuracy
	let accuracy = getAccuracy(score, mode) * 100;

	//Acc
	roundedRect(ctx, canvas.width / 1000 * 600, canvas.height / 500 * 365, 110, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('Accuracy', canvas.width / 1000 * 600 + 55, canvas.height / 500 * 385);
	ctx.fillText(`${Math.round(accuracy * 100) / 100}%`, canvas.width / 1000 * 600 + 55, canvas.height / 500 * 410);
	//Combo
	roundedRect(ctx, canvas.width / 1000 * 725, canvas.height / 500 * 365, 130, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('Max Combo', canvas.width / 1000 * 735 + 55, canvas.height / 500 * 385);

	let combo = `${score.maxCombo}x`;

	if (score.perfect) {
		ctx.fillStyle = '#B3FF66';
	} else {
		if (mode === 3 || mode === 1) {
			combo = `${score.maxCombo}x`;
		} else {
			combo = `${score.maxCombo}/${beatmap.maxCombo}x`;
		}
	}
	ctx.fillText(combo, canvas.width / 1000 * 735 + 55, canvas.height / 500 * 410);

	let pp = 'None';

	if (score.pp) {
		pp = Math.round(score.pp);
	} else {
		pp = Math.round(await getOsuPP(beatmap.beatmapId, score.raw_mods, Math.round(accuracy * 100) / 100, score.counts.miss, score.maxCombo));
	}

	ctx.font = '18px comfortaa, sans-serif';
	if (!score.perfect) {
		let fcScore = {
			counts: {
				'300': parseInt(score.counts[300]) + parseInt(score.counts.miss),
				'100': parseInt(score.counts[100]),
				'50': parseInt(score.counts[50]),
				miss: 0
			}
		};

		let fcScoreAccuracy = getAccuracy(fcScore, 0) * 100;
		let fcpp = Math.round(await getOsuPP(beatmap.beatmapId, score.raw_mods, fcScoreAccuracy, 0, beatmap.maxCombo));
		if (pp !== fcpp) {
			pp = `${pp} (${Math.round(fcpp)} If FC)`;
			ctx.font = '16px comfortaa, sans-serif';
		}
	}

	//PP
	roundedRect(ctx, canvas.width / 1000 * 870, canvas.height / 500 * 365, 110, 50, 5, '00', '00', '00', 0.5);
	if (beatmap.approvalStatus !== 'Ranked' && beatmap.approvalStatus !== 'Approved') {
		ctx.fillStyle = '#808080';
	} else {
		ctx.fillStyle = '#ffffff';
	}
	ctx.textAlign = 'center';
	ctx.fillText('PP', canvas.width / 1000 * 870 + 55, canvas.height / 500 * 385);
	ctx.fillText(`${pp}`, canvas.width / 1000 * 870 + 55, canvas.height / 500 * 410);

	//MAX
	if (mode === 3) {
		roundedRect(ctx, canvas.width / 1000 * 600, canvas.height / 500 * 425, 60, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('Max', canvas.width / 1000 * 600 + 30, canvas.height / 500 * 445);
		ctx.fillText(`${score.counts.geki}`, canvas.width / 1000 * 600 + 30, canvas.height / 500 * 470);
	}

	//300
	let displayTerm = '300s';
	let xTextOffset = 0;
	let widthOffset = 0;
	let xRectOffset = 0;
	if (mode === 1) {
		displayTerm = 'Great';
		xTextOffset = 15;
		widthOffset = 30;
	} else if (mode === 2) {
		displayTerm = 'Fruits';
	} else if (mode === 3) {
		xRectOffset = 64;
		widthOffset = -20;
		xTextOffset = 54;
	}
	roundedRect(ctx, canvas.width / 1000 * 600 + xRectOffset, canvas.height / 500 * 425, 80 + widthOffset, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(displayTerm, canvas.width / 1000 * 600 + 40 + xTextOffset, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts[300]}`, canvas.width / 1000 * 600 + 40 + xTextOffset, canvas.height / 500 * 470);

	//200
	if (mode === 3) {
		roundedRect(ctx, canvas.width / 1000 * 728, canvas.height / 500 * 425, 60, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('200s', canvas.width / 1000 * 728 + 30, canvas.height / 500 * 445);
		ctx.fillText(`${score.counts.katu}`, canvas.width / 1000 * 728 + 30, canvas.height / 500 * 470);
	}

	//100
	xRectOffset = 0;
	widthOffset = 0;
	xTextOffset = 0;
	displayTerm = '100s';
	if (mode === 1) {
		displayTerm = 'Good';
		xRectOffset = 25;
		widthOffset = 50;
		xTextOffset = 50;
	} else if (mode === 2) {
		displayTerm = 'Ticks';
	} else if (mode === 3) {
		xRectOffset = 92;
		widthOffset = -20;
		xTextOffset = 82;
	}
	roundedRect(ctx, canvas.width / 1000 * 700 + xRectOffset, canvas.height / 500 * 425, 80 + widthOffset, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(displayTerm, canvas.width / 1000 * 700 + 40 + xTextOffset, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts[100]}`, canvas.width / 1000 * 700 + 40 + xTextOffset, canvas.height / 500 * 470);

	//50
	if (mode !== 1) {
		displayTerm = '50s';
		xRectOffset = 0;
		widthOffset = 0;
		xTextOffset = 0;
		let value = score.counts[50];
		if (mode === 2) {
			displayTerm = 'DRPMiss';
			value = score.counts.katu;
		} else if (mode === 3) {
			xRectOffset = 56;
			widthOffset = -20;
			xTextOffset = 46;
		}
		roundedRect(ctx, canvas.width / 1000 * 800 + xRectOffset, canvas.height / 500 * 425, 80 + widthOffset, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText(displayTerm, canvas.width / 1000 * 800 + 40 + xTextOffset, canvas.height / 500 * 445);
		ctx.fillText(value, canvas.width / 1000 * 800 + 40 + xTextOffset, canvas.height / 500 * 470);
	}

	//Miss
	xRectOffset = 0;
	widthOffset = 0;
	xTextOffset = 0;
	if (mode === 1) {
		xRectOffset = -30;
		widthOffset = 30;
		xTextOffset = -15;
	} else if (mode === 3) {
		xRectOffset = 20;
		widthOffset = -20;
		xTextOffset = 10;
	}
	roundedRect(ctx, canvas.width / 1000 * 900 + xRectOffset, canvas.height / 500 * 425, 80 + widthOffset, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('Miss', canvas.width / 1000 * 900 + 40 + xTextOffset, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts.miss}`, canvas.width / 1000 * 900 + 40 + xTextOffset, canvas.height / 500 * 470);

	const output = [canvas, ctx, score, beatmap, user, lookedUpScore];
	return output;
}

async function drawUserInfo(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];
	let lookedUpScore = input[5];

	if (server !== 'bancho') {
		ctx.save();
		//ctx.translate(newx, newy);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = 'center';
		ctx.fillText(`[${server}]`, -canvas.height / 500 * 425, 50);
		ctx.restore();
	}

	const userBackground = await Canvas.loadImage('./other/defaultBanner.jpg');

	roundedImage(ctx, userBackground, canvas.width / 900 * 50, canvas.height / 500 * 375, userBackground.width / 10 * 2, userBackground.height / 10 * 2, 5);

	let userAvatar;

	try {
		// eslint-disable-next-line no-undef
		process.send('osu! website');
		userAvatar = await Canvas.loadImage(`http://s.ppy.sh/a/${user.id}`);
	} catch (error) {
		// eslint-disable-next-line no-undef
		process.send('osu! website');
		userAvatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
	}

	roundedRect(ctx, canvas.width / 900 * 50 + userBackground.height / 10 * 2, canvas.height / 500 * 375 + 5, userBackground.width / 10 * 2 - userBackground.height / 10 * 2 - 5, userBackground.height / 10 * 2 - 10, 5, '00', '00', '00', 0.5);

	ctx.font = '20px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	ctx.fillText(`Player: ${user.name}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 25);
	ctx.fillText(`Rank: #${humanReadable(user.pp.rank)}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 55);
	ctx.fillText(`PP: ${humanReadable(Math.floor(user.pp.raw))}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 85);

	roundedImage(ctx, userAvatar, canvas.width / 900 * 50 + 5, canvas.height / 500 * 375 + 5, userBackground.height / 10 * 2 - 10, userBackground.height / 10 * 2 - 10, 5);

	const output = [canvas, ctx, score, beatmap, user, lookedUpScore];
	return output;
}