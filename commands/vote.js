const Discord = require('discord.js');
const Canvas = require('canvas');
const { fitTextOnLeftCanvas } = require('../utils');

module.exports = {
	name: 'vote',
	aliases: ['poll'],
	description: 'Start a vote / poll',
	usage: '<option1>; <option2[; <option3>] ... [; <option10>] <#y/#mo/#w/#d/#h/#m>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	guildOnly: true,
	args: true,
	cooldown: 30,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		let allArgs = args.join(' ');
		let options = allArgs.split(';');
		let optionsMaxLength = 0;

		for (let i = 0; i < options.length; i++) {
			if (!options[i]) {
				options.splice(i, 1);
				i--;
			} else if (options[i].length > optionsMaxLength) {
				optionsMaxLength = options[i].length;
			}
		}

		if (!options[1]) {
			return msg.channel.send('Please provide at least two options to vote for seperated by a `;`.');
		}

		if (options[10]) {
			return msg.channel.send('Votes are limited to 10 possibilities maximum.');
		}

		const canvasWidth = 200 + 15 * optionsMaxLength;
		let canvasHeight = 100 + options.length * 100;

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

		//Get context and load the image
		const ctx = canvas.getContext('2d');

		const background = await Canvas.loadImage('./other/discord-background.png');

		for (let i = 0; i < canvas.height / background.height; i++) {
			for (let j = 0; j < canvas.width / background.width; j++) {
				ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
			}
		}

		// Write the title of the changelog
		ctx.font = 'bold 35px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText('Vote', canvas.width / 2, 50);

		let today = new Date().toLocaleDateString();

		ctx.font = '12px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

		for (let i = 0; i < options.length; i++) {
			ctx.font = 'bold 25px comfortaa, sans-serif';
			ctx.textAlign = 'left';
			ctx.fillText(`${i + 1}. Option:`, 100, 100 + 100 * i);
			fitTextOnLeftCanvas(ctx, `${options[i]}`, 25, 'comfortaa, sans-serif', 130 + 100 * i, canvas.width - 100, 100);
		}

		//Create as an attachment
		const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'vote.png');

		const voteMessage = await msg.channel.send('Vote for the options by using the reactions below the image!', attachment);

		for (let i = 0; i < options.length; i++) {
			if (i === 0) {
				await voteMessage.react('1️⃣');
			} else if (i === 1) {
				await voteMessage.react('2️⃣');
			} else if (i === 2) {
				await voteMessage.react('3️⃣');
			} else if (i === 3) {
				await voteMessage.react('4️⃣');
			} else if (i === 4) {
				await voteMessage.react('5️⃣');
			} else if (i === 5) {
				await voteMessage.react('6️⃣');
			} else if (i === 6) {
				await voteMessage.react('7️⃣');
			} else if (i === 7) {
				await voteMessage.react('8️⃣');
			} else if (i === 8) {
				await voteMessage.react('9️⃣');
			} else if (i === 9) {
				await voteMessage.react('🔟');
			}
		}
	},
};