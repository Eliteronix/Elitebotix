const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const getGuildPrefix = require('../getGuildPrefix');

module.exports = {
	name: 'osu-top',
	aliases: ['osu-plays', 'osu-topplays'],
	description: 'Sends an info card about the topplays of the specified player',
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
		const guildPrefix = getGuildPrefix(msg);
		if (!args[0]) {
			//Get profile by author if no argument
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id }
			});

			if (discordUser && discordUser.osuUserId) {
				getTopPlays(msg, discordUser.osuUserId);
			} else {
				const userDisplayName = msg.guild.member(msg.author).displayName;
				getTopPlays(msg, userDisplayName);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@!') && args[i].endsWith('>')) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@!', '').replace('>', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getTopPlays(msg, discordUser.osuUserId);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
						getTopPlays(msg, args[i]);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@!')) && !(args[0].endsWith('>'))) {
						const discordUser = await DBDiscordUsers.findOne({
							where: { userId: msg.author.id }
						});
						if (!(discordUser) || discordUser && !(discordUser.osuUserId)) {
							getTopPlays(msg, args[i], true);
						} else {
							getTopPlays(msg, args[i]);
						}
					} else {
						getTopPlays(msg, args[i]);
					}
				}
			}
		}
	}
};

async function getTopPlays(msg, username, noLinkedAccount) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	osuApi
		.getUser({ u: username })
		.then(async user => {
			// get discordUser from db to update pp and rank
			DBDiscordUsers.findOne({
				where: { osuUserId: user.id }
			})
				.then(discordUser => {
					if (discordUser && discordUser.osuUserId) {
						discordUser.osuName = user.name;
						discordUser.osuPP = user.pp.raw;
						discordUser.osuRank = user.pp.rank;
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

			let elements = [canvas, ctx, user];

			elements = await drawTitle(elements);

			elements = await drawTopPlays(elements, osuApi);

			await drawFooter(elements);

			//Create as an attachment
			const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-top-${user.id}.png`);

			//Define prefix command
			let guildPrefix = await getGuildPrefix(msg);

			//Send attachment
			if (noLinkedAccount) {
				await msg.channel.send(`${user.name}: <https://osu.ppy.sh/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>\nUse \`${guildPrefix}osu-recent ${user.name.replace(' ','_')}\` for recent plays and \`${guildPrefix}osu-profile ${user.name.replace(' ','_')}\` for a profile card\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(' ','_')}\` if the specified account is yours.`, attachment);
			} else {
				await msg.channel.send(`${user.name}: <https://osu.ppy.sh/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>\nUse \`${guildPrefix}osu-recent ${user.name.replace(' ','_')}\` for recent plays and \`${guildPrefix}osu-profile ${user.name.replace(' ','_')}\` for a profile card.`, attachment);
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
}

async function drawTitle(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let title = `✰ ${user.name}'s top plays ✰`;
	if (user.name.endsWith('s') || user.name.endsWith('x')) {
		title = `✰ ${user.name}' top plays ✰`;
	}

	roundedRect(ctx, canvas.width / 2 - title.length * 8.5, canvas.height / 50, title.length * 17, canvas.height / 12, 5, '28', '28', '28', 0.75);

	// Write the title of the player
	ctx.font = '30px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(title, canvas.width / 2, canvas.height / 12);

	const output = [canvas, ctx, user];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = '12px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

	const output = [canvas, ctx, user];
	return output;
}

async function drawTopPlays(input, osuApi) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const scores = await osuApi.getUserBest({ u: user.name });

	for (let i = 0; i < scores.length && i < 10; i++) {
		roundedRect(ctx, canvas.width / 70, canvas.height / 8 + (canvas.height / 12) * i, canvas.width - canvas.width / 35, canvas.height / 13, canvas.height / 70, '70', '57', '63', 0.75);

		const rankImage = await Canvas.loadImage(getRankImage(scores[i].rank));
		ctx.drawImage(rankImage, canvas.width / 35, canvas.height / 8 + (canvas.height / 12) * i + canvas.height / 13 / 2 - canvas.height / 31.25 / 2, canvas.width / 31.25, canvas.height / 31.25);

		ctx.font = 'bold 18px sans-serif';
		ctx.fillStyle = '#FF66AB';
		ctx.textAlign = 'right';
		ctx.fillText(humanReadable(Math.floor(scores[i].pp).toString()) + 'pp', (canvas.width / 35) * 34, canvas.height / 8 + (canvas.height / 12) * i + canvas.height / 13 / 2 + canvas.height / 70);

		const beatmap = await osuApi.getBeatmaps({ b: scores[i].beatmapId });
		let beatmapTitle = `${beatmap[0].title} by ${beatmap[0].artist}`;
		const maxSize = canvas.width / 250 * 19;
		if (beatmapTitle.length > maxSize) {
			beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
		}

		ctx.font = 'bold 15px sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'left';
		ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, canvas.height / 8 + (canvas.height / 12) * i + canvas.height / 12 / 2);

		ctx.font = 'bold 10px sans-serif';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'left';
		ctx.fillText(beatmap[0].version, (canvas.width / 35) * 3, canvas.height / 8 + (canvas.height / 12) * i + canvas.height / 12 / 2 + canvas.height / 35);

		const accuracy = (scores[i].counts[300] * 100 + scores[i].counts[100] * 33.33 + scores[i].counts[50] * 16.67) / (parseInt(scores[i].counts[300]) + parseInt(scores[i].counts[100]) + parseInt(scores[i].counts[50]) + parseInt(scores[i].counts.miss));

		const combo = `(${scores[i].maxCombo}/${beatmap[0].maxCombo})`;

		ctx.font = 'bold 10px sans-serif';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'right';
		ctx.fillText(combo, (canvas.width / 28) * 23.4, canvas.height / 8 + (canvas.height / 12) * i + canvas.height / 12 / 2 + canvas.height / 35);
		ctx.fillText(Math.round(accuracy * 100) / 100 + '%', (canvas.width / 28) * 24.75, canvas.height / 8 + (canvas.height / 12) * i + canvas.height / 12 / 2 + canvas.height / 35);

		const mods = getMods(scores[i].raw_mods);
		for (let j = 0; j < mods.length; j++) {
			const modImage = await Canvas.loadImage(getModImage(mods[mods.length - j - 1]));
			ctx.drawImage(modImage, (canvas.width / 28) * 24.75 - (canvas.width / 1000 * 23) * (j + 1), canvas.height / 8 + (canvas.height / 12) * i + (canvas.height / 12) / 5, canvas.width / 1000 * 23, canvas.height / 125 * 4);
		}
	}

	const output = [canvas, ctx, user];
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
