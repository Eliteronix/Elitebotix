const Discord = require('discord.js');
const Canvas = require('canvas');
const { fitTextOnLeftCanvas } = require('../utils');
const { DBProcessQueue } = require('../dbObjects');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'poll',
	description: 'Start a vote / poll',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 30,
	tags: 'general',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.reply('The poll is being created');
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let months = 0;

		if (interaction.options.getInteger('months')) {
			months = interaction.options.getInteger('months');
		}

		let weeks = 0;

		if (interaction.options.getInteger('weeks')) {
			weeks = interaction.options.getInteger('weeks');
		}

		let days = 0;

		if (interaction.options.getInteger('days')) {
			days = interaction.options.getInteger('days');
		}

		let hours = 0;

		if (interaction.options.getInteger('hours')) {
			hours = interaction.options.getInteger('hours');
		}

		let minutes = 0;

		if (interaction.options.getInteger('minutes')) {
			minutes = interaction.options.getInteger('minutes');
		}

		let now = new Date();
		let date = new Date();
		date.setUTCMonth(date.getUTCMonth() + months);
		date.setUTCDate(date.getUTCDate() + weeks * 7 + days);
		date.setUTCHours(date.getUTCHours() + hours);
		date.setUTCMinutes(date.getUTCMinutes() + minutes);

		if (now.getTime() === date.getTime()) {
			return await interaction.editReply('Please specify when the vote should be finished by using at least one of the optional arguments.');
		}

		let title = interaction.options.getString('topic');

		let options = [];

		if (interaction.options.getString('option1')) {
			options.push(interaction.options.getString('option1'));
		}

		if (interaction.options.getString('option2')) {
			options.push(interaction.options.getString('option2'));
		}

		if (interaction.options.getString('option3')) {
			options.push(interaction.options.getString('option3'));
		}

		if (interaction.options.getString('option4')) {
			options.push(interaction.options.getString('option4'));
		}

		if (interaction.options.getString('option5')) {
			options.push(interaction.options.getString('option5'));
		}

		if (interaction.options.getString('option6')) {
			options.push(interaction.options.getString('option6'));
		}

		if (interaction.options.getString('option7')) {
			options.push(interaction.options.getString('option7'));
		}

		if (interaction.options.getString('option8')) {
			options.push(interaction.options.getString('option8'));
		}

		if (interaction.options.getString('option9')) {
			options.push(interaction.options.getString('option9'));
		}

		if (interaction.options.getString('option10')) {
			options.push(interaction.options.getString('option10'));
		}

		let optionsMaxLength = 0;

		for (let i = 0; i < options.length; i++) {
			if (options[i].length > optionsMaxLength) {
				optionsMaxLength = options[i].length;
			}
		}

		if (title.length > optionsMaxLength) {
			optionsMaxLength = title.length * 2;
		}

		let canvasWidth = 200 + 15 * optionsMaxLength;
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
		ctx.fillText(title, canvas.width / 2, 50);

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

		const pollMessage = await interaction.channel.send({ content: 'Vote for the options by using the reactions below the image!', files: [attachment] });

		for (let i = 0; i < options.length; i++) {
			if (i === 0) {
				await pollMessage.react('1️⃣');
			} else if (i === 1) {
				await pollMessage.react('2️⃣');
			} else if (i === 2) {
				await pollMessage.react('3️⃣');
			} else if (i === 3) {
				await pollMessage.react('4️⃣');
			} else if (i === 4) {
				await pollMessage.react('5️⃣');
			} else if (i === 5) {
				await pollMessage.react('6️⃣');
			} else if (i === 6) {
				await pollMessage.react('7️⃣');
			} else if (i === 7) {
				await pollMessage.react('8️⃣');
			} else if (i === 8) {
				await pollMessage.react('9️⃣');
			} else if (i === 9) {
				await pollMessage.react('🔟');
			}
		}

		DBProcessQueue.create({ guildId: interaction.guildId, task: 'closePoll', priority: 5, additions: `${pollMessage.channel.id};${pollMessage.id};${title};${options.join(';')}`, date: date });
	},
};