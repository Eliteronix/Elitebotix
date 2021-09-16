const Discord = require('discord.js');
const Canvas = require('canvas');
const { getGameMode, getIDFromPotentialOsuLink, populateMsgFromInteraction, getOsuBeatmap } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-beatmap',
	aliases: ['osu-map', 'beatmap-info', 'o-bm'],
	description: 'Sends an info card about the specified beatmap',
	usage: '<id> [id] [id] ...',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.ATTACH_FILES,
	botPermissionsTranslated: 'Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Beatmaps are being processed');

			args = [];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}

		args.forEach(async (arg) => {
			const dbBeatmap = await getOsuBeatmap(getIDFromPotentialOsuLink(arg), 0);
			getBeatmap(msg, dbBeatmap);
		});
	},
};

async function getBeatmap(msg, beatmap) {
	let processingMessage = await msg.channel.send(`[${beatmap.beatmapId}] Processing...`);

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
	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-beatmap-${beatmap.beatmapId}.png`);

	//Send attachment
	await msg.channel.send({ content: `Website: <https://osu.ppy.sh/b/${beatmap.beatmapId}>\nosu! direct: <osu://b/${beatmap.beatmapId}>`, files: [attachment] });
	processingMessage.delete();
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

	const output = [canvas, ctx, beatmap];
	return output;
}

function drawStats(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	const totalLengthSeconds = (beatmap.totalLength % 60) + '';
	const totalLengthMinutes = (beatmap.totalLength - beatmap.totalLength % 60) / 60;
	const totalLength = totalLengthMinutes + ':' + totalLengthSeconds.padStart(2, '0');
	const drainLengthSeconds = (beatmap.drainLength % 60) + '';
	const drainLengthMinutes = (beatmap.drainLength - beatmap.drainLength % 60) / 60;
	const drainLength = drainLengthMinutes + ':' + drainLengthSeconds.padStart(2, '0');

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
	ctx.fillText('Difficulty Rating', canvas.width / 1000 * 330, canvas.height / 500 * 250);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${Math.round(beatmap.starRating * 100) / 100} ★`, canvas.width / 1000 * 330, canvas.height / 500 * 280);

	let beatmapMapper = beatmap.mapper;
	const maxSizeMapper = parseInt(canvas.width / 1000 * 12);
	if (beatmapMapper.length > maxSizeMapper) {
		beatmapMapper = beatmapMapper.substring(0, maxSizeMapper - 3) + '...';
	}

	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Mapper', canvas.width / 1000 * 330, canvas.height / 500 * 330);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(beatmapMapper, canvas.width / 1000 * 330, canvas.height / 500 * 360);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('User Rating', canvas.width / 1000 * 330, canvas.height / 500 * 420);
	ctx.font = 'bold 20px comfortaa, sans-serif';
	ctx.fillText(userRatingDisplay, canvas.width / 1000 * 330, canvas.height / 500 * 440);

	//Second column
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Circle Size', canvas.width / 1000 * 580, canvas.height / 500 * 170);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`CS ${beatmap.circleSize}`, canvas.width / 1000 * 580, canvas.height / 500 * 200);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Approach Rate', canvas.width / 1000 * 580, canvas.height / 500 * 250);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`AR ${beatmap.approachRate}`, canvas.width / 1000 * 580, canvas.height / 500 * 280);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Overall Difficulty', canvas.width / 1000 * 580, canvas.height / 500 * 330);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`OD ${beatmap.overallDifficulty}`, canvas.width / 1000 * 580, canvas.height / 500 * 360);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('HP Drain', canvas.width / 1000 * 580, canvas.height / 500 * 410);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`HP ${beatmap.hpDrain}`, canvas.width / 1000 * 580, canvas.height / 500 * 440);

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
	ctx.fillText('Beats per Minute', canvas.width / 1000 * 750, canvas.height / 500 * 250);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${beatmap.bpm} BPM`, canvas.width / 1000 * 750, canvas.height / 500 * 280);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Length', canvas.width / 1000 * 750, canvas.height / 500 * 330);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${totalLength} Total`, canvas.width / 1000 * 750, canvas.height / 500 * 360);
	ctx.font = 'bold 15px comfortaa, sans-serif';
	ctx.fillText('Length (Drain)', canvas.width / 1000 * 750, canvas.height / 500 * 410);
	ctx.font = 'bold 30px comfortaa, sans-serif';
	ctx.fillText(`${drainLength} Drain`, canvas.width / 1000 * 750, canvas.height / 500 * 440);

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