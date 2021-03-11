const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const getGuildPrefix = require('../getGuildPrefix');
const fetch = require('node-fetch');

module.exports = {
	name: 'osu-score',
	aliases: ['os', 'o-s'],
	description: 'Sends an info card about the score of the specified player on the map',
	usage: '<beatmapID> [username] [username] ... (Use "_" instead of spaces)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		const guildPrefix = getGuildPrefix(msg);

		let server = 'bancho';
		let mode = 0;

		//Check user settings
		const commandUser = await DBDiscordUsers.findOne({
			where: { userId: msg.author.id },
		});

		if (commandUser && commandUser.osuMainServer) {
			server = commandUser.osuMainServer;
		}

		if (commandUser && commandUser.osuMainMode) {
			mode = commandUser.osuMainMode;
		}

		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--s' || args[i] === '--standard') {
				mode = 0;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--t' || args[i] === '--taiko') {
				mode = 1;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--c' || args[i] === '--catch') {
				mode = 2;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--m' || args[i] === '--mania') {
				mode = 3;
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--r' || args[i] === '--ripple') {
				server = 'ripple';
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--b' || args[i] === '--bancho') {
				server = 'bancho';
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
						getScore(msg, beatmaps[0], commandUser.osuUserId, server, mode);
					} else {
						const userDisplayName = msg.guild.member(msg.author).displayName;
						getScore(msg, beatmaps[0], userDisplayName, server, mode);
					}
				} else {
					//Get profiles by arguments
					for (let i = 0; i < args.length; i++) {
						if (args[i].startsWith('<@!') && args[i].endsWith('>')) {
							const discordUser = await DBDiscordUsers.findOne({
								where: { userId: args[i].replace('<@!', '').replace('>', '') },
							});

							if (discordUser && discordUser.osuUserId) {
								getScore(msg, beatmaps[0], discordUser.osuUserId, server, mode);
							} else {
								msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
								getScore(msg, beatmaps[0], args[i], server, mode);
							}
						} else {

							if (args.length === 1 && !(args[0].startsWith('<@!')) && !(args[0].endsWith('>'))) {
								if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
									getScore(msg, beatmaps[0], args[i], server, mode, true);
								} else {
									getScore(msg, beatmaps[0], args[i], server, mode);
								}
							} else {
								getScore(msg, beatmaps[0], args[i], server, mode);
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

async function getScore(msg, beatmap, username, server, mode, noLinkedAccount) {
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
					return msg.channel.send(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\``);
				}
				const user = await osuApi.getUser({ u: username, m: mode });

				//get discordUser from db to update pp and rank
				DBDiscordUsers.findOne({
					where: { osuUserId: user.id },
				})
					.then(discordUser => {
						if (discordUser && discordUser.osuUserId) {
							discordUser.osuName = user.name;
							if (mode === 0) {
								discordUser.osuPP = user.pp.raw;
								discordUser.osuRank = user.pp.rank;
							} else if (mode === 1) {
								discordUser.taikoPP = user.pp.raw;
								discordUser.taikoRank = user.pp.rank;
							} else if (mode === 2) {
								discordUser.catchPP = user.pp.raw;
								discordUser.catchRank = user.pp.rank;
							} else if (mode === 3) {
								discordUser.maniaPP = user.pp.raw;
								discordUser.maniaRank = user.pp.rank;
							}
							discordUser.save();
						}
					})
					.catch(err => {
						console.log(err);
					});

				let processingMessage = await msg.channel.send(`[${user.name}] Processing...`);

				const canvasWidth = 1000;
				const canvasHeight = 500;

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

				elements = await drawAccInfo(elements);

				await drawUserInfo(elements, server);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-recent-${user.id}-${beatmap.id}.png`);

				let guildPrefix = await getGuildPrefix(msg);

				//declare hints array
				var hints = [`Try \`${guildPrefix}osu-profile ${user.name.replace(/ /g, '_')}\` for a profile card.`, `Try \`${guildPrefix}osu-top ${user.name.replace(/ /g, '_')}\` for top plays.`, `Try \`${guildPrefix}osu-recent ${user.name.replace(/ /g, '_')}\` for recent plays.`];

				// //Send attachment
				if (noLinkedAccount) {
					await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/u/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>\n${hints[Math.floor(Math.random() * hints.length)]}\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, attachment);
				} else {
					await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/u/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>\n${hints[Math.floor(Math.random() * hints.length)]}`, attachment);
				}
				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Couldn't find any scores for \`${username.replace(/`/g, '')}\``);
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
					return msg.channel.send(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				}

				let score = {
					score: responseJson[0].score,
					user: {
						name: null,
						id: responseJson[0].user_id
					},
					beatmapId: responseJson[0].beatmap_id,
					counts: {
						'50': responseJson[0].count50,
						'100': responseJson[0].count100,
						'300': responseJson[0].count300,
						geki: responseJson[0].countgeki,
						katu: responseJson[0].countkatu,
						miss: responseJson[0].countmiss
					},
					maxCombo: responseJson[0].maxcombo,
					perfect: false,
					raw_date: responseJson[0].date,
					rank: responseJson[0].rank,
					pp: responseJson[0].pp,
					hasReplay: false,
					raw_mods: responseJson[0].enabled_mods,
					beatmap: undefined
				};

				if (responseJson[0].perfect === '1') {
					score.perfect = true;
				}

				fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
					.then(async (response) => {
						const responseJson = await response.json();
						if (!responseJson[0]) {
							return msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						}

						let user = {
							id: responseJson[0].user_id,
							name: responseJson[0].username,
							counts: {
								'300': parseInt(responseJson[0].count300),
								'100': parseInt(responseJson[0].count100),
								'50': parseInt(responseJson[0].count50),
								'SSH': parseInt(responseJson[0].count_rank_ssh),
								'SS': parseInt(responseJson[0].count_rank_ss),
								'SH': parseInt(responseJson[0].count_rank_sh),
								'S': parseInt(responseJson[0].count_rank_s),
								'A': parseInt(responseJson[0].count_rank_a),
								'plays': parseInt(responseJson[0].playcount)
							},
							scores: {
								ranked: parseInt(responseJson[0].ranked_score),
								total: parseInt(responseJson[0].total_score)
							},
							pp: {
								raw: parseFloat(responseJson[0].pp_raw),
								rank: parseInt(responseJson[0].pp_rank),
								countryRank: parseInt(responseJson[0].pp_country_rank)
							},
							country: responseJson[0].country,
							level: parseFloat(responseJson[0].level),
							accuracy: parseFloat(responseJson[0].accuracy),
							secondsPlayed: parseInt(responseJson[0].total_seconds_played),
							raw_joinDate: responseJson[0].join_date,
							events: []
						};
		
						const canvasWidth = 1000;
						const canvasHeight = 500;
		
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
		
						// //Send attachment
						if (noLinkedAccount) {
							await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>\n${hints[Math.floor(Math.random() * hints.length)]}\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, attachment);
						} else {
							await msg.channel.send(`\`${user.name}\`: <https://osu.ppy.sh/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>\n${hints[Math.floor(Math.random() * hints.length)]}`, attachment);
						}
						processingMessage.delete();

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
	ctx.font = '30px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	ctx.fillText(`${beatmap.title} by ${beatmap.artist}`, canvas.width / 100, canvas.height / 500 * 35);
	ctx.font = '25px sans-serif';
	ctx.fillText(`★ ${Math.round(beatmap.difficulty.rating * 100) / 100}   ${beatmap.version} mapped by ${beatmap.creator}`, canvas.width / 1000 * 60, canvas.height / 500 * 70);

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
	ctx.font = '70px sans-serif';
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
	ctx.font = '60px sans-serif';
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
	ctx.font = '10px sans-serif';
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

	ctx.font = '12px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

	const output = [canvas, ctx, score, beatmap, user];
	return output;
}

async function drawAccInfo(input) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];
	let user = input[4];

	//Calculate accuracy
	const accuracy = (score.counts[300] * 100 + score.counts[100] * 33.33 + score.counts[50] * 16.67) / (parseInt(score.counts[300]) + parseInt(score.counts[100]) + parseInt(score.counts[50]) + parseInt(score.counts.miss));

	//Acc
	roundedRect(ctx, canvas.width / 1000 * 600, canvas.height / 500 * 365, 110, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('Accuracy', canvas.width / 1000 * 600 + 55, canvas.height / 500 * 385);
	ctx.fillText(`${Math.round(accuracy * 100) / 100}%`, canvas.width / 1000 * 600 + 55, canvas.height / 500 * 410);
	//Combo
	roundedRect(ctx, canvas.width / 1000 * 735, canvas.height / 500 * 365, 110, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('Max Combo', canvas.width / 1000 * 735 + 55, canvas.height / 500 * 385);
	if (score.perfect) {
		ctx.fillStyle = '#B3FF66';
	}
	ctx.fillText(`${score.maxCombo}x`, canvas.width / 1000 * 735 + 55, canvas.height / 500 * 410);

	let pp = 'None';
	if (score.pp) {
		pp = Math.round(score.pp);
	}

	//PP
	roundedRect(ctx, canvas.width / 1000 * 870, canvas.height / 500 * 365, 110, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('PP', canvas.width / 1000 * 870 + 55, canvas.height / 500 * 385);
	ctx.fillText(`${pp}`, canvas.width / 1000 * 870 + 55, canvas.height / 500 * 410);
	//300
	roundedRect(ctx, canvas.width / 1000 * 600, canvas.height / 500 * 425, 80, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('300s', canvas.width / 1000 * 600 + 40, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts[300]}`, canvas.width / 1000 * 600 + 40, canvas.height / 500 * 470);
	//100
	roundedRect(ctx, canvas.width / 1000 * 700, canvas.height / 500 * 425, 80, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('100s', canvas.width / 1000 * 700 + 40, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts[100]}`, canvas.width / 1000 * 700 + 40, canvas.height / 500 * 470);
	//50
	roundedRect(ctx, canvas.width / 1000 * 800, canvas.height / 500 * 425, 80, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('50s', canvas.width / 1000 * 800 + 40, canvas.height / 500 * 445);
	ctx.fillText(`${score.counts[50]}`, canvas.width / 1000 * 800 + 40, canvas.height / 500 * 470);
	//Miss
	roundedRect(ctx, canvas.width / 1000 * 900, canvas.height / 500 * 425, 80, 50, 5, '00', '00', '00', 0.5);
	ctx.font = '18px sans-serif';
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

	if(server !== 'bancho'){
		ctx.save();
		//ctx.translate(newx, newy);
		ctx.rotate(-Math.PI/2);
		ctx.textAlign = 'center';
		ctx.fillText(`[${server}]`, -canvas.height/500*425, 50);
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

	ctx.font = '20px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	ctx.fillText(`Player: ${user.name}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 25);
	ctx.fillText(`Rank: #${humanReadable(user.pp.rank)}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 55);
	ctx.fillText(`PP: ${humanReadable(Math.floor(user.pp.raw))}`, canvas.width / 900 * 50 + userBackground.height / 10 * 2 + 5, canvas.height / 500 * 375 + 85);

	roundedImage(ctx, userAvatar, canvas.width / 900 * 50 + 5, canvas.height / 500 * 375 + 5, userBackground.height / 10 * 2 - 10, userBackground.height / 10 * 2 - 10, 5);

	const output = [canvas, ctx, score, beatmap, user];
	return output;
}

function humanReadable(input) {
	let output = '';
	if (input) {
		input = input.toString();
		for (let i = 0; i < input.length; i++) {
			if (i > 0 && (input.length - i) % 3 === 0) {
				output = output + '.';
			}
			output = output + input.charAt(i);
		}
	}

	return output;
}

function roundedRect(ctx, x, y, width, height, radius, R, G, B, A) {
	ctx.beginPath();
	ctx.moveTo(x, y + radius);
	ctx.lineTo(x, y + height - radius);
	ctx.arcTo(x, y + height, x + radius, y + height, radius);
	ctx.lineTo(x + width - radius, y + height);
	ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
	ctx.lineTo(x + width, y + radius);
	ctx.arcTo(x + width, y, x + width - radius, y, radius);
	ctx.lineTo(x + radius, y);
	ctx.arcTo(x, y, x, y + radius, radius);
	ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${A})`;
	ctx.fill();
}

function roundedImage(ctx, image, x, y, width, height, radius) {
	ctx.beginPath();
	ctx.moveTo(x, y + radius);
	ctx.lineTo(x, y + height - radius);
	ctx.arcTo(x, y + height, x + radius, y + height, radius);
	ctx.lineTo(x + width - radius, y + height);
	ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
	ctx.lineTo(x + width, y + radius);
	ctx.arcTo(x + width, y, x + width - radius, y, radius);
	ctx.lineTo(x + radius, y);
	ctx.arcTo(x, y, x, y + radius, radius);
	ctx.closePath();
	ctx.clip();

	ctx.drawImage(image, x, y, width, height);
}

function getMods(input) {

	let mods = [];
	let modsBits = input;
	let PFpossible = false;
	let hasNC = false;
	if (modsBits >= 1073741824) {
		mods.push('MI');
		modsBits = modsBits - 1073741824;
	}
	if (modsBits >= 536870912) {
		mods.push('V2');
		modsBits = modsBits - 536870912;
	}
	if (modsBits >= 268435456) {
		mods.push('2K');
		modsBits = modsBits - 268435456;
	}
	if (modsBits >= 134217728) {
		mods.push('3K');
		modsBits = modsBits - 134217728;
	}
	if (modsBits >= 67108864) {
		mods.push('1K');
		modsBits = modsBits - 67108864;
	}
	if (modsBits >= 33554432) {
		mods.push('KC');
		modsBits = modsBits - 33554432;
	}
	if (modsBits >= 16777216) {
		mods.push('9K');
		modsBits = modsBits - 16777216;
	}
	if (modsBits >= 8388608) {
		mods.push('TG');
		modsBits = modsBits - 8388608;
	}
	if (modsBits >= 4194304) {
		mods.push('CI');
		modsBits = modsBits - 4194304;
	}
	if (modsBits >= 2097152) {
		mods.push('RD');
		modsBits = modsBits - 2097152;
	}
	if (modsBits >= 1048576) {
		mods.push('FI');
		modsBits = modsBits - 1048576;
	}
	if (modsBits >= 524288) {
		mods.push('8K');
		modsBits = modsBits - 524288;
	}
	if (modsBits >= 262144) {
		mods.push('7K');
		modsBits = modsBits - 262144;
	}
	if (modsBits >= 131072) {
		mods.push('6K');
		modsBits = modsBits - 131072;
	}
	if (modsBits >= 65536) {
		mods.push('5K');
		modsBits = modsBits - 65536;
	}
	if (modsBits >= 32768) {
		mods.push('4K');
		modsBits = modsBits - 32768;
	}
	if (modsBits >= 16384) {
		PFpossible = true;
		modsBits = modsBits - 16384;
	}
	if (modsBits >= 8192) {
		mods.push('AP');
		modsBits = modsBits - 8192;
	}
	if (modsBits >= 4096) {
		mods.push('SO');
		modsBits = modsBits - 4096;
	}
	if (modsBits >= 2048) {
		modsBits = modsBits - 2048;
	}
	if (modsBits >= 1024) {
		mods.push('FL');
		modsBits = modsBits - 1024;
	}
	if (modsBits >= 512) {
		hasNC = true;
		mods.push('NC');
		modsBits = modsBits - 512;
	}
	if (modsBits >= 256) {
		mods.push('HT');
		modsBits = modsBits - 256;
	}
	if (modsBits >= 128) {
		mods.push('RX');
		modsBits = modsBits - 128;
	}
	if (modsBits >= 64) {
		if (!hasNC) {
			mods.push('DT');
		}
		modsBits = modsBits - 64;
	}
	if (modsBits >= 32) {
		if (PFpossible) {
			mods.push('PF');
		} else {
			mods.push('SD');
		}
		modsBits = modsBits - 32;
	}
	if (modsBits >= 16) {
		mods.push('HR');
		modsBits = modsBits - 16;
	}
	if (modsBits >= 8) {
		mods.push('HD');
		modsBits = modsBits - 8;
	}
	if (modsBits >= 4) {
		mods.push('TD');
		modsBits = modsBits - 4;
	}
	if (modsBits >= 2) {
		mods.push('EZ');
		modsBits = modsBits - 2;
	}
	if (modsBits >= 1) {
		mods.push('NF');
		modsBits = modsBits - 1;
	}

	return mods;
}

function getModImage(mod) {
	let URL = 'https://osu.ppy.sh/assets/images/mod_no-mod.d04b9d35.png';

	if (mod === 'NF') {
		URL = 'https://osu.ppy.sh/assets/images/mod_no-fail.ca1a6374.png';
	} else if (mod === 'EZ') {
		URL = 'https://osu.ppy.sh/assets/images/mod_easy.076c7e8c.png';
	} else if (mod === 'HT') {
		URL = 'https://osu.ppy.sh/assets/images/mod_half.3e707fd4.png';
	} else if (mod === 'HR') {
		URL = 'https://osu.ppy.sh/assets/images/mod_hard-rock.52c35a3a.png';
	} else if (mod === 'SD') {
		URL = 'https://osu.ppy.sh/assets/images/mod_sudden-death.d0df65c7.png';
	} else if (mod === 'PF') {
		URL = 'https://osu.ppy.sh/assets/images/mod_perfect.460b6e49.png';
	} else if (mod === 'DT') {
		URL = 'https://osu.ppy.sh/assets/images/mod_double-time.348a64d3.png';
	} else if (mod === 'NC') {
		URL = 'https://osu.ppy.sh/assets/images/mod_nightcore.240c22f2.png';
	} else if (mod === 'HD') {
		URL = 'https://osu.ppy.sh/assets/images/mod_hidden.cfc32448.png';
	} else if (mod === 'FL') {
		URL = 'https://osu.ppy.sh/assets/images/mod_flashlight.be8ff220.png';
	} else if (mod === 'SO') {
		URL = 'https://osu.ppy.sh/assets/images/mod_spun-out.989be71e.png';
	} else if (mod === 'TD') {
		URL = 'https://osu.ppy.sh/assets/images/mod_touchdevice.e5fa4271.png';
	} else if (mod === 'FI') {
		URL = 'https://osu.ppy.sh/assets/images/mod_fader@2x.03843f9a.png';
	} else if (mod === 'MI') {
		URL = 'https://osu.ppy.sh/assets/images/mod_mirror@2x.3f255fca.png';
	} else if (mod === '4K') {
		URL = 'https://osu.ppy.sh/assets/images/mod_4K.fb93bec4.png';
	} else if (mod === '5K') {
		URL = 'https://osu.ppy.sh/assets/images/mod_5K.c5928e1c.png';
	} else if (mod === '6K') {
		URL = 'https://osu.ppy.sh/assets/images/mod_6K.1050cc50.png';
	}else if (mod === '7K'){
		URL = 'https://osu.ppy.sh/assets/images/mod_7K.f8a7b7cc.png';
	}else if (mod === '8K'){
		URL = 'https://osu.ppy.sh/assets/images/mod_8K.13caafe8.png';
	}else if (mod === '9K'){
		URL = 'https://osu.ppy.sh/assets/images/mod_9K.ffde81fe.png';
	}

	return URL;
}

function getGameMode(beatmap) {
	let gameMode;
	if (beatmap.mode === 'Standard') {
		gameMode = 'osu';
	} else if (beatmap.mode === 'Taiko') {
		gameMode = 'taiko';
	} else if (beatmap.mode === 'Mania') {
		gameMode = 'mania';
	} else if (beatmap.mode === 'Catch the Beat') {
		gameMode = 'fruits';
	}
	return gameMode;
}

function getLinkModeName(ID) {
	let gameMode = 'osu';
	if (ID === 1) {
		gameMode = 'taiko';
	} else if (ID === 2) {
		gameMode = 'fruits';
	} else if (ID === 3) {
		gameMode = 'mania';
	}
	return gameMode;
}