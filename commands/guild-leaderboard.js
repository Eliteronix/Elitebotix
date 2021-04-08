const { DBServerUserActivity } = require('../dbObjects');
const Discord = require('discord.js');
const Canvas = require('canvas');
const { humanReadable } = require('../utils');

module.exports = {
	name: 'server-leaderboard',
	aliases: ['guild-leaderboard', 'guild-ranking'],
	description: 'Sends a leaderboard of the top users in the guild',
	// usage: '<osu> (the only supported game at the moment)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	guildOnly: true,
	// args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		let processingMessage = await msg.channel.send('Processing guild members...');

		msg.guild.members.fetch()
			.then(async (guildMembers) => {
				const members = guildMembers.filter(member => member.user.bot !== true).array();
				let discordUsers = [];
				for (let i = 0; i < members.length; i++) {
					if (i % 150 === 0) {
						processingMessage.edit(`Grabbing discord activities...\nLooked at ${i} out of ${members.length} server members so far.`);
					}
					const serverUserActivity = await DBServerUserActivity.findOne({
						where: { userId: members[i].id, guildId: msg.guild.id },
					});

					if(serverUserActivity){
						discordUsers.push(serverUserActivity);
					}
				}

				processingMessage.edit('Sorting accounts...');

				quicksort(discordUsers);

				processingMessage.edit('Creating leaderboard...');

				const canvasWidth = 1000;
				const canvasHeight = 125 + 20 + discordUsers.length * 90;

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/discord-background.png');
				for (let i = 0; i < canvas.height / 500; i++) {
					ctx.drawImage(background, 0, i * 500, 1000, 500);
				}

				let elements = [canvas, ctx, discordUsers];

				elements = await drawTitle(elements, msg);

				elements = await drawUsers(elements, msg);

				await drawFooter(elements);

				//Create as an attachment
				const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `guild-leaderboard-${msg.guild.name}.png`);

				//Send attachment
				await msg.channel.send('The leaderboard shows the most active users of the server.', attachment);
				processingMessage.delete();
			})
			.catch(err => {
				processingMessage.edit('Error');
				console.log(err);
			});
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].points) >= parseFloat(pivot.points)) {
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
	let discordUsers = input[2];

	// Write the title of the map
	ctx.font = 'bold 35px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(`${msg.guild.name}'s activity leaderboard`, canvas.width / 2, 50);

	const output = [canvas, ctx, discordUsers];
	return output;
}

async function drawUsers(input, msg) {
	let canvas = input[0];
	let ctx = input[1];
	let discordUsers = input[2];

	// Write the players
	ctx.textAlign = 'left';

	for (let i = 0; i < discordUsers.length; i++) {
		const member = await msg.guild.members.fetch(discordUsers[i].userId);

		let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

		if (member.nickname) {
			userDisplayName = `${member.nickname} / ${userDisplayName}`;
		}

		if (i === 0) {
			ctx.fillStyle = '#E2B007';
		} else if (i === 1) {
			ctx.fillStyle = '#C4CACE';
		} else if (i === 2) {
			ctx.fillStyle = '#CC8E34';
		} else {
			ctx.fillStyle = '#ffffff';
		}

		ctx.font = 'bold 25px sans-serif';
		ctx.fillText(`${i + 1}.`, canvas.width / 1000 * 125, 125 + i * 90);
		ctx.fillText(userDisplayName, canvas.width / 1000 * 200, 125 + i * 90);
		ctx.font = '25px sans-serif';
		ctx.fillText(`${humanReadable(discordUsers[i].points)} points`, canvas.width / 1000 * 200, 160 + i * 90);
	}

	const output = [canvas, ctx, discordUsers];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let discordUsers = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = 'bold 15px sans-serif';
	ctx.fillStyle = '#ffffff';

	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 10);

	const output = [canvas, ctx, discordUsers];
	return output;
}