const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { getGuildPrefix, humanReadable, roundedRect, getRankImage, getModImage, getGameModeName, getLinkModeName, getMods, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname } = require('../utils');
const fetch = require('node-fetch');

module.exports = {
	name: 'osu-top',
	aliases: ['osu-plays', 'osu-topplays', 'osu-best'],
	description: 'Sends an info card about the topplays of the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces; Use --b for bancho / --r for ripple; Use --o/--t/--c/--m for modes; --n / --new / --recent for recent scores; --25 for top 25...)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		const guildPrefix = getGuildPrefix(msg);

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		const server = commandConfig[1];
		const mode = commandConfig[2];

		let recentScores = false;
		let limit = 10;
		let tracking = false;

		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--new' || args[i] === '--recent' || args[i] === '--n') {
				recentScores = true;
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
				getTopPlays(msg, commandUser.osuUserId, server, mode, false, recentScores, limit, tracking);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getTopPlays(msg, userDisplayName, server, mode, false, recentScores, limit, tracking);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getTopPlays(msg, discordUser.osuUserId, server, mode, false, recentScores, limit, tracking);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
						getTopPlays(msg, args[i], server, mode, false, recentScores, limit, tracking);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getTopPlays(msg, args[i], server, mode, true, recentScores, limit, tracking);
						} else {
							getTopPlays(msg, args[i], server, mode, false, recentScores, limit, tracking);
						}
					} else {
						getTopPlays(msg, args[i], server, mode, false, recentScores, limit, tracking);
					}
				}
			}
		}
	}
};

async function getTopPlays(msg, username, server, mode, noLinkedAccount, recentScores, limit, tracking) {
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

				elements = await drawTitle(elements, server, mode, recentScores);

				elements = await drawTopPlays(elements, server, mode, msg, recentScores, limit);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-top-${user.id}.png`);

				//If created by osu-tracking
				if (tracking) {
					await msg.channel.send(`\`${user.name}\` got ${limit} new top plays!`, attachment);
				} else {
					//Define prefix command
					let guildPrefix = await getGuildPrefix(msg);

					//declare hints array
					var hints = [`Try \`${guildPrefix}osu-profile ${user.name.replace(/ /g, '_')}\` for a profile card.`, `Try \`${guildPrefix}osu-recent ${user.name.replace(/ /g, '_')}\` for recent plays.`, `Try \`${guildPrefix}osu-score <beatmapID> ${user.name.replace(/ /g, '_')}\` for the best score on a map.`];

					//Send attachment
					if (noLinkedAccount) {
						await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\n${hints[Math.floor(Math.random() * hints.length)]}\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, attachment);
					} else {
						await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\n${hints[Math.floor(Math.random() * hints.length)]}`, attachment);
					}
				}

				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --r for ripple; Use --o/--t/--c/--m for modes; --n / --new / --recent for recent scores; --25 for top 25...)`);
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
					return msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --b for bancho; Use --o/--t/--c/--m for modes; --n / --new / --recent for recent scores; --25 for top 25...)`);
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

				elements = await drawTitle(elements, server, mode, recentScores);

				elements = await drawTopPlays(elements, server, mode, msg, recentScores);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-top-${user.id}.png`);

				//Define prefix command
				let guildPrefix = await getGuildPrefix(msg);

				//declare hints array
				var hints = [`Try \`${guildPrefix}osu-profile ${user.name.replace(/ /g, '_')}\` for a profile card.`, `Try \`${guildPrefix}osu-recent ${user.name.replace(/ /g, '_')}\` for recent plays.`, `Try \`${guildPrefix}osu-score <beatmapID> ${user.name.replace(/ /g, '_')}\` for the best score on a map.`];

				//Send attachment
				await msg.channel.send(`\`${user.name}\`: <https://ripple.moe/u/${user.id}?mode=${mode}>\nSpectate: <osu://spectate/${user.id}>\n${hints[Math.floor(Math.random() * hints.length)]}`, attachment);
				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --b for bancho; Use --o/--t/--c/--m for modes; --n / --new / --recent for recent scores; --25 for top 25...)`);
				} else {
					console.log(err);
				}
			});
	}
}

async function drawTitle(input, server, mode, recentScores) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let serverDisplay = '';

	if (server !== 'bancho') {
		serverDisplay = `[${server}] `;
	}

	let recent = '';

	if (recentScores) {
		recent = 'most recent ';
	}

	let gameMode = getGameModeName(mode);

	let title = `✰ ${serverDisplay}${user.name}'s ${recent}${gameMode} top plays ✰`;
	if (user.name.endsWith('s') || user.name.endsWith('x')) {
		title = `✰ ${serverDisplay}${user.name}' ${recent}${gameMode} top plays ✰`;
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

async function drawTopPlays(input, server, mode, msg, recentScores, showLimit) {
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

	if (recentScores) {
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
	}

	if (recentScores) {
		quicksort(scores);
	}

	for (let i = 0; i < scores.length && i < showLimit; i++) {
		roundedRect(ctx, canvas.width / 70, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 35, 500 / 13, 500 / 70, '70', '57', '63', 0.75);

		const rankImage = await Canvas.loadImage(getRankImage(scores[i].rank));
		ctx.drawImage(rankImage, canvas.width / 35, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 - 500 / 31.25 / 2, canvas.width / 31.25, 500 / 31.25);

		ctx.font = 'bold 18px comfortaa, sans-serif';
		ctx.fillStyle = '#FF66AB';
		ctx.textAlign = 'right';
		ctx.fillText(humanReadable(Math.floor(scores[i].pp)) + 'pp', (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);

		const beatmap = await osuApi.getBeatmaps({ b: scores[i].beatmapId });
		let beatmapTitle = `${beatmap[0].title} by ${beatmap[0].artist}`;
		const maxSize = canvas.width / 250 * 19;
		if (beatmapTitle.length > maxSize) {
			beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
		}

		//Write title per map
		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'left';
		ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

		//Write Difficulty per map
		ctx.font = 'bold 10px comfortaa, sans-serif';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'left';
		ctx.fillText(beatmap[0].version, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);

		let today = new Date();

		const todayMilliseconds = today.getTime();	//Get the time (milliseconds since January 1, 1970)

		const scoreMilliseconds = Date.parse(scores[i].raw_date); //Get the time (milliseconds since January 1, 1970)

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
		ctx.fillText(achievedTime, (canvas.width / 35) * 3 + parseInt(beatmap[0].version.length) * 6 + canvas.width / 50, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);

		const accuracy = (scores[i].counts[300] * 100 + scores[i].counts[100] * 33.33 + scores[i].counts[50] * 16.67) / (parseInt(scores[i].counts[300]) + parseInt(scores[i].counts[100]) + parseInt(scores[i].counts[50]) + parseInt(scores[i].counts.miss));

		let combo;

		if (mode === 3) {
			combo = `(${scores[i].maxCombo}x)`;
		} else {
			combo = `(${scores[i].maxCombo}/${beatmap[0].maxCombo})`;
		}

		ctx.font = 'bold 10px comfortaa, sans-serif';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'right';
		ctx.fillText(combo, (canvas.width / 28) * 23.4, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		ctx.fillText(Math.round(accuracy * 100) / 100 + '%', (canvas.width / 28) * 24.75, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);

		const mods = getMods(scores[i].raw_mods);
		for (let j = 0; j < mods.length; j++) {
			const modImage = await Canvas.loadImage(getModImage(mods[mods.length - j - 1]));
			ctx.drawImage(modImage, (canvas.width / 28) * 24.75 - (canvas.width / 1000 * 23) * (j + 1), 500 / 8 + (500 / 12) * i + (500 / 12) / 5, canvas.width / 1000 * 23, 500 / 125 * 4);
		}
	}

	const output = [canvas, ctx, user];
	return output;
}

function partition(list, start, end) {
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

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}