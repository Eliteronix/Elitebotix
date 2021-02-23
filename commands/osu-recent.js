const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const getGuildPrefix = require('../getGuildPrefix');

module.exports = {
	name: 'osu-recent',
	aliases: ['ors', 'o-rs'],
	description: 'Sends an info card about the last score of the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		if (!args[0]) {//Get profile by author if no argument
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuUserId) {
				getScore(msg, discordUser.osuUserId);
			} else {
				const userDisplayName = msg.guild.member(msg.author).displayName;
				getScore(msg, userDisplayName);
			}
		} else {
			//Get profiles by arguments
			let i;
			for (i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@!') && args[i].endsWith('>')) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@!', '').replace('>', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getScore(msg, discordUser.osuUserId);
					} else {
						msg.channel.send(`${args[i]} doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`e!osu-link <username>\`.`);
						getScore(msg, args[i]);
					}
				} else {
					getScore(msg, args[i]);
				}
			}
		}
	},
};

async function getScore(msg, username) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});
	osuApi.getUserRecent({ u: username })
		.then(scores => {
			if (!(scores[0])) {
				return msg.channel.send(`Couldn't find any recent scores for ${username}`);
			}
			osuApi.getBeatmaps({ b: scores[0].beatmapId })
				.then(async (beatmaps) => {
					const user = await osuApi.getUser({ u: username });

					let mods = '';
					let modsBits = scores[0].raw_mods;
					let PFpossible = false;
					let hasNC = false;
					if (modsBits >= 16384) {
						PFpossible = true;
						modsBits = modsBits - 16384;
					}
					if (modsBits >= 8192) {
						mods = 'AP';
						modsBits = modsBits - 8192;
					}
					if (modsBits >= 4096) {
						mods = 'SO' + mods;
						modsBits = modsBits - 4096;
					}
					if (modsBits >= 2048) {
						modsBits = modsBits - 2048;
					}
					if (modsBits >= 1024) {
						mods = 'FL' + mods;
						modsBits = modsBits - 1024;
					}
					if (modsBits >= 512) {
						hasNC = true;
						mods = 'NC' + mods;
						modsBits = modsBits - 512;
					}
					if (modsBits >= 256) {
						mods = 'HT' + mods;
						modsBits = modsBits - 256;
					}
					if (modsBits >= 128) {
						mods = 'RX' + mods;
						modsBits = modsBits - 128;
					}
					if (modsBits >= 64) {
						if (!(hasNC)) {
							mods = 'DT' + mods;
						}
						modsBits = modsBits - 64;
					}
					if (modsBits >= 32) {
						if (PFpossible) {
							mods = 'PF' + mods;
						} else {
							mods = 'SD' + mods;
						}
						modsBits = modsBits - 32;
					}
					if (modsBits >= 16) {
						mods = 'HR' + mods;
						modsBits = modsBits - 16;
					}
					if (modsBits >= 8) {
						mods = 'HD' + mods;
						modsBits = modsBits - 8;
					}
					if (modsBits >= 4) {
						mods = 'TD' + mods;
						modsBits = modsBits - 4;
					}
					if (modsBits >= 2) {
						mods = 'EZ' + mods;
						modsBits = modsBits - 2;
					}
					if (modsBits >= 1) {
						mods = 'NF' + mods;
						modsBits = modsBits - 1;
					}

					let modsReadable = '';
					for (let i = 0; i < mods.length; i++) {
						if (i > 0 && (mods.length - i) % 2 === 0) {
							modsReadable = modsReadable + ',';
						}
						modsReadable = modsReadable + mods.charAt(i);
					}
					if (modsReadable === '') {
						modsReadable = 'NoMod';
					}

					//Rank
					let grade = scores[0].rank;
					if (grade === 'X') {
						grade = 'SS';
					} else if (grade === 'XH') {
						grade = 'Silver SS';
					} else if (grade === 'SH') {
						grade = 'Silver S';
					}

					//Make Score Human readable
					let score = '';
					for (let i = 0; i < scores[0].score.length; i++) {
						if (i > 0 && (scores[0].score.length - i) % 3 === 0) {
							score = score + '.';
						}
						score = score + scores[0].score.charAt(i);
					}

					//PP
					let pp = 'None';
					if (scores[0].pp) {
						pp = scores[0].pp;
					}

					//Calculate accuracy
					const accuracy = (scores[0].counts[300] * 100 + scores[0].counts[100] * 33.33 + scores[0].counts[50] * 16.67) / (parseInt(scores[0].counts[300]) + parseInt(scores[0].counts[100]) + parseInt(scores[0].counts[50]) + parseInt(scores[0].counts.miss));

					//Send embed
					const scoresInfoEmbed = new Discord.MessageEmbed()
						.addFields(
							{ name: 'Mode', value: `${beatmaps[0].mode}`, inline: true },
							{ name: 'Mods', value: `${modsReadable}`, inline: true },
							{ name: 'Player', value: `${user.name}`, inline: true },
							{ name: 'BPM', value: `${beatmaps[0].bpm}`, inline: true },
							{ name: 'Grade', value: `${grade}`, inline: true },
							{ name: 'Score', value: `${score}`, inline: true },
							{ name: 'PP', value: `${pp}`, inline: true },
							{ name: 'Accuracy', value: `${accuracy.toFixed(2)}%`, inline: true },
							{ name: 'Combo', value: `${scores[0].maxCombo}/${beatmaps[0].maxCombo}`, inline: true },
							{ name: '300', value: `${scores[0].counts[300]}`, inline: true },
							{ name: '100', value: `${scores[0].counts[100]}`, inline: true },
							{ name: '50', value: `${scores[0].counts[50]}`, inline: true },
							{ name: 'Miss', value: `${scores[0].counts.miss}`, inline: true },
						);

					msg.channel.send(scoresInfoEmbed);

					let processingMessage = await msg.channel.send(`[${user.name}] Processing...`);

					const canvasWidth = 1000;
					const canvasHeight = 500;

					//Create Canvas
					const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

					//Get context and load the image
					const ctx = canvas.getContext('2d');
					const background = await Canvas.loadImage('./other/osu-background.png');
					ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

					let elements = [canvas, ctx, scores[0], beatmaps[0]];

					elements = await drawTitle(elements);

					elements = await drawCover(elements);

					// elements = await drawLevel(elements);

					// elements = await drawRanks(elements);

					// elements = await drawPlays(elements);

					// elements = await drawFooter(elements);

					await drawFooter(elements);

					//Create as an attachment
					const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-recent-${user.id}-${beatmaps[0].id}.png`);

					let guildPrefix = await getGuildPrefix(msg);

					// //Send attachment
					// if (noLinkedAccount) {
					await msg.channel.send(`${user.name}: <https://osu.ppy.sh/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>\nWebsite: <https://osu.ppy.sh/b/${beatmaps[0].id}>\nosu! direct: <osu://dl/${beatmaps[0].beatmapSetId}>\nUse \`${guildPrefix}osu-top ${user.name.replace(' ', '_')}\` for top plays\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(' ', '_')}\` if the specified account is yours.`, attachment);
					// } else {
					// 	await msg.channel.send(`${user.name}: <https://osu.ppy.sh/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>\nUse \`e!osu-top ${user.name.replace(' ', '_')}\` for top plays`, attachment);
					// }
					processingMessage.delete();
				})
				.catch(err => {
					console.log(err);
				});
		})
		.catch(err => {
			if (err.message === 'Not found') {
				msg.channel.send(`Could not find user "${username}".`);
			} else {
				console.log(err);
			}
		});
}

function drawTitle(input){
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];

	// Write the title of the beatmap
	ctx.font = '30px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	ctx.fillText(`${beatmap.title} by ${beatmap.artist}`, canvas.width / 100, canvas.height / 500 * 35);
	ctx.fillText(`${beatmap.version} mapped by ${beatmap.creator}`, canvas.width / 100, canvas.height / 500 * 70);

	const output = [canvas, ctx, score, beatmap];
	return output;
}

async function drawCover(input) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];

	//Draw a shape onto the main canvas in the top left
	try {
		const background = await Canvas.loadImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapSetId}/covers/cover.jpg`);
		ctx.drawImage(background, 0, canvas.height/6.25, canvas.width, background.height/background.width*canvas.width);
		console.log(background);
	} catch (error) {
		const background = await Canvas.loadImage('https://osu.ppy.sh/assets/images/default-bg.7594e945.png');
		ctx.drawImage(background, 0, 0, canvas.width, background.height/background.width*canvas.width);
	}
	const output = [canvas, ctx, score, beatmap];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let score = input[2];
	let beatmap = input[3];

	let today = new Date().toLocaleDateString();

	ctx.font = '12px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

	const output = [canvas, ctx, score, beatmap];
	return output;
}

function humanReadable(input) {
	let output = '';
	for (let i = 0; i < input.length; i++) {
		if (i > 0 && (input.length - i) % 3 === 0) {
			output = output + '.';
		}
		output = output + input.charAt(i);
	}
	return output;
}

function getRankImage(rank) {
	let URL = 'https://osu.ppy.sh/assets/images/GradeSmall-D.6b170c4c.svg'; //D Rank

	if (rank === 'XH') {
		URL = 'https://osu.ppy.sh/assets/images/GradeSmall-SS-Silver.6681366c.svg';
	} else if (rank === 'X') {
		URL = 'https://osu.ppy.sh/assets/images/GradeSmall-SS.a21de890.svg';
	} else if (rank === 'SH') {
		URL = 'https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg';
	} else if (rank === 'S') {
		URL = 'https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg';
	} else if (rank === 'A') {
		URL = 'https://osu.ppy.sh/assets/images/GradeSmall-A.d785e824.svg';
	} else if (rank === 'B') {
		URL = 'https://osu.ppy.sh/assets/images/GradeSmall-B.e19fc91b.svg';
	} else if (rank === 'C') {
		URL = 'https://osu.ppy.sh/assets/images/GradeSmall-C.6bb75adc.svg';
	}
	return URL;
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

function getMods(input) {
	let mods = [];
	let modsBits = input;
	let PFpossible = false;
	let hasNC = false;
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
	}

	return URL;
}