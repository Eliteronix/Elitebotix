const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'reminders-edit',
	description: 'Edit your reminders',
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('reminders-edit')
		.setNameLocalizations({
			'de': 'erinnerungen-bearbeiten',
			'en-GB': 'reminders-edit',
			'en-US': 'reminders-edit',
		})
		.setDescription('Edit your reminders')
		.setDescriptionLocalizations({
			'de': 'Bearbeite deine Erinnerungen',
			'en-GB': 'Edit your reminders',
			'en-US': 'Edit your reminders',
		})
		.setDMPermission(true)
		.addIntegerOption(option =>
			option.setName('id')
				.setNameLocalizations({
					'de': 'id',
					'en-GB': 'id',
					'en-US': 'id',
				})
				.setDescription('Id of the reminder (can be found by using /reminders command)')
				.setDescriptionLocalizations({
					'de': 'Id der Erinnerung (kann mit /erinnerungen gefunden werden)',
					'en-GB': 'Id of the reminder (can be found by using /reminders command)',
					'en-US': 'Id of the reminder (can be found by using /reminders command)',
				})
				.setRequired(true)
		)
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
	async execute(msg, args, interaction, processQueueEntry) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			msg = await populateMsgFromInteraction(interaction);
		} else if (msg.id) {
			return msg.reply('Please edit your reminders by using the / command `/reminders-edit`');
		}

		//getting reminders
		logDatabaseQueries(4, 'commands/reminders-edit.js DBProcessQueue');
		const reminders = await DBProcessQueue.findAll({
			where: {
				task: 'remind',
				additions: {
					[Op.like]: `${msg.author.id}%`,
				}
			},
			order: [
				['date', 'ASC'],
			]
		});

		//reminders check
		if (reminders.length === 0) {
			return interaction.editReply({ content: 'There are no reminders set for you', ephemeral: true });
		}

		let userReminderId;
		let userReminderMessage;
		let years = 0;
		let months = 0;
		let weeks = 0;
		let days = 0;
		let hours = 0;
		let minutes = 0;

		for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
			if (interaction.options._hoistedOptions[i].name === 'id') {
				userReminderId = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'message') {
				userReminderMessage = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'years') {
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
			}
		}

		let reminderDate;
		let userReminderDate = new Date();
		try {
			reminderDate = reminders[Number(userReminderId) - 1].date;
		} catch (error) {
			return interaction.editReply({ content: 'There are no reminders with the given ID', ephemeral: true });
		}

		if (years || months || weeks || days || hours || minutes) {
			//Get reminders property 'date' from user's given Id
			userReminderDate.setUTCFullYear(userReminderDate.getUTCFullYear() + years);
			userReminderDate.setUTCMonth(userReminderDate.getUTCMonth() + months);
			userReminderDate.setUTCDate(userReminderDate.getUTCDate() + weeks * 7 + days);
			userReminderDate.setUTCHours(userReminderDate.getUTCHours() + hours);
			userReminderDate.setUTCMinutes(userReminderDate.getUTCMinutes() + minutes);
		} else {
			userReminderDate = reminderDate;
		}

		for (let i = 0; i < reminders.length; i++) {
			//Set reminder date to previous date if new date is not given
			let reminderId;
			try {
				reminderId = reminders[Number(userReminderId) - 1].id;
			} catch (error) {
				return interaction.editReply({ content: 'There are no reminders with the given ID', ephemeral: true });
			}
			//If no reminder with the given Id
			//destroy previous reminder
			logDatabaseQueries(4, 'commands/reminders-edit.js DBProcessQueue destroy');
			DBProcessQueue.destroy({
				where: {
					task: 'remind',
					id: reminders[Number(userReminderId) - 1].id,
				}
			});
			//Set a new reminder
			logDatabaseQueries(4, 'commands/reminders-edit.js DBProcessQueue create');
			DBProcessQueue.create({ id: reminderId, guildId: 'None', task: 'remind', priority: 10, additions: `${msg.author.id};${userReminderMessage}`, date: userReminderDate });

			return interaction.editReply({
				content: `Your reminder has been successfully edited.\nNew message: \`${userReminderMessage}\`\nNew date: \`${userReminderDate.toLocaleTimeString('en-UK', {
					day: 'numeric', // numeric, 2-digit
					year: 'numeric', // numeric, 2-digit
					month: '2-digit', // numeric, 2-digit, long, short, narrow
					hour: 'numeric', // numeric, 2-digit
					minute: 'numeric', // numeric, 2-digit
					second: 'numeric', // numeric, 2-digit
				})}\``, ephemeral: true
			});
		}
	}
};