const { DBProcessQueue } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');

module.exports = {
	name: 'remindme',
	description: 'Sends a reminder at the specified time',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
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
				.setMinValue(0) // Ensure years cannot be negative
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
				.setMinValue(0) // Ensure months cannot be negative
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
				.setMinValue(0) // Ensure weeks cannot be negative
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
				.setMinValue(0) // Ensure days cannot be negative
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
				.setMinValue(0) // Ensure hours cannot be negative
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
				.setMinValue(0) // Ensure minutes cannot be negative
		),
	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let years = interaction.options.getInteger('years') || 0;
		let months = interaction.options.getInteger('months') || 0;
		let weeks = interaction.options.getInteger('weeks') || 0;
		let days = interaction.options.getInteger('days') || 0;
		let hours = interaction.options.getInteger('hours') || 0;
		let minutes = interaction.options.getInteger('minutes') || 0;
		let message = interaction.options.getString('message');

		let now = new Date();
		let date = new Date();
		date.setUTCFullYear(date.getUTCFullYear() + years);
		date.setUTCMonth(date.getUTCMonth() + months);
		date.setUTCDate(date.getUTCDate() + weeks * 7 + days);
		date.setUTCHours(date.getUTCHours() + hours);
		date.setUTCMinutes(date.getUTCMinutes() + minutes);

		if (now.getTime() === date.getTime()) {
			return await interaction.editReply({ content: 'You didn\'t specify when I should remind you.', flags: MessageFlags.Ephemeral });
		}

		await DBProcessQueue.create({ guildId: 'None', task: 'remind', priority: 10, additions: `${interaction.user.id};${message}`, date: date });

		return await interaction.editReply({ content: 'Reminder has been set. Be sure to have DMs enabled for the bot.', flags: MessageFlags.Ephemeral });
	},
};