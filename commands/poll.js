const Discord = require('discord.js');
const Canvas = require('canvas');
const { fitTextOnLeftCanvas, logDatabaseQueries } = require('../utils');
const { DBProcessQueue } = require('../dbObjects');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'poll',
	description: 'Start a vote / poll',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 30,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('poll')
		.setNameLocalizations({
			'de': 'umfrage',
			'en-GB': 'poll',
			'en-US': 'poll',
		})
		.setDescription('Start a vote / poll')
		.setDescriptionLocalizations({
			'de': 'Starte eine Umfrage',
			'en-GB': 'Start a vote / poll',
			'en-US': 'Start a vote / poll',
		})
		.setDMPermission(false)
		.addStringOption(option =>
			option.setName('topic')
				.setNameLocalizations({
					'de': 'thema',
					'en-GB': 'topic',
					'en-US': 'topic',
				})
				.setDescription('The poll topic')
				.setDescriptionLocalizations({
					'de': 'Das Thema der Umfrage',
					'en-GB': 'The poll topic',
					'en-US': 'The poll topic',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('option1')
				.setNameLocalizations({
					'de': 'option1',
					'en-GB': 'option1',
					'en-US': 'option1',
				})
				.setDescription('The first option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die erste Option der Umfrage',
					'en-GB': 'The first option of the poll',
					'en-US': 'The first option of the poll',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('option2')
				.setNameLocalizations({
					'de': 'option2',
					'en-GB': 'option2',
					'en-US': 'option2',
				})
				.setDescription('The second option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die zweite Option der Umfrage',
					'en-GB': 'The second option of the poll',
					'en-US': 'The second option of the poll',
				})
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option.setName('months')
				.setNameLocalizations({
					'de': 'monate',
					'en-GB': 'months',
					'en-US': 'months',
				})
				.setDescription('The months until the end of the poll')
				.setDescriptionLocalizations({
					'de': 'Die Monate bis zum Ende der Umfrage',
					'en-GB': 'The months until the end of the poll',
					'en-US': 'The months until the end of the poll',
				})
				.setRequired(false)
		)
		.addIntegerOption(option =>
			option.setName('weeks')
				.setNameLocalizations({
					'de': 'wochen',
					'en-GB': 'weeks',
					'en-US': 'weeks',
				})
				.setDescription('The weeks until the end of the poll')
				.setDescriptionLocalizations({
					'de': 'Die Wochen bis zum Ende der Umfrage',
					'en-GB': 'The weeks until the end of the poll',
					'en-US': 'The weeks until the end of the poll',
				})
				.setRequired(false)
		)
		.addIntegerOption(option =>
			option.setName('days')
				.setNameLocalizations({
					'de': 'tage',
					'en-GB': 'days',
					'en-US': 'days',
				})
				.setDescription('The days until the end of the poll')
				.setDescriptionLocalizations({
					'de': 'Die Tage bis zum Ende der Umfrage',
					'en-GB': 'The days until the end of the poll',
					'en-US': 'The days until the end of the poll',
				})
				.setRequired(false)
		)
		.addIntegerOption(option =>
			option.setName('hours')
				.setNameLocalizations({
					'de': 'stunden',
					'en-GB': 'hours',
					'en-US': 'hours',
				})
				.setDescription('The hours until the end of the poll')
				.setDescriptionLocalizations({
					'de': 'Die Stunden bis zum Ende der Umfrage',
					'en-GB': 'The hours until the end of the poll',
					'en-US': 'The hours until the end of the poll',
				})
				.setRequired(false)
		)
		.addIntegerOption(option =>
			option.setName('minutes')
				.setNameLocalizations({
					'de': 'minuten',
					'en-GB': 'minutes',
					'en-US': 'minutes',
				})
				.setDescription('The minutes until the end of the poll')
				.setDescriptionLocalizations({
					'de': 'Die Minuten bis zum Ende der Umfrage',
					'en-GB': 'The minutes until the end of the poll',
					'en-US': 'The minutes until the end of the poll',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('option3')
				.setNameLocalizations({
					'de': 'option3',
					'en-GB': 'option3',
					'en-US': 'option3',
				})
				.setDescription('The third option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die dritte Option der Umfrage',
					'en-GB': 'The third option of the poll',
					'en-US': 'The third option of the poll',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('option4')
				.setNameLocalizations({
					'de': 'option4',
					'en-GB': 'option4',
					'en-US': 'option4',
				})
				.setDescription('The fourth option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die vierte Option der Umfrage',
					'en-GB': 'The fourth option of the poll',
					'en-US': 'The fourth option of the poll',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('option5')
				.setNameLocalizations({
					'de': 'option5',
					'en-GB': 'option5',
					'en-US': 'option5',
				})
				.setDescription('The fifth option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die fünfte Option der Umfrage',
					'en-GB': 'The fifth option of the poll',
					'en-US': 'The fifth option of the poll',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('option6')
				.setNameLocalizations({
					'de': 'option6',
					'en-GB': 'option6',
					'en-US': 'option6',
				})
				.setDescription('The sixth option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die sechste Option der Umfrage',
					'en-GB': 'The sixth option of the poll',
					'en-US': 'The sixth option of the poll',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('option7')
				.setNameLocalizations({
					'de': 'option7',
					'en-GB': 'option7',
					'en-US': 'option7',
				})
				.setDescription('The seventh option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die siebte Option der Umfrage',
					'en-GB': 'The seventh option of the poll',
					'en-US': 'The seventh option of the poll',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('option8')
				.setNameLocalizations({
					'de': 'option8',
					'en-GB': 'option8',
					'en-US': 'option8',
				})
				.setDescription('The eigth option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die achte Option der Umfrage',
					'en-GB': 'The eigth option of the poll',
					'en-US': 'The eigth option of the poll',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('option9')
				.setNameLocalizations({
					'de': 'option9',
					'en-GB': 'option9',
					'en-US': 'option9',
				})
				.setDescription('The ninth option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die neunte Option der Umfrage',
					'en-GB': 'The ninth option of the poll',
					'en-US': 'The ninth option of the poll',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('option10')
				.setNameLocalizations({
					'de': 'option10',
					'en-GB': 'option10',
					'en-US': 'option10',
				})
				.setDescription('The tenth option of the poll')
				.setDescriptionLocalizations({
					'de': 'Die zehnte Option der Umfrage',
					'en-GB': 'The tenth option of the poll',
					'en-US': 'The tenth option of the poll',
				})
				.setRequired(false)
		),
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
		const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'vote.png' });

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

		logDatabaseQueries(4, 'commands/poll.js DBProcessQueue');
		DBProcessQueue.create({ guildId: interaction.guildId, task: 'closePoll', priority: 5, additions: `${pollMessage.channel.id};${pollMessage.id};${title};${options.join(';')}`, date: date });
	},
};