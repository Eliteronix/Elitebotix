const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');

module.exports = {
	name: 'osu-profile',
	aliases: ['osu-player', 'osu-user', 'o-u', 'o-p'],
	description: 'Sends an info card about the specified player',
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
				getProfile(msg, discordUser.osuUserId);
			} else {
				const userDisplayName = msg.guild.member(msg.author).displayName;
				getProfile(msg, userDisplayName);
			}
		} else {
			//Get profiles by arguments
			let i;
			for (i = 0; i < args.length; i++) {
				const userDisplayName = args[i];
				getProfile(msg, userDisplayName);
			}
		}
	},
};

async function getProfile(msg, username) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	osuApi.getUser({ u: username })
		.then(async (user) => {
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

			elements = await drawRank(elements);

			elements = await drawLevel(elements);

			elements = await drawRanks(elements);

			elements = await drawFooter(elements);

			await drawAvatar(elements);

			//Create as an attachment
			const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'osu-profile.png');

			//Send attachment
			await msg.channel.send(`<https://osu.ppy.sh/u/${user.id}>`, attachment);
			processingMessage.delete();
		})
		.catch(err => {
			if (err.message === 'Not found') {
				msg.channel.send(`Could not find user "${username}".`);
			}
			console.log(err);
		});
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

async function drawTitle(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let title = `${user.name}'s profile`;
	if (user.name.endsWith('s') || user.name.endsWith('x')) {
		title = `${user.name}' profile`;
	}

	// Write the title of the player
	ctx.font = '30px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(title, canvas.width / 2, 35);

	const output = [canvas, ctx, user];
	return output;
}

async function drawRank(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const globalRank = humanReadable(user.pp.rank);
	const countryRank = humanReadable(user.pp.countryRank);
	let pp = humanReadable(Math.floor(user.pp.raw).toString());

	// Write the title of the player
	ctx.font = '18px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(`🌎 Rank: ${globalRank} | ${user.country} Rank: ${countryRank}`, canvas.width / 2, 60);
	ctx.fillText(`PP: ${pp}`, canvas.width / 2, 83);

	const output = [canvas, ctx, user];
	return output;
}

async function drawLevel(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];
	// Write the text for the floored level of the player
	ctx.font = '40px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(Math.floor(user.level), canvas.width / 10, canvas.height / 2 + 15);

	//Add a faint circle around the level
	ctx.beginPath();
	ctx.arc(canvas.width / 10, canvas.height / 2, 50, 0, 2 * Math.PI);
	ctx.strokeStyle = '#373e40';
	ctx.lineWidth = 5;
	ctx.stroke();

	//calculate percentage of level completed
	const levelPercentage = (user.level % 1);

	//Add a stroke around the level by how much it is completed
	ctx.beginPath();
	ctx.arc(canvas.width / 10, canvas.height / 2, 50, Math.PI * -0.5, (Math.PI * 2) * levelPercentage + Math.PI * -0.5);
	ctx.strokeStyle = '#D1EDF2';
	ctx.lineWidth = 5;
	ctx.stroke();

	//floor scores
	let rankedScore = user.scores.ranked;
	if (rankedScore > 9999999999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000000000).toString()) + ' B';
	} else if (rankedScore > 9999999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000000).toString()) + ' M';
	} else if (rankedScore > 9999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000).toString()) + ' K';
	}

	let totalScore = user.scores.total;
	if (totalScore > 9999999999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000000000).toString()) + ' B';
	} else if (totalScore > 9999999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000000).toString()) + ' M';
	} else if (totalScore > 9999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000).toString()) + ' K';
	}

	const playHours = Math.floor(user.secondsPlayed/60/60);

	const ranksOffset = 30;

	//Score and Accuracy
	ctx.font = 'bold 15px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText('Ranked: ' + rankedScore, canvas.width / 2 - canvas.height / 4 + 8, canvas.height / 2 + ranksOffset * -2 + 6);
	ctx.fillText('Total: ' + totalScore, canvas.width / 2 - canvas.height / 4 - 5, canvas.height / 2 + ranksOffset * -1 + 6);
	ctx.fillText('Acc: ' + user.accuracyFormatted, canvas.width / 2 - canvas.height / 4 - 10, canvas.height / 2 + 6);
	ctx.fillText('Hours: ' + humanReadable(playHours.toString()), canvas.width / 2 - canvas.height / 4 - 5, canvas.height / 2 + ranksOffset * 1 + 6);
	ctx.fillText('Plays: ' + humanReadable(user.counts.plays), canvas.width / 2 - canvas.height / 4 + 8, canvas.height / 2 + ranksOffset * 2 + 6);

	const output = [canvas, ctx, user];
	return output;
}

async function drawRanks(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const ranksOffset = 30;

	ctx.font = 'bold 16px sans-serif';
	ctx.textAlign = 'left';
	//get SSH
	const SSH = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-SS-Silver.6681366c.svg');
	ctx.drawImage(SSH, canvas.width / 2 + canvas.height / 4 - 8, canvas.height / 2 - 8 + ranksOffset * -2, 32, 16);
	ctx.fillText(humanReadable(user.counts.SSH), canvas.width / 2 + canvas.height / 4 + 32, canvas.height / 2 + ranksOffset * -2 + 6);

	//get SS
	const SS = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-SS.a21de890.svg');
	ctx.drawImage(SS, canvas.width / 2 + canvas.height / 4 + 5, canvas.height / 2 - 8 + ranksOffset * -1, 32, 16);
	ctx.fillText(humanReadable(user.counts.SS), canvas.width / 2 + canvas.height / 4 + 45, canvas.height / 2 + ranksOffset * -1 + 6);

	//get SH
	const SH = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg');
	ctx.drawImage(SH, canvas.width / 2 + canvas.height / 4 + 10, canvas.height / 2 - 8, 32, 16);
	ctx.fillText(humanReadable(user.counts.SH), canvas.width / 2 + canvas.height / 4 + 50, canvas.height / 2 + 6);

	//get S
	const S = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg');
	ctx.drawImage(S, canvas.width / 2 + canvas.height / 4 + 5, canvas.height / 2 - 8 + ranksOffset * 1, 32, 16);
	ctx.fillText(humanReadable(user.counts.S), canvas.width / 2 + canvas.height / 4 + 45, canvas.height / 2 + ranksOffset * 1 + 6);

	//get A
	const A = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-A.d785e824.svg');
	ctx.drawImage(A, canvas.width / 2 + canvas.height / 4 - 8, canvas.height / 2 - 8 + ranksOffset * 2, 32, 16);
	ctx.fillText(humanReadable(user.counts.A), canvas.width / 2 + canvas.height / 4 + 32, canvas.height / 2 + ranksOffset * 2 + 6);
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

	//Set join time
	const month = new Array();
	month[0] = 'January';
	month[1] = 'February';
	month[2] = 'March';
	month[3] = 'April';
	month[4] = 'May';
	month[5] = 'June';
	month[6] = 'July';
	month[7] = 'August';
	month[8] = 'September';
	month[9] = 'October';
	month[10] = 'November';
	month[11] = 'December';
	const joinDay = user.raw_joinDate.substring(8, 10);
	var joinDayEnding = 'th';
	if (joinDay % 10 === 1) {
		joinDayEnding = 'st';
	} else if (joinDay % 10 === 2) {
		joinDayEnding = 'nd';
	}
	const joinMonth = month[user.raw_joinDate.substring(5, 7) - 1];
	const joinYear = user.raw_joinDate.substring(0, 4);
	const joinDate = joinDay + joinDayEnding + ' ' + joinMonth + ' ' + joinYear;

	ctx.textAlign = 'left';
	ctx.fillText(`Joined on ${joinDate}`, 1, canvas.height - 1);

	ctx.textAlign = 'right';
	ctx.fillText(`By Elitebotix on ${today}`, canvas.width - 1, canvas.height - 1);

	const output = [canvas, ctx, user];
	return output;
}

async function drawAvatar(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];
	//Get a circle in the middle for inserting the player avatar
	ctx.beginPath();
	ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 4, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	//Draw a shape onto the main canvas in the middle 
	try {
		const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${user.id}`);
		ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 4, canvas.height / 4, canvas.height / 2, canvas.height / 2);
	} catch (error) {
		const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
		ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 4, canvas.height / 4, canvas.height / 2, canvas.height / 2);
	}
	const output = [canvas, ctx, user];
	return output;
}