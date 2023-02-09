const { DBProcessQueue } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	name: 'remindme',
	description: 'Sends a reminder at the specified time',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('remindme')
		.setNameLocalizations({
			'de': 'erinnere-mich',
			'en-GB': 'remindme',
			'en-US': 'remindme',
		})
		.setDescription('Sends a reminder at the specified time')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Erinnerung zu der angegebenen Zeit',
			'en-GB': 'Sends a reminder at the specified time',
			'en-US': 'Sends a reminder at the specified time',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('message')
				.setNameLocalizations({
					'de': 'nachricht',
					'en-GB': 'message',
					'en-US': 'message',
				})
				.setDescription('The message of the reminder')
				.setDescriptionLocalizations({
					'de': 'Die Nachricht der Erinnerung',
					'en-GB': 'The message of the reminder',
					'en-US': 'The message of the reminder',
				})
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option.setName('years')
				.setNameLocalizations({
					'de': 'jahre',
					'en-GB': 'years',
					'en-US': 'years',
				})
				.setDescription('The years until the reminder')
				.setDescriptionLocalizations({
					'de': 'Die Jahre bis zur Erinnerung',
					'en-GB': 'The years until the reminder',
					'en-US': 'The years until the reminder',
				})
				.setRequired(false)
		)
		.addIntegerOption(option =>
			option.setName('months')
				.setNameLocalizations({
					'de': 'monate',
					'en-GB': 'months',
					'en-US': 'months',
				})
				.setDescription('The months until the reminder')
				.setDescriptionLocalizations({
					'de': 'Die Monate bis zur Erinnerung',
					'en-GB': 'The months until the reminder',
					'en-US': 'The months until the reminder',
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
				.setDescription('The weeks until the reminder')
				.setDescriptionLocalizations({
					'de': 'Die Wochen bis zur Erinnerung',
					'en-GB': 'The weeks until the reminder',
					'en-US': 'The weeks until the reminder',
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
				.setDescription('The days until the reminder')
				.setDescriptionLocalizations({
					'de': 'Die Tage bis zur Erinnerung',
					'en-GB': 'The days until the reminder',
					'en-US': 'The days until the reminder',
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
				.setDescription('The hours until the reminder')
				.setDescriptionLocalizations({
					'de': 'Die Stunden bis zur Erinnerung',
					'en-GB': 'The hours until the reminder',
					'en-US': 'The hours until the reminder',
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
				.setDescription('The minutes until the reminder')
				.setDescriptionLocalizations({
					'de': 'Die Minuten bis zur Erinnerung',
					'en-GB': 'The minutes until the reminder',
					'en-US': 'The minutes until the reminder',
				})
				.setRequired(false)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		let years = 0;
		let months = 0;
		let weeks = 0;
		let days = 0;
		let hours = 0;
		let minutes = 0;

		if (interaction) {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}
			msg = await populateMsgFromInteraction(interaction);

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'years') {
					years = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'months') {
					months = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'weeks') {
					weeks = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'days') {
					days = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'hours') {
					hours = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'minutes') {
					minutes = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'message') {
					args = [interaction.options._hoistedOptions[i].value];
				}
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

		if (args.length === 0) {
			const guildPrefix = await getGuildPrefix(msg);
			return msg.reply(`You didn't provide a message.\n\`Usage: ${guildPrefix}${this.name} ${this.usage}\``);
		}

		let now = new Date();
		let date = new Date();
		date.setUTCFullYear(date.getUTCFullYear() + years);
		date.setUTCMonth(date.getUTCMonth() + months);
		date.setUTCDate(date.getUTCDate() + weeks * 7 + days);
		date.setUTCHours(date.getUTCHours() + hours);
		date.setUTCMinutes(date.getUTCMinutes() + minutes);

		if (years < 0 || months < 0 || weeks < 0 || days < 0 || hours < 0 || minutes < 0) {
			const guildPrefix = await getGuildPrefix(msg);
			if (msg.id) {
				return msg.reply(`You aren't allowed to use negative values for the time.\n\`Usage: ${guildPrefix}${this.name} ${this.usage}\``);
			}
			return interaction.editReply({ content: `You aren't allowed to use negative values for the time.\n\`Usage: ${guildPrefix}${this.name} ${this.usage}\``, ephemeral: true });
		}

		if (now.getTime() === date.getTime()) {
			const guildPrefix = await getGuildPrefix(msg);
			if (msg.id) {
				return msg.reply(`You didn't specify when I should remind you.\n\`Usage: ${guildPrefix}${this.name} ${this.usage}\``);
			}
			return interaction.editReply({ content: 'You didn\'t specify when I should remind you.', ephemeral: true });
		}

		logDatabaseQueries(4, 'commands/remindme.js DBProcessQueue create');
		DBProcessQueue.create({ guildId: 'None', task: 'remind', priority: 10, additions: `${msg.author.id};${args.join(' ')}`, date: date });

		if (msg.id) {
			return msg.reply('Reminder has been set. Be sure to have DMs enabled for the bot.');
		}

		return interaction.editReply({ content: 'Reminder has been set. Be sure to have DMs enabled for the bot.', ephemeral: true });
	},
};