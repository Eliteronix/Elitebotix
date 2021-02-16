const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');

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
		if (!args[0]) {//Get profile by author if no argument
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuUserId) {
				getTopPlays(msg, discordUser.osuUserId);
			} else {
				const userDisplayName = msg.guild.member(msg.author).displayName;
				getTopPlays(msg, userDisplayName);
			}
		} else {
			//Get profiles by arguments
			let i;
			for (i = 0; i < args.length; i++) {
				const userDisplayName = args[i];
				getTopPlays(msg, userDisplayName);
			}
		}
	},
};

async function getTopPlays(msg, username) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	osuApi.getUser({ u: username })
		.then(async (user) => {
			// get discordUser from db to update pp and rank
			DBDiscordUsers.findOne({
				where: { osuUserId: user.id },
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

			const canvasWidth = 700;
			const canvasHeight = 350;

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
			const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'osu-profile.png');

			//Send attachment
			await msg.channel.send(`${user.name}: <https://osu.ppy.sh/u/${user.id}>\nSpectate: <osu://spectate/${user.id}>`, attachment);
			processingMessage.delete();
		})
		.catch(err => {
			if (err.message === 'Not found') {
				msg.channel.send(`Could not find user "${username}".`);
			} else {
				console.log(err);
			}
		});
}

async function drawTitle(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let title = `${user.name}'s top plays`;
	if (user.name.endsWith('s') || user.name.endsWith('x')) {
		title = `${user.name}' top plays`;
	}

	// Write the title of the player
	ctx.font = '25px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(title, canvas.width / 2, 35);

	const output = [canvas, ctx, user];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let today = new Date().toLocaleDateString();

	// Write the title of the player
	ctx.font = '12px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

	const output = [canvas, ctx, user];
	return output;
}

async function drawTopPlays(input, osuApi) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const scores = await osuApi.getUserBest({ u: user.name });

	for (let i = 0; i < scores.length && i < 10; i++) {
		roundedRect(ctx, 10, canvas.height / 12 * 1.5 + canvas.height / 12 * i, canvas.width - 20, canvas.height / 13, 5);

		const rankImage = await Canvas.loadImage(getRankImage(scores[i].rank));
		ctx.drawImage(rankImage, 20, canvas.height / 12 * 1.5 + canvas.height / 12 * i + canvas.height / 12 / 2 - 8, 32, 16);

		ctx.font = 'bold 15px sans-serif';
		ctx.fillStyle = '#FF66AB';
		ctx.textAlign = 'right';
		ctx.fillText(Math.floor(scores[i].pp) + 'pp', 680,  canvas.height / 12 * 1.5 + canvas.height / 12 * i + canvas.height / 12 / 2 + 5);

		const beatmap = await osuApi.getBeatmaps({ b: scores[i].beatmapId });

		ctx.font = 'bold 12px sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'left';
		ctx.fillText(`${beatmap[0].title} by ${beatmap[0].artist}`, 60,  canvas.height / 12 * 1.5 + canvas.height / 12 * i + canvas.height / 12 / 2);

		ctx.font = 'bold 10px sans-serif';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'left';
		ctx.fillText(beatmap[0].version, 60,  canvas.height / 12 * 1.5 + canvas.height / 12 * i + canvas.height / 12 / 2 + 10);

		const accuracy = (scores[i].counts[300] * 100 + scores[i].counts[100] * 33.33 + scores[i].counts[50] * 16.67) / (parseInt(scores[i].counts[300]) + parseInt(scores[i].counts[100]) + parseInt(scores[i].counts[50]) + parseInt(scores[i].counts.miss));
		
		const combo = `(${scores[i].maxCombo}/${beatmap[0].maxCombo})`;

		ctx.font = 'bold 10px sans-serif';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'right';
		ctx.fillText(combo + ' ' + Math.round(accuracy*100)/100+'%', 600,  canvas.height / 12 * 1.5 + canvas.height / 12 * i + canvas.height / 12 / 2 + 5);
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

function roundedRect(ctx, x, y, width, height, radius) {
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
	ctx.fillStyle = 'rgba(70, 57, 63, 0.75)';
	ctx.fill();
}