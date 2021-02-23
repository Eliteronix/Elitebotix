const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');

module.exports = {
	name: 'ecw2021-check',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Sends an info card about the viability of the beatmap for the Elitiri Cup Winter 2021',
	usage: '<NM/HD/HR/DT/FM> <Top/Middle/Lower/Beginner> <id>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'debug', //'ecw2021'
	prefixCommand: true,
	async execute(msg, args) {
		if (args[0].toLowerCase() !== 'nm' && args[0].toLowerCase() !== 'hd' && args[0].toLowerCase() !== 'hr' && args[0].toLowerCase() !== 'dt' && args[0].toLowerCase() !== 'fm') {
			return msg.channel.send('Please specify in which pool the map is supposed to be. (NM, HD, HR, DT, FM)');
		}

		if (args[1].toLowerCase() !== 'top' && args[1].toLowerCase() !== 'middle' && args[1].toLowerCase() !== 'lower' && args[1].toLowerCase() !== 'beginner') {
			return msg.channel.send('Please specify in which bracket the map is supposed to be. (Top, Middle, Lower, Beginner)');
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		osuApi.getBeatmaps({ b: args[2] })
			.then(async (beatmaps) => {
				getBeatmap(msg, beatmaps[0]);

				const viabilityEmbed = new Discord.MessageEmbed()
					.setColor('#00FF00')
					.setTitle('The Beatmap is viable for the tournament')
					.setFooter(`ID: ${beatmaps[0].id}; Checked by ${msg.author.username}#${msg.author.discriminator}`);

				//The map has to have audio
				if (!(beatmaps[0].hasAudio)) {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map has no audio', 'The map has to have audio / can\'t be muted');
				}

				//Mode has to be standard osu!
				if (beatmaps[0].mode !== 'Standard') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is not in Standard mode', 'The map has to be in the osu!Standard Mode');
				}

				//Map status: Ranked/Approved -> Allowed (except Aspire maps)
				if (beatmaps[0].id === '1033882' || beatmaps[0].id === '529285') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is an Aspire Map', 'The map can\'t be an Aspire map');
				}

				//Map status: Ranked/Approved -> Allowed (except Aspire maps)
				if (beatmaps[0].approvalStatus !== 'Ranked' && beatmaps[0].approvalStatus !== 'Approved') {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is not Ranked', 'The map has to be Ranked');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 1:30-4:30
				if (args[0].toLowerCase() === 'nm' && beatmaps[0].length.drain < 90 || args[0].toLowerCase() === 'hd' && beatmaps[0].length.drain < 90 || args[0].toLowerCase() === 'hr' && beatmaps[0].length.drain < 90 || args[0].toLowerCase() === 'fm' && beatmaps[0].length.drain < 90) {
					viabilityEmbed
						.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too short', 'The Drain time should not be below 1:30');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 1:30-4:30
				if (args[0].toLowerCase() === 'nm' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'hd' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'hr' && beatmaps[0].length.drain > 270 || args[0].toLowerCase() === 'fm' && beatmaps[0].length.drain > 270) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too long', 'The Drain time should not be above 4:30');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 1:30-4:30
				if (args[0].toLowerCase() === 'dt' && beatmaps[0].length.drain < 135) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too short', 'The Drain time should not be below 1:30 (after DT)');
				}

				//Drain Time: NM,HD,HR,DT (after recalculations),FM: 1:30-4:30
				if (args[0].toLowerCase() === 'dt' && beatmaps[0].length.drain > 405) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is too long', 'The Drain time should not be above 4:30 (after DT)');
				}

				//Circle Size: FM maps may not exceed the circle size of 5 when played NoMod
				if (args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.size > 5) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('Map is has too small Circle Size', 'FreeMod maps may not exceed circle size 5 when played NoMod');
				}

				//Calculate all star ratings
				// const starRating = await calculateStarRating(beatmaps[0].id, [], true);
				//Top:
				const topLowerDiff = 5.61;
				const topUpperDiff = 7.04;
				//Middle:
				const middleLowerDiff = 5.09;
				const middleUpperDiff = 6.3;
				//Lower:
				const lowerLowerDiff = 4.55;
				const lowerUpperDiff = 5.74;
				//Middle:
				const beginnerLowerDiff = 4.06;
				const beginnerUpperDiff = 5.34;

				//Difficulty: Maps have to be between the specified diffculty
				if (args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating < topLowerDiff ||
					args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating < topLowerDiff ||
					args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating < topLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('The Star Rating is too low', `The Star Rating has to be between ${topLowerDiff} and ${topUpperDiff}`);
				} else if (args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating > topUpperDiff ||
					args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating > topUpperDiff ||
					args[1].toLowerCase() === 'top' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating > topUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('The Star Rating is too high', `The Star Rating has to be between ${topLowerDiff} and ${topUpperDiff}`);
				} else if (args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating < middleLowerDiff ||
					args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating < middleLowerDiff ||
					args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating < middleLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('The Star Rating is too low', `The Star Rating has to be between ${middleLowerDiff} and ${middleUpperDiff}`);
				} else if (args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating > middleUpperDiff ||
					args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating > middleUpperDiff ||
					args[1].toLowerCase() === 'middle' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating > middleUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('The Star Rating is too high', `The Star Rating has to be between ${middleLowerDiff} and ${middleUpperDiff}`);
				} else if (args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating < lowerLowerDiff ||
					args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating < lowerLowerDiff ||
					args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating < lowerLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('The Star Rating is too low', `The Star Rating has to be between ${lowerLowerDiff} and ${lowerUpperDiff}`);
				} else if (args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating > lowerUpperDiff ||
					args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating > lowerUpperDiff ||
					args[1].toLowerCase() === 'lower' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating > lowerUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('The Star Rating is too high', `The Star Rating has to be between ${lowerLowerDiff} and ${lowerUpperDiff}`);
				} else if (args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating < beginnerLowerDiff ||
					args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating < beginnerLowerDiff ||
					args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating < beginnerLowerDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('The Star Rating is too low', `The Star Rating has to be between ${beginnerLowerDiff} and ${beginnerUpperDiff}`);
				} else if (args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'nm' && beatmaps[0].difficulty.rating > beginnerUpperDiff ||
					args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'hd' && beatmaps[0].difficulty.rating > beginnerUpperDiff ||
					args[1].toLowerCase() === 'beginner' && args[0].toLowerCase() === 'fm' && beatmaps[0].difficulty.rating > beginnerUpperDiff) {
					viabilityEmbed.setColor('#FF0000')
						.setTitle('The Beatmap is NOT viable for the tournament')
						.setDescription('If you think the map is within the restrictions please contact Eliteronix#4208')
						.addField('The Star Rating is too high', `The Star Rating has to be between ${beginnerLowerDiff} and ${beginnerUpperDiff}`);
				} else if (args[0].toLowerCase() === 'hr' || args[0].toLowerCase() === 'dt') {
					viabilityEmbed
						.addField('Star Rating not checked', 'The Star Rating for HR and DT maps is not automatically being checked at the moment but they should be in the range of the bracket after recalculations');
				}

				msg.channel.send(viabilityEmbed);
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find beatmap "${args[2]}".`);
				} else {
					console.log(err);
				}
			}
			);
	}
};

async function getBeatmap(msg, beatmap) {
	let processingMessage = await msg.channel.send(`[${beatmap.id}] Processing...`);

	const canvasWidth = 1000;
	const canvasHeight = 500;

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
	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'osu-profile.png');

	//Send attachment
	await msg.channel.send(`Website: <https://osu.ppy.sh/b/${beatmap.id}>\nosu! direct: <osu://dl/${beatmap.beatmapSetId}>`, attachment);
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

	let beatmapDifficulty = `[${beatmap.version}]`;
	const maxSizeDifficulty = parseInt(canvas.width / 1000 * 40);
	if (beatmapDifficulty.length > maxSizeDifficulty) {
		beatmapDifficulty = beatmapDifficulty.substring(0, maxSizeDifficulty - 3) + '...';
	}

	// Write the title of the map
	ctx.font = 'bold 25px sans-serif';
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

	const totalLengthSeconds = (beatmap.length.total % 60) + '';
	const totalLengthMinutes = (beatmap.length.total - beatmap.length.total % 60) / 60;
	const totalLength = totalLengthMinutes + ':' + totalLengthSeconds.padStart(2, '0');
	const drainLengthSeconds = (beatmap.length.drain % 60) + '';
	const drainLengthMinutes = (beatmap.length.drain - beatmap.length.drain % 60) / 60;
	const drainLength = drainLengthMinutes + ':' + drainLengthSeconds.padStart(2, '0');

	//Round user rating and display as 10 stars
	const userRating = Math.round(beatmap.rating);
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
	ctx.font = 'bold 30px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'left';
	//First column
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Ranked Status', canvas.width / 1000 * 330, canvas.height / 500 * 170);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(beatmap.approvalStatus, canvas.width / 1000 * 330, canvas.height / 500 * 200);
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Difficulty Rating', canvas.width / 1000 * 330, canvas.height / 500 * 250);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(`${Math.round(beatmap.difficulty.rating * 100) / 100} ★`, canvas.width / 1000 * 330, canvas.height / 500 * 280);
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Mapper', canvas.width / 1000 * 330, canvas.height / 500 * 330);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(beatmap.creator, canvas.width / 1000 * 330, canvas.height / 500 * 360);
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('User Rating', canvas.width / 1000 * 330, canvas.height / 500 * 420);
	ctx.font = 'bold 20px sans-serif';
	ctx.fillText(userRatingDisplay, canvas.width / 1000 * 330, canvas.height / 500 * 440);

	//Second column
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Circle Size', canvas.width / 1000 * 580, canvas.height / 500 * 170);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(`CS ${beatmap.difficulty.size}`, canvas.width / 1000 * 580, canvas.height / 500 * 200);
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Approach Rate', canvas.width / 1000 * 580, canvas.height / 500 * 250);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(`AR ${beatmap.difficulty.approach}`, canvas.width / 1000 * 580, canvas.height / 500 * 280);
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Overall Difficulty', canvas.width / 1000 * 580, canvas.height / 500 * 330);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(`OD ${beatmap.difficulty.overall}`, canvas.width / 1000 * 580, canvas.height / 500 * 360);
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('HP Drain', canvas.width / 1000 * 580, canvas.height / 500 * 410);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(`HP ${beatmap.difficulty.drain}`, canvas.width / 1000 * 580, canvas.height / 500 * 440);

	//Third column
	if(beatmap.mode === 'Mania'){
		ctx.font = 'bold 15px sans-serif';
		ctx.fillText('# of objects', canvas.width / 1000 * 750, canvas.height / 500 * 170);
		ctx.font = 'bold 30px sans-serif';
		ctx.fillText(`${parseInt(beatmap.objects.normal)+parseInt(beatmap.objects.slider)+parseInt(beatmap.objects.spinner)}`, canvas.width / 1000 * 750, canvas.height / 500 * 200);
	} else {
		ctx.font = 'bold 15px sans-serif';
		ctx.fillText('Maximum Combo', canvas.width / 1000 * 750, canvas.height / 500 * 170);
		ctx.font = 'bold 30px sans-serif';
		ctx.fillText(`${beatmap.maxCombo}x`, canvas.width / 1000 * 750, canvas.height / 500 * 200);
	}
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Beats per Minute', canvas.width / 1000 * 750, canvas.height / 500 * 250);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(`${beatmap.bpm} BPM`, canvas.width / 1000 * 750, canvas.height / 500 * 280);
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Length', canvas.width / 1000 * 750, canvas.height / 500 * 330);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(`${totalLength} Total`, canvas.width / 1000 * 750, canvas.height / 500 * 360);
	ctx.font = 'bold 15px sans-serif';
	ctx.fillText('Length (Drain)', canvas.width / 1000 * 750, canvas.height / 500 * 410);
	ctx.font = 'bold 30px sans-serif';
	ctx.fillText(`${drainLength} Drain`, canvas.width / 1000 * 750, canvas.height / 500 * 440);

	const output = [canvas, ctx, beatmap];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let beatmap = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = 'bold 15px sans-serif';
	ctx.fillStyle = '#ffffff';

	ctx.textAlign = 'left';
	ctx.fillText(`ID: ${beatmap.id}`, canvas.width / 140, canvas.height - canvas.height / 70);

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
		const background = await Canvas.loadImage(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapSetId}/covers/cover.jpg`);
		ctx.drawImage(background, background.width / 2 - background.height / 2, 0, background.height, background.height, 0, 0, canvas.height / 3 * 2, canvas.height / 3 * 2);
	} catch (error) {
		const background = await Canvas.loadImage('https://osu.ppy.sh/assets/images/default-bg.7594e945.png');
		ctx.drawImage(background, background.width / 2 - background.height / 2, 0, background.height, background.height, 0, 0, canvas.height / 3 * 2, canvas.height / 3 * 2);
	}
	const output = [canvas, ctx, beatmap];
	return output;
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
