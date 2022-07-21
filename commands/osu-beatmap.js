const Discord = require('discord.js');
const Canvas = require('canvas');
const { getGameMode, getIDFromPotentialOsuLink, populateMsgFromInteraction, getOsuBeatmap, getModBits, getMods, getModImage, checkModsCompatibility, getOsuPP, logDatabaseQueries, getScoreModpool, humanReadable } = require('../utils');
const { Permissions } = require('discord.js');
const { DBOsuMultiScores } = require('../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-beatmap',
	aliases: ['osu-map', 'beatmap-info', 'o-bm'],
	description: 'Sends an info card about the specified beatmap',
	usage: '<id> [id] [id] ...',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		let tournament = false;
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.commandName === 'osu-beatmap') {
				await interaction.reply('Beatmaps are being processed');
			}

			args = [];

			if (interaction.commandName !== 'osu-beatmap') {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'modpool') {
						args.push(`--${interaction.options._hoistedOptions[i].value}`);
					} else if (interaction.options._hoistedOptions[i].name === 'id') {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			} else {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'mods') {
						args.push(`--${interaction.options._hoistedOptions[i].value.toUpperCase()}`);
					} else if (interaction.options._hoistedOptions[i].name === 'tourney') {
						if (interaction.options._hoistedOptions[i].value) {
							tournament = true;
						}
					} else {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}

		}

		let mods = 0;

		for (let i = 0; i < args.length; i++) {
			if (args[i].startsWith('--NM') || args[i].startsWith('--NF') || args[i].startsWith('--HT') || args[i].startsWith('--EZ')
				|| args[i].startsWith('--HR') || args[i].startsWith('--HD') || args[i].startsWith('--SD') || args[i].startsWith('--DT')
				|| args[i].startsWith('--NC') || args[i].startsWith('--FL') || args[i].startsWith('--SO') || args[i].startsWith('--PF')
				|| args[i].startsWith('--K4') || args[i].startsWith('--K5') || args[i].startsWith('--K6') || args[i].startsWith('--K7')
				|| args[i].startsWith('--K8') || args[i].startsWith('--FI') || args[i].startsWith('--RD') || args[i].startsWith('--K9')
				|| args[i].startsWith('--KC') || args[i].startsWith('--K1') || args[i].startsWith('--K2') || args[i].startsWith('--K3')
				|| args[i].startsWith('--MR')) {
				mods = args[i].substring(2);
				args.splice(i, 1);
				i--;
			} else if (args[i].startsWith('--FM')) {
				args.splice(i, 1);
				i--;
			}
		}


		let modBits = getModBits(mods);

		args.forEach(async (arg) => {
			let modCompatibility = await checkModsCompatibility(modBits, getIDFromPotentialOsuLink(arg));
			if (!modCompatibility) {
				modBits = 0;
			}
			const dbBeatmap = await getOsuBeatmap({ beatmapId: getIDFromPotentialOsuLink(arg), modBits: modBits });
			if (dbBeatmap) {
				getBeatmap(msg, interaction, dbBeatmap, tournament);
			} else {
				if (msg.id) {
					await msg.reply({ content: `Could not find beatmap \`${arg.replace(/`/g, '')}\`.` });
				} else {
					await interaction.followUp({ content: `Could not find beatmap \`${arg.replace(/`/g, '')}\`.` });
				}
			}
		});
	},
};

async function getBeatmap(msg, interaction, beatmap, tournament) {
	let processingMessage = null;

	if (!interaction) {
		processingMessage = await msg.channel.send(`[${beatmap.beatmapId}] Processing...`);
	}

	const canvasWidth = 1000;
	const canvasHeight = 500;

	Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

	//Create Canvas
	const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

	//Get context and load the image
	const ctx = canvas.getContext('2d');
	const background = await Canvas.loadImage('./other/osu-background.png');
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

	let elements = [canvas, ctx, beatmap];

	elements = await drawTitle(elements);

	elements = await drawMode(elements);

	elements = await drawStats(elements);

	elements = await drawFooter(elements);

	await drawBackground(elements);

	//Create as an attachment
	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-beatmap-${beatmap.beatmapId}-${beatmap.mods}.png`);

	if (!interaction) {
		processingMessage.delete();
	}

	logDatabaseQueries(4, 'commands/osu-beatmap.js DBOsuMultiScores');
	const mapScores = await DBOsuMultiScores.findAll({
		where: {
			beatmapId: beatmap.beatmapId,
			tourneyMatch: true,
			matchName: {
				[Op.notLike]: 'MOTD:%',
			},
			[Op.or]: [
				{ warmup: false },
				{ warmup: null }
			],
		}
	});

	//Bubblesort mapScores by matchId property descending
	mapScores.sort((a, b) => {
		if (parseInt(a.matchId) > parseInt(b.matchId)) {
			return -1;
		}
		if (parseInt(a.matchId) < parseInt(b.matchId)) {
			return 1;
		}
		return 0;
	});

	let tournaments = [];
	let matches = [];

	for (let i = 0; i < mapScores.length; i++) {
		let acronym = mapScores[i].matchName.replace(/:.+/gm, '').replace(/`/g, '');

		if (tournaments.indexOf(acronym) === -1) {
			tournaments.push(acronym);
		}

		let modPool = getScoreModpool(mapScores[i]);

		let date = mapScores[i].matchStartDate;
		let dateReadable = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}`;

		matches.push(`${dateReadable}: ${modPool} - ${humanReadable(mapScores[i].score)} - ${mapScores[i].matchName}`);
	}

	let tournamentOccurences = `The map was played ${mapScores.length} times with any mods in these tournaments (new -> old):\n\`${tournaments.join('`, `')}\``;

	if (tournaments.length === 0) {
		tournamentOccurences = 'The map was never played in any tournaments.';
	}

	let files = [attachment];

	if (tournament) {
		// eslint-disable-next-line no-undef
		matches = new Discord.MessageAttachment(Buffer.from(matches.join('\n'), 'utf-8'), `tourney-scores-${beatmap.beatmapId}.txt`);
		files.push(matches);
	}

	//Send attachment
	if (interaction && interaction.commandName !== 'osu-beatmap') {
		return interaction.followUp({ content: `Website: <https://osu.ppy.sh/b/${beatmap.beatmapId}>\nosu! direct: <osu://b/${beatmap.beatmapId}>\n${tournamentOccurences}`, files: files, ephemeral: true });
	} else {
		const sentMessage = await msg.channel.send({ content: `Website: <https://osu.ppy.sh/b/${beatmap.beatmapId}>\nosu! direct: <osu://b/${beatmap.beatmapId}>\n${tournamentOccurences}`, files: files });
		if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
			sentMessage.react('<:COMPARE:827974793365159997>');
		}
		sentMessage.react('<:HD:918922015182827531>');
		sentMessage.react('<:HR:918938816377671740>');
		sentMessage.react('<:DT:918920670023397396>');
		if (beatmap.mode === 'Standard') {
			sentMessage.react('<:HDHR:918935327215861760>');
			sentMessage.react('<:HDDT:918935350125142036>');
		}
		if (beatmap.mode === 'Mania') {
			sentMessage.react('<:FI:918922047994880010>');
		}
		sentMessage.react('<:EZ:918920760586805259>');
		sentMessage.react('<:HT:918921193426411544>');
		sentMessage.react('<:FL:918920836755382343>');

		return;
	}
}

async function drawTitle(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	let beatmapTitle = `${beatmap.title}`;
	const maxSizeTitle = parseInt(canvas.width / 1000 * 40);
	if (beatmapTitle.length > maxSizeTitle) {
		beatmapTitle = beatmapTitle.substring(0, maxSizeTitle - 3) + '...';
	}

	let beatmapArtist = `by ${beatmap.artist}`;
	const maxSizeArtist = parseInt(canvas.width / 1000 * 40);
	if (beatmapArtist.length > maxSizeArtist) {
		beatmapArtist = beatmapArtist.substring(0, maxSizeArtist - 3) + '...';
	}

	let beatmapDifficulty = `[${beatmap.difficulty}]`;
	const maxSizeDifficulty = parseInt(canvas.width / 1000 * 40);
	if (beatmapDifficulty.length > maxSizeDifficulty) {
		beatmapDifficulty = beatmapDifficulty.substring(0, maxSizeDifficulty - 3) + '...';
	}

	// Write the title of the map
	ctx.font = 'bold 25px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(beatmapTitle, canvas.width / 3 * 2, canvas.height / 100 * 7);
	ctx.fillText(beatmapArtist, canvas.width / 3 * 2, canvas.height / 50 * 7);
	ctx.fillText(beatmapDifficulty, canvas.width / 3 * 2, canvas.height / 100 * 21);

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawMode(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	const gameMode = getGameMode(beatmap);
	const modePic = await Canvas.loadImage(`./other/mode-${gameMode}.png`);
	ctx.drawImage(modePic, (canvas.height / 3 - canvas.height / 3 / 4 * 3) / 2, canvas.height / 3 * 2 + (canvas.height / 3 - canvas.height / 3 / 4 * 3) / 4, canvas.height / 3 / 4 * 3, canvas.height / 3 / 4 * 3);

	let mods = getMods(beatmap.mods);

	if (!mods[0]) {
		mods = ['NM'];
	}

	for (let i = 0; i < mods.length; i++) {
		mods[i] = getModImage(mods[i]);
		const modImage = await Canvas.loadImage(mods[i]);
		ctx.drawImage(modImage, 150, 385 + i * 40 - ((mods.length - 1) * 40) / 2, 45, 32);
	}

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawStats(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	const totalLengthSeconds = (beatmap.totalLength % 60) + '';
	const totalLengthMinutes = (beatmap.totalLength - beatmap.totalLength % 60) / 60;
	const totalLength = totalLengthMinutes + ':' + Math.round(totalLengthSeconds).toString().padStart(2, '0');
	const drainLengthSeconds = (beatmap.drainLength % 60) + '';
	const drainLengthMinutes = (beatmap.drainLength - beatmap.drainLength % 60) / 60;
	const drainLength = drainLengthMinutes + ':' + Math.round(drainLengthSeconds).toString().padStart(2, '0');

	//Round user rating and display as 10 stars
	const userRating = Math.round(beatmap.userRating);
	let userRatingDisplay;
	for (let i = 0; i < 10; i++) {
		if (i < userRating) {
			if (userRatingDisplay) {
				userRatingDisplay = userRatingDisplay + '★';
			} else {
				userRatingDisplay = '★';
			}
		} else {
			if (userRatingDisplay) {
				userRatingDisplay = userRatingDisplay + '☆';
			} else {
				userRatingDisplay = '☆';
			}
		}
	}

	// Write the stats of the map
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	//First column
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Ranked Status', canvas.width / 1000 * 330, canvas.height / 500 * 170);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(beatmap.approvalStatus, canvas.width / 1000 * 330, canvas.height / 500 * 200);

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Difficulty Rating', canvas.width / 1000 * 330, canvas.height / 500 * 230);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(beatmap.starRating * 100) / 100} ★`, canvas.width / 1000 * 330, canvas.height / 500 * 260);

	let beatmapMapper = beatmap.mapper;
	const maxSizeMapper = parseInt(canvas.width / 1000 * 12);
	if (beatmapMapper.length > maxSizeMapper) {
		beatmapMapper = beatmapMapper.substring(0, maxSizeMapper - 3) + '...';
	}

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Mapper', canvas.width / 1000 * 330, canvas.height / 500 * 290);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(beatmapMapper, canvas.width / 1000 * 330, canvas.height / 500 * 320);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('User Rating', canvas.width / 1000 * 330, canvas.height / 500 * 350);
	ctx.font = 'bold 20px comfortaa, sans-serif';
	ctx.fillText(userRatingDisplay, canvas.width / 1000 * 330, canvas.height / 500 * 375);

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('95% Accuracy', canvas.width / 1000 * 330, canvas.height / 500 * 410);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(await getOsuPP(beatmap.beatmapId, beatmap.mods, 95.00, 0, beatmap.maxCombo))} pp`, canvas.width / 1000 * 330, canvas.height / 500 * 440);

	//Second column
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Circle Size', canvas.width / 1000 * 580, canvas.height / 500 * 170);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`CS ${beatmap.circleSize}`, canvas.width / 1000 * 580, canvas.height / 500 * 200);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Approach Rate', canvas.width / 1000 * 580, canvas.height / 500 * 230);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`AR ${beatmap.approachRate}`, canvas.width / 1000 * 580, canvas.height / 500 * 260);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Overall Difficulty', canvas.width / 1000 * 580, canvas.height / 500 * 290);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`OD ${beatmap.overallDifficulty}`, canvas.width / 1000 * 580, canvas.height / 500 * 320);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('HP Drain', canvas.width / 1000 * 580, canvas.height / 500 * 350);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`HP ${beatmap.hpDrain}`, canvas.width / 1000 * 580, canvas.height / 500 * 380);

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('99% Accuracy', canvas.width / 1000 * 580, canvas.height / 500 * 410);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(await getOsuPP(beatmap.beatmapId, beatmap.mods, 99.00, 0, beatmap.maxCombo))} pp`, canvas.width / 1000 * 580, canvas.height / 500 * 440);

	//Third column
	if (beatmap.mode === 'Mania') {
		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillText('# of objects', canvas.width / 1000 * 750, canvas.height / 500 * 170);
		ctx.font = 'bold 30px comfortaa, sans-serif';
		ctx.fillText(`${parseInt(beatmap.circles) + parseInt(beatmap.sliders) + parseInt(beatmap.spinners)}`, canvas.width / 1000 * 750, canvas.height / 500 * 200);
	} else {
		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillText('Maximum Combo', canvas.width / 1000 * 750, canvas.height / 500 * 170);
		ctx.font = 'bold 30px comfortaa, sans-serif';
		ctx.fillText(`${beatmap.maxCombo}x`, canvas.width / 1000 * 750, canvas.height / 500 * 200);
	}
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Beats per Minute', canvas.width / 1000 * 750, canvas.height / 500 * 230);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(beatmap.bpm * 100) / 100} BPM`, canvas.width / 1000 * 750, canvas.height / 500 * 260);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Length', canvas.width / 1000 * 750, canvas.height / 500 * 290);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${totalLength} Total`, canvas.width / 1000 * 750, canvas.height / 500 * 320);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Length (Drain)', canvas.width / 1000 * 750, canvas.height / 500 * 350);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${drainLength} Drain`, canvas.width / 1000 * 750, canvas.height / 500 * 380);

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('100% Accuracy', canvas.width / 1000 * 750, canvas.height / 500 * 410);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(await getOsuPP(beatmap.beatmapId, beatmap.mods, 100.00, 0, beatmap.maxCombo))} pp`, canvas.width / 1000 * 750, canvas.height / 500 * 440);

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';

	ctx.textAlign = 'left';
	ctx.fillText(`ID: ${beatmap.beatmapId}`, canvas.width / 140, canvas.height - canvas.height / 70);

	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawBackground(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	//Get a circle in the middle for inserting the map background
	ctx.beginPath();
	ctx.arc(0, 0, canvas.height / 3 * 2, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	//Draw a shape onto the main canvas in the top left
	try {
		const background = await Canvas.loadImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapsetId}/covers/cover.jpg`);
		ctx.drawImage(background, background.width / 2 - background.height / 2, 0, background.height, background.height, 0, 0, canvas.height / 3 * 2, canvas.height / 3 * 2);
	} catch (error) {
		const background = await Canvas.loadImage('https://osu.ppy.sh/assets/images/default-bg.7594e945.png');
		ctx.drawImage(background, background.width / 2 - background.height / 2, 0, background.height, background.height, 0, 0, canvas.height / 3 * 2, canvas.height / 3 * 2);
	}
	const output = [canvas, ctx, beatmap];
	return output;
}