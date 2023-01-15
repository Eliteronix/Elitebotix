const { Permissions } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'reminders-edit',
	description: 'Edit your reminders',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'general',
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
			DBProcessQueue.destroy({
				where: {
					task: 'remind',
					id: reminders[Number(userReminderId) - 1].id,
				}
			});
			//Set a new reminder
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