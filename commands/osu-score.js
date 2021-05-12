const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { getGuildPrefix, humanReadable, roundedRect, getModImage, getLinkModeName, getMods, getGameMode, roundedImage, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname } = require('../utils');
const fetch = require('node-fetch');
const { calculateStarRating } = require('osu-sr-calculator');

module.exports = {
	name: 'osu-score',
	aliases: ['os', 'o-s'],
	description: 'Sends an info card about the score of the specified player on the map',
	usage: '<beatmapID> [username] [username] ... (Use "_" instead of spaces)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	//guildOnly: true,
	args: true,
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

		let mapRank = 0;

		for (let i = 0; i < args.length; i++) {
			if (args[i].startsWith('--event')) {
				mapRank = args[i].substring(7);
				args.splice(i, 1);
				i--;
			}
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		const beatmapId = args.shift();

		osuApi.getBeatmaps({ b: beatmapId })
			.then(async (beatmaps) => {
				if (!args[0]) {//Get profile by author if no argument
					if (commandUser && commandUser.osuUserId) {
						getScore(msg, beatmaps[0], commandUser.osuUserId, server, mode, false, mapRank);
					} else {
						const userDisplayName = await getMessageUserDisplayname(msg);
						getScore(msg, beatmaps[0], userDisplayName, server, mode, false, mapRank);
					}
				} else {
					//Get profiles by arguments
					for (let i = 0; i < args.length; i++) {
						if (args[i].startsWith('<@') && args[i].endsWith('>')) {
							const discordUser = await DBDiscordUsers.findOne({
								where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
							});

							if (discordUser && discordUser.osuUserId) {
								getScore(msg, beatmaps[0], discordUser.osuUserId, server, mode, false, mapRank);
							} else {
								msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
								getScore(msg, beatmaps[0], args[i], server, mode, false, mapRank);
							}
						} else {

							if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
								if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
									getScore(msg, beatmaps[0], args[i], server, mode, true, mapRank);
								} else {
									getScore(msg, beatmaps[0], args[i], server, mode, false, mapRank);
								}
							} else {
								getScore(msg, beatmaps[0], args[i], server, mode, false, mapRank);
							}
						}
					}
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Couldn't find beatmap \`${beatmapId.replace(/`/g, '')}\``);
				} else {
					console.log(err);
				}
			});
	},
};

async function getScore(msg, beatmap, username, server, mode, noLinkedAccount, mapRank) {
	if (server === 'bancho') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});
		osuApi.getScores({ b: beatmap.id, u: username, m: mode })
			.then(async (scores) => {
				if (!(scores[0])) {
					return msg.channel.send(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.id}\`.`);
				}
				const user = await osuApi.getUser({ u: username, m: mode });
				updateOsuDetailsforUser(user, mode);

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

				let elements = [canvas, ctx, scores[0], beatmap, user];

				elements = await drawTitle(elements);

				elements = await drawCover(elements);

				elements = await drawFooter(elements);

				elements = await drawAccInfo(elements, mapRank);

				await drawUserInfo(elements, server);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-recent-${user.id}-${beatmap.id}.png`);

				//If coming from osu-tracking
				if (mapRank > 0) {
					await msg.channel.send(`\`${user.name}\` achieved rank **#${mapRank}**!`, attachment);
				} else {
					let guildPrefix = await getGuildPrefix(msg);

					//declare hints array
					var hints = [`Try \`${guildPrefix}osu-profile ${user.name.replace(/ /g, '_')}\` for a profile card.`, `Try \`${guildPrefix}osu-top ${user.name.replace(/ /g, '_')}\` for top plays.`, `Try \`${guildPrefix}osu-recent ${user.name.replace(/ /g, '_')}\` for recent plays.`];

					let sentMessage;

					//Send attachment
					if (noLinkedAccount) {
						sentMessage = await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>\n${hints[Math.floor(Math.random() * hints.length)]}\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, attachment);
					} else {
						sentMessage = await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>\n${hints[Math.floor(Math.random() * hints.length)]}`, attachment);
					}
					sentMessage.react('<:COMPARE:827974793365159997>');
				}

				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.id}\`.`);
				} else {
					console.log(err);
				}
			});
	} else if (server === 'ripple') {
		let processingMessage = await msg.channel.send(`[\`${username.replace(/`/g, '')}\`] Processing...`);
		fetch(`https://www.ripple.moe/api/get_scores?b=${beatmap.id}&u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return msg.channel.send(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.id}\`.`);
				}

				let score = rippleToBanchoScore(responseJson[0]);

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

						let elements = [canvas, ctx, score, beatmap, user];

						elements = await drawTitle(elements);

						elements = await drawCover(elements);

						elements = await drawFooter(elements);

						elements = await drawAccInfo(elements);

						await drawUserInfo(elements, server);

						//Create as an attachment
						const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-recent-${user.id}-${beatmap.id}.png`);

						let guildPrefix = await getGuildPrefix(msg);

						//declare hints array
						var hints = [`Try \`${guildPrefix}osu-profile ${user.name.replace(/ /g, '_')}\` for a profile card.`, `Try \`${guildPrefix}osu-top ${user.name.replace(/ /g, '_')}\` for top plays.`, `Try \`${guildPrefix}osu-recent ${user.name.replace(/ /g, '_')}\` for recent plays.`];

						let sentMessage;

						//Send attachment
						if (noLinkedAccount) {
							sentMessage = await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}>\nSpectate: <osu://spectate/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>\n${hints[Math.floor(Math.random() * hints.length)]}\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, attachment);
						} else {
							sentMessage = await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}>\nSpectate: <osu://spectate/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>\n${hints[Math.floor(Math.random() * hints.length)]}`, attachment);
						}
						processingMessage.delete();
						sentMessage.react('<:COMPARE:827974793365159997>');
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						} else {
							console.log(err);
						}
					});
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.log(err);
				}
			});
	}
}

async function drawTitle(input) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];

	const gameMode = getGameMode(beatmap);
	const modePic = await Canvas.loadImage(`./other/mode-${gameMode}.png`);
	ctx.drawImage(modePic, canvas.width / 1000 * 10, canvas.height / 500 * 40, canvas.height / 500 * 35, canvas.height / 500 * 35);

	// Write the title of the beatmap
	ctx.font = '30px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	ctx.fillText(`${beatmap.title} by ${beatmap.artist}`, canvas.width / 100, canvas.height / 500 * 35);
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

	if (mods.includes('DT') || mods.includes('HT') || mods.includes('HR') || mods.includes('EZ')) {
		const starRating = await calculateStarRating(beatmap.id, mods);
		ctx.fillText(`★ ${Math.round(beatmap.difficulty.rating * 100) / 100} (${Math.round(starRating[mods.join('')] * 100) / 100} with ${mods.join('')})   ${beatmap.version} mapped by ${beatmap.creator}`, canvas.width / 1000 * 60, canvas.height / 500 * 70);
	} else {
		ctx.fillText(`★ ${Math.round(beatmap.difficulty.rating * 100) / 100}   ${beatmap.version} mapped by ${beatmap.creator}`, canvas.width / 1000 * 60, canvas.height / 500 * 70);
	}

	const output = [canvas, ctx, score, beatmap, user];
	return output;
}

async function drawCover(input) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];

	let background;

	ctx.globalAlpha = 0.6;
	//Draw a shape onto the main canvas in the top left
	try {
		background = await Canvas.loadImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapSetId}/covers/cover.jpg`);
		ctx.drawImage(background, 0, canvas.height / 6.25, canvas.width, background.height / background.width * canvas.width);
	} catch (error) {
		background = await Canvas.loadImage('https://osu.ppy.sh/assets/images/default-bg.7594e945.png');
		ctx.drawImage(background, 0, canvas.height / 6.25, canvas.width, background.height / background.width * canvas.width);
	}
	ctx.globalAlpha = 1;

	let gradeSS;
	let gradeS;

	const mods = getMods(score.raw_mods);

	if (mods.includes('HD')) {
		gradeSS = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-SS-Silver.6681366c.svg');
		gradeS = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg');
	} else {
		gradeSS = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-SS.a21de890.svg');
		gradeS = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg');
	}

	const gradeA = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-A.d785e824.svg');
	const gradeB = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-B.e19fc91b.svg');
	const gradeC = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-C.6bb75adc.svg');
	const gradeD = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-D.6b170c4c.svg');

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
	const accuracy = ((score.counts[300] * 100 + score.counts[100] * 33.33 + score.counts[50] * 16.67) / (parseInt(score.counts[300]) + parseInt(score.counts[100]) + parseInt(score.counts[50]) + parseInt(score.counts.miss))) / 100;

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

	const output = [canvas, ctx, score, beatmap, user];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];

	let today = new Date().toLocaleDateString();

	ctx.font = '12px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

	const output = [canvas, ctx, score, beatmap, user];
	return output;
}

async function drawAccInfo(input, mapRank) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];

	if (mapRank > 0) {
		//Draw completion
		roundedRect(ctx, canvas.width / 1000 * 450, canvas.height / 500 * 395, 116, 50, 5, '00', '00', '00', 0.5);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('Global Rank', canvas.width / 1000 * 453 + 55, canvas.height / 500 * 415);
		ctx.fillText(`#${mapRank}`, canvas.width / 1000 * 453 + 55, canvas.height / 500 * 440);
	}

	//Calculate accuracy
	const accuracy = (score.counts[300] * 100 + score.counts[100] * 33.33 + score.counts[50] * 16.67) / (parseInt(score.counts[300]) + parseInt(score.counts[100]) + parseInt(score.counts[50]) + parseInt(score.counts.miss));

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
		combo = `${score.maxCombo}/${beatmap.maxCombo}x`;
	}
	ctx.fillText(combo, canvas.width / 1000 * 735 + 55, canvas.height / 500 * 410);

	let pp = 'None';
	if (score.pp) {
		pp = Math.round(score.pp);
	}

	//PP
	roundedRect(ctx, canvas.width / 1000 * 870, canvas.height / 500 * 365, 110, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('PP', canvas.width / 1000 * 870 + 55, canvas.height / 500 * 385);
	ctx.fillText(`${pp}`, canvas.width / 1000 * 870 + 55, canvas.height / 500 * 410);
	//300
	roundedRect(ctx, canvas.width / 1000 * 600, canvas.height / 500 * 425, 80, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('300s', canvas.width / 1000 * 600 + 40, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts[300]}`, canvas.width / 1000 * 600 + 40, canvas.height / 500 * 470);
	//100
	roundedRect(ctx, canvas.width / 1000 * 700, canvas.height / 500 * 425, 80, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('100s', canvas.width / 1000 * 700 + 40, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts[100]}`, canvas.width / 1000 * 700 + 40, canvas.height / 500 * 470);
	//50
	roundedRect(ctx, canvas.width / 1000 * 800, canvas.height / 500 * 425, 80, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('50s', canvas.width / 1000 * 800 + 40, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts[50]}`, canvas.width / 1000 * 800 + 40, canvas.height / 500 * 470);
	//Miss
	roundedRect(ctx, canvas.width / 1000 * 900, canvas.height / 500 * 425, 80, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('Miss', canvas.width / 1000 * 900 + 40, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts.miss}`, canvas.width / 1000 * 900 + 40, canvas.height / 500 * 470);

	const output = [canvas, ctx, score, beatmap, user];
	return output;
}

async function drawUserInfo(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];

	if (server !== 'bancho') {
		ctx.save();
		//ctx.translate(newx, newy);
		ctx.rotate(-Math.PI / 2);
		ctx.textAlign = 'center';
		ctx.fillText(`[${server}]`, -canvas.height / 500 * 425, 50);
		ctx.restore();
	}

	const userBackground = await Canvas.loadImage('https://osu.ppy.sh/images/headers/profile-covers/c3.jpg');

	roundedImage(ctx, userBackground, canvas.width / 900 * 50, canvas.height / 500 * 375, userBackground.width / 10 * 2, userBackground.height / 10 * 2, 5);

	let userAvatar;

	try {
		userAvatar = await Canvas.loadImage(`http://s.ppy.sh/a/${user.id}`);
	} catch (error) {
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

	const output = [canvas, ctx, score, beatmap, user];
	return output;
}