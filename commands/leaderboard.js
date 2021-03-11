const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { getGuildPrefix, humanReadable } = require('../utils');

module.exports = {
	name: 'leaderboard',
	aliases: ['guild-leaderboard', 'ranking', 'guild-ranking'],
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	usage: '<osu> (the only supported game at the moment)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	guildOnly: true,
	args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		if (args[0] === 'osu') {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});
			
			let processingMessage = await msg.channel.send('Processing guild members...');
			
			msg.guild.members.fetch()
				.then(async (guildMembers) => {
					const members = guildMembers.array();
					let osuAccounts = [];
					for (let i = 0; i < members.length; i++) {
						if (i % 150 === 0) {
							processingMessage.edit(`Grabbing osu! accounts...\nLooked at ${i} out of ${members.length} server members so far.`);
						}
						const discordUser = await DBDiscordUsers.findOne({
							where: { userId: members[i].id },
						});

						if (discordUser && discordUser.osuUserId) {
							const today = new Date();
							const dd = String(today.getDate());
							const mm = String(today.getMonth() + 1);
							const yyyy = today.getFullYear();

							let osuUser;

							if (discordUser.updatedAt.getFullYear() < yyyy) {
								osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
							} else if (discordUser.updatedAt.getMonth() + 1 < mm) {
								osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
							} else if (discordUser.updatedAt.getDate() < dd) {
								osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
							} else if (discordUser.osuPP === null || discordUser.osuRank === null || discordUser.osuName === null) {
								osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
							}

							if (osuUser) {
								discordUser.osuName = osuUser.name;
								discordUser.osuPP = osuUser.pp.raw;
								discordUser.osuRank = osuUser.pp.rank;
								await discordUser.save();
							}

							osuAccounts.push(discordUser);
						}
					}

					processingMessage.edit('Sorting accounts...');

					quicksort(osuAccounts);

					processingMessage.edit('Creating leaderboard...');

					const canvasWidth = 1000;
					const canvasHeight = 125 + 20 + osuAccounts.length * 90;

					//Create Canvas
					const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

					//Get context and load the image
					const ctx = canvas.getContext('2d');
					const background = await Canvas.loadImage('./other/osu-background.png');
					for(let i = 0; i < canvas.height/500; i++){
						ctx.drawImage(background, 0, i*500, 1000, 500);
					}

					let elements = [canvas, ctx, osuAccounts];

					elements = await drawTitle(elements, msg);

					elements = await drawAccounts(elements, msg);

					await drawFooter(elements);

					//Create as an attachment
					const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-leaderboard-${msg.guild.name}.png`);

					const guildPrefix = await getGuildPrefix(msg);

					//Send attachment
					await msg.channel.send(`The leaderboard consists of all players that have their osu! account connected to the bot.\nUse \`${guildPrefix}osu-link <username>\` to connect your osu! account.\nData is being updated once a day or when \`${guildPrefix}osu-profile <username>\` is being used.`, attachment);
					processingMessage.delete();
				})
				.catch(err => {
					processingMessage.edit('Error');
					console.log(err);
				});
		}
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].osuPP) >= parseFloat(pivot.osuPP)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}

async function drawTitle(input, msg) {
	let canvas = input[0];
	let ctx = input[1];
	let osuAccounts = input[2];

	// Write the title of the map
	ctx.font = 'bold 35px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(`${msg.guild.name}'s osu! leaderboard`, canvas.width / 2, 50);

	const output = [canvas, ctx, osuAccounts];
	return output;
}

async function drawAccounts(input, msg) {
	let canvas = input[0];
	let ctx = input[1];
	let osuAccounts = input[2];

	// Write the players
	ctx.textAlign = 'left';

	for (let i = 0; i < osuAccounts.length; i++) {
		const member = await msg.guild.members.fetch(osuAccounts[i].userId);

		let userDisplayName = member.user.username;

		if (member.nickname) {
			userDisplayName = member.nickname;
		}

		let verified = '⨯';

		if (osuAccounts[i].osuVerified) {
			verified = '✔';
		}

		if(i === 0){
			ctx.fillStyle = '#E2B007';
		} else if(i === 1) {
			ctx.fillStyle = '#C4CACE';
		} else if(i === 2) {
			ctx.fillStyle = '#CC8E34';
		} else {
			ctx.fillStyle = '#ffffff';
		}

		ctx.font = 'bold 25px sans-serif';
		ctx.fillText(`${i + 1}.`, canvas.width / 1000 * 125, 125 + i*90);
		ctx.fillText(`${userDisplayName} | ${member.user.username}#${member.user.discriminator}`, canvas.width / 1000 * 200, 125 + i*90);
		ctx.font = '25px sans-serif';
		ctx.fillText(`#${humanReadable(osuAccounts[i].osuRank)}`, canvas.width / 1000 * 200, 160 + i*90);
		ctx.fillText(`${humanReadable(Math.floor(osuAccounts[i].osuPP).toString())}pp`, canvas.width / 1000 * 400, 160 + i*90);
		ctx.fillText(`${verified} ${osuAccounts[i].osuName}`, canvas.width / 1000 * 550, 160 + i*90);
	}

	const output = [canvas, ctx, osuAccounts];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let osuAccounts = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = 'bold 15px sans-serif';
	ctx.fillStyle = '#ffffff';

	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 10);

	const output = [canvas, ctx, osuAccounts];
	return output;
}