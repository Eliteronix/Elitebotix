const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { getGuildPrefix, humanReadable, getGameModeName, getLinkModeName, rippleToBanchoUser, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname, getIDFromPotentialOsuLink, populateMsgFromInteraction } = require('../utils');
const fetch = require('node-fetch');

module.exports = {
	name: 'osu-profile',
	aliases: ['osu-player', 'osu-user', 'o-u', 'o-p'],
	description: 'Sends an info card about the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces; Use --b for bancho / --r for ripple; Use --o/--t/--c/--m for modes)',
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
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Players are being processed');

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}
		}

		const guildPrefix = await getGuildPrefix(msg);

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		const server = commandConfig[1];
		const mode = commandConfig[2];

		if (!args[0]) {//Get profile by author if no argument

			if (commandUser && commandUser.osuUserId) {
				getProfile(msg, commandUser.osuUserId, server, mode);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getProfile(msg, userDisplayName, server, mode);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getProfile(msg, discordUser.osuUserId, server, mode);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
						getProfile(msg, args[i], server, mode);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getProfile(msg, getIDFromPotentialOsuLink(args[i]), server, mode, true);
						} else {
							getProfile(msg, getIDFromPotentialOsuLink(args[i]), server, mode);
						}
					} else {
						getProfile(msg, getIDFromPotentialOsuLink(args[i]), server, mode);
					}
				}
			}
		}
	},
};

async function getProfile(msg, username, server, mode, noLinkedAccount) {
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

				const canvasWidth = 700;
				const canvasHeight = 350;

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				let elements = [canvas, ctx, user];

				elements = await drawTitle(elements, server, mode);

				elements = await drawRank(elements);

				elements = await drawLevel(elements, server);

				elements = await drawRanks(elements);

				elements = await drawPlays(elements, server);

				elements = await drawFooter(elements, server);

				await drawAvatar(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-profile-${getGameModeName(mode)}-${user.id}.png`);

				let guildPrefix = await getGuildPrefix(msg);

				//declare hints array
				var hints = [`Try \`${guildPrefix}osu-recent ${user.name.replace(/ /g, '_')}\` for recent plays.`, `Try \`${guildPrefix}osu-top ${user.name.replace(/ /g, '_')}\` for top plays.`, `Try \`${guildPrefix}osu-score <beatmapID> ${user.name.replace(/ /g, '_')}\` for the best score on a map.`];

				//Send attachment
				if (noLinkedAccount) {
					await msg.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\n${hints[Math.floor(Math.random() * hints.length)]}\nFeel free to use \`${guildPrefix}osu-link ${user.name.replace(/ /g, '_')}\` if the specified account is yours.`, files: [attachment] });
				} else {
					await msg.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nSpectate: <osu://spectate/${user.id}>\n${hints[Math.floor(Math.random() * hints.length)]}`, files: [attachment] });
				}
				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --r for ripple; Use --o/--t/--c/--m for modes)`);
				} else {
					console.log(err);
				}
			});
	} else if (server === 'ripple') {
		fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --b for bancho; Use --o/--t/--c/--m for modes)`);
				}

				let user = rippleToBanchoUser(responseJson[0]);

				let processingMessage = await msg.channel.send(`[${user.name}] Processing...`);

				const canvasWidth = 700;
				const canvasHeight = 350;

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				let elements = [canvas, ctx, user];

				elements = await drawTitle(elements, server, mode);

				elements = await drawRank(elements);

				elements = await drawLevel(elements, server);

				elements = await drawPlays(elements, server);

				elements = await drawFooter(elements, server);

				await drawAvatar(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-profile-${getGameModeName(mode)}-${user.id}.png`);

				let guildPrefix = await getGuildPrefix(msg);

				//declare hints array
				var hints = [`Try \`${guildPrefix}osu-recent ${user.name.replace(/ /g, '_')}\` for recent plays.`, `Try \`${guildPrefix}osu-top ${user.name.replace(/ /g, '_')}\` for top plays.`, `Try \`${guildPrefix}osu-score <beatmapID> ${user.name.replace(/ /g, '_')}\` for the best score on a map.`];

				//Send attachment
				await msg.channel.send({ content: `\`${user.name}\`: <https://ripple.moe/u/${user.id}?mode=${mode}>\nSpectate: <osu://spectate/${user.id}>\n${hints[Math.floor(Math.random() * hints.length)]}`, files: [attachment] });
				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`. (Use "_" instead of spaces; Use --b for bancho; Use --o/--t/--c/--m for modes)`);
				} else {
					console.log(err);
				}
			});
	}
}

async function drawTitle(input, server, mode) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let gameMode = getGameModeName(mode);

	let title = `${user.name}'s ${gameMode} profile`;
	if (user.name.endsWith('s') || user.name.endsWith('x')) {
		title = `${user.name}' ${gameMode} profile`;
	}

	if (server !== 'bancho') {
		title = `[${server}] ${title}`;
	}

	// Write the title of the player
	ctx.font = '30px comfortaa, sans-serif';
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

	const yOffset = 5;

	const globalRank = humanReadable(user.pp.rank);
	const countryRank = humanReadable(user.pp.countryRank);
	let pp = humanReadable(Math.floor(user.pp.raw));

	// Write the title of the player
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(`Global Rank: #${globalRank} | ${user.country} Rank: #${countryRank}`, canvas.width / 2, 60 + yOffset);
	ctx.fillText(`PP: ${pp}`, canvas.width / 2, 83 + yOffset);

	const output = [canvas, ctx, user];
	return output;
}

async function drawLevel(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const yOffset = 25;

	// Write the text for the floored level of the player
	ctx.font = '40px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(Math.floor(user.level), canvas.width / 10, canvas.height / 2 + 15 + yOffset);

	//Add a faint circle around the level
	ctx.beginPath();
	ctx.arc(canvas.width / 10, canvas.height / 2 + yOffset, 50, 0, 2 * Math.PI);
	ctx.strokeStyle = '#373e40';
	ctx.lineWidth = 5;
	ctx.stroke();

	//calculate percentage of level completed
	const levelPercentage = (user.level % 1);

	//Add a stroke around the level by how much it is completed
	ctx.beginPath();
	ctx.arc(canvas.width / 10, canvas.height / 2 + yOffset, 50, Math.PI * -0.5, (Math.PI * 2) * levelPercentage + Math.PI * -0.5);
	ctx.strokeStyle = '#D1EDF2';
	ctx.lineWidth = 5;
	ctx.stroke();

	//floor scores
	let rankedScore = user.scores.ranked;
	if (rankedScore > 9999999999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000000000)) + 'B';
	} else if (rankedScore > 9999999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000000)) + 'M';
	} else if (rankedScore > 9999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000)) + 'K';
	}

	let totalScore = user.scores.total;
	if (totalScore > 9999999999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000000000)) + 'B';
	} else if (totalScore > 9999999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000000)) + 'M';
	} else if (totalScore > 9999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000)) + 'K';
	}

	const ranksOffset = 40;

	//Score and Accuracy
	ctx.font = 'bold 14px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('Ranked:', canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * -1 + 6 - 8 + yOffset);
	ctx.fillText(rankedScore, canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * -1 + 6 + 8 + yOffset);
	ctx.fillText('Total:', canvas.width / 4 + 15, canvas.height / 2 + 6 - 8 + yOffset);
	ctx.fillText(totalScore, canvas.width / 4 + 15, canvas.height / 2 + 6 + 8 + yOffset);
	ctx.fillText('Acc:', canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * 1 + 6 - 8 + yOffset);
	if (server !== 'ripple') {
		ctx.fillText(user.accuracyFormatted, canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * 1 + 6 + 8 + yOffset);
	} else {
		ctx.fillText(`${Math.round(user.accuracy * 100) / 100}%`, canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * 1 + 6 + 8 + yOffset);
	}

	const output = [canvas, ctx, user];
	return output;
}

async function drawRanks(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const yOffset = 25;

	const ranksOffset = 30;

	ctx.font = 'bold 16px comfortaa, sans-serif';
	ctx.textAlign = 'left';
	//get SSH
	const SSH = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-SS-Silver.6681366c.svg');
	ctx.drawImage(SSH, canvas.width / 2 + canvas.height / 4 - 8, canvas.height / 2 - 8 + ranksOffset * -2 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.SSH), canvas.width / 2 + canvas.height / 4 + 32, canvas.height / 2 + ranksOffset * -2 + 6 + yOffset);

	//get SS
	const SS = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-SS.a21de890.svg');
	ctx.drawImage(SS, canvas.width / 2 + canvas.height / 4 + 5, canvas.height / 2 - 8 + ranksOffset * -1 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.SS), canvas.width / 2 + canvas.height / 4 + 45, canvas.height / 2 + ranksOffset * -1 + 6 + yOffset);

	//get SH
	const SH = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-S-Silver.811ae28c.svg');
	ctx.drawImage(SH, canvas.width / 2 + canvas.height / 4 + 10, canvas.height / 2 - 8 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.SH), canvas.width / 2 + canvas.height / 4 + 50, canvas.height / 2 + 6 + yOffset);

	//get S
	const S = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-S.3b4498a9.svg');
	ctx.drawImage(S, canvas.width / 2 + canvas.height / 4 + 5, canvas.height / 2 - 8 + ranksOffset * 1 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.S), canvas.width / 2 + canvas.height / 4 + 45, canvas.height / 2 + ranksOffset * 1 + 6 + yOffset);

	//get A
	const A = await Canvas.loadImage('https://osu.ppy.sh/assets/images/GradeSmall-A.d785e824.svg');
	ctx.drawImage(A, canvas.width / 2 + canvas.height / 4 - 8, canvas.height / 2 - 8 + ranksOffset * 2 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.A), canvas.width / 2 + canvas.height / 4 + 32, canvas.height / 2 + ranksOffset * 2 + 6 + yOffset);
	const output = [canvas, ctx, user];
	return output;
}

async function drawPlays(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let yOffset = 25;

	ctx.font = 'bold 16px comfortaa, sans-serif';
	ctx.textAlign = 'center';

	const playHours = Math.floor(user.secondsPlayed / 60 / 60);

	if (server !== 'ripple') {
		ctx.fillText('Hours:', canvas.width / 8 * 7, canvas.height / 2 + 6 - 40 + yOffset);
		ctx.fillText(humanReadable(playHours), canvas.width / 8 * 7, canvas.height / 2 + 6 - 20 + yOffset);
		ctx.fillText('Plays:', canvas.width / 8 * 7, canvas.height / 2 + 6 + 20 + yOffset);
		ctx.fillText(humanReadable(user.counts.plays), canvas.width / 8 * 7, canvas.height / 2 + 6 + 40 + yOffset);
	}

	if (server === 'ripple') {
		yOffset = yOffset - 30;
		ctx.fillText('Plays:', canvas.width / 16 * 13, canvas.height / 2 + 6 + 20 + yOffset);
		ctx.fillText(humanReadable(user.counts.plays), canvas.width / 16 * 13, canvas.height / 2 + 6 + 40 + yOffset);
	}
	const output = [canvas, ctx, user];
	return output;
}

async function drawFooter(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let today = new Date().toLocaleDateString();

	// Write the title of the player
	ctx.font = '12px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';

	if (server !== 'ripple') {
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
		if (joinDay === '01' || joinDay === '21' || joinDay === '31') {
			joinDayEnding = 'st';
		} else if (joinDay === '02' || joinDay === '22') {
			joinDayEnding = 'nd';
		} else if (joinDay === '03' || joinDay === '23') {
			joinDayEnding = 'rd';
		}
		const joinMonth = month[user.raw_joinDate.substring(5, 7) - 1];
		const joinYear = user.raw_joinDate.substring(0, 4);
		const joinDate = joinDay + joinDayEnding + ' ' + joinMonth + ' ' + joinYear;

		ctx.textAlign = 'left';
		ctx.fillText(`Started playing osu! on ${joinDate}`, 5, canvas.height - 5);
	}

	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

	const output = [canvas, ctx, user];
	return output;
}

async function drawAvatar(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const yOffset = 25;

	//Get a circle in the middle for inserting the player avatar
	ctx.beginPath();
	ctx.arc(canvas.width / 2, canvas.height / 2 + yOffset, canvas.height / 4, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	//Draw a shape onto the main canvas in the middle 
	try {
		const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${user.id}`);
		ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 4, canvas.height / 4 + yOffset, canvas.height / 2, canvas.height / 2);
	} catch (error) {
		const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
		ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 4, canvas.height / 4 + yOffset, canvas.height / 2, canvas.height / 2);
	}
	const output = [canvas, ctx, user];
	return output;
}