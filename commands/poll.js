const Discord = require('discord.js');
const Canvas = require('canvas');
const { fitTextOnLeftCanvas, getGuildPrefix, populateMsgFromInteraction } = require('../utils');
const { DBProcessQueue } = require('../dbObjects');

module.exports = {
	name: 'poll',
	aliases: ['vote'],
	description: 'Start a vote / poll',
	usage: '<title>; <option1>; <option2[; <option3>] ... [; <option10>] <#y/#mo/#w/#d/#h/#m>',
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
	async execute(msg, args, interaction, additionalObjects) {
		let years = 0;
		let months = 0;
		let weeks = 0;
		let days = 0;
		let hours = 0;
		let minutes = 0;

		if (interaction) {
			msg = await populateMsgFromInteraction(additionalObjects[0], interaction);

			await additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
				data: {
					type: 4,
					data: {
						content: 'The poll is being created'
					}
				}
			});

			months = interaction.data.options[0].value;
			weeks = interaction.data.options[1].value;
			days = interaction.data.options[2].value;
			hours = interaction.data.options[3].value;
			minutes = interaction.data.options[4].value;

			args = [];

			for (let i = 5; i < interaction.data.options.length; i++) {
				args.push(`${interaction.data.options[i].value};`);
			}
		}

		for (let i = 0; i < args.length; i++) {
			let splice = true;
			if (args[i].endsWith('y') && !isNaN(args[i].replace('y', ''))) {
				years += parseInt(args[i].replace('y', ''));
			} else if (args[i].endsWith('mo') && !isNaN(args[i].replace('mo', ''))) {
				months += parseInt(args[i].replace('mo', ''));
			} else if (args[i].endsWith('w') && !isNaN(args[i].replace('w', ''))) {
				weeks += parseInt(args[i].replace('w', ''));
			} else if (args[i].endsWith('d') && !isNaN(args[i].replace('d', ''))) {
				days += parseInt(args[i].replace('d', ''));
			} else if (args[i].endsWith('h') && !isNaN(args[i].replace('h', ''))) {
				hours += parseInt(args[i].replace('h', ''));
			} else if (args[i].endsWith('m') && !isNaN(args[i].replace('m', ''))) {
				minutes += parseInt(args[i].replace('m', ''));
			} else {
				splice = false;
			}

			if (splice) {
				args.splice(i, 1);
				i--;
			}
		}
		let now = new Date();
		let date = new Date();
		date.setUTCFullYear(date.getUTCFullYear() + years);
		date.setUTCMonth(date.getUTCMonth() + months);
		date.setUTCDate(date.getUTCDate() + weeks * 7 + days);
		date.setUTCHours(date.getUTCHours() + hours);
		date.setUTCMinutes(date.getUTCMinutes() + minutes);

		if (now.getTime() === date.getTime()) {
			const guildPrefix = await getGuildPrefix(msg);
			return msg.channel.send(`Please specify when the vote should be finished by using \`<#y/#mo/#w/#d/#h/#m>\`.\nUsage: \`${guildPrefix}${this.name} ${this.usage}\``);
		}

		let allArgs = args.join(' ');
		let options = allArgs.split(';');

		if (interaction) {
			options = [];
			for (let i = 5; i < interaction.data.options.length; i++) {
				options.push(interaction.data.options[i].value);
			}
		}

		let title = options.shift();

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

		if (title.length > optionsMaxLength) {
			optionsMaxLength = title.length;
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

		const pollMessage = await msg.channel.send('Vote for the options by using the reactions below the image!', attachment);

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

		DBProcessQueue.create({ guildId: msg.guild.id, task: 'closePoll', priority: 5, additions: `${pollMessage.channel.id};${pollMessage.id};${title};${options.join(';')}`, date: date });
	},
};