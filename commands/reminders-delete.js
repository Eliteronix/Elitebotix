const { Permissions } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'reminders-delete',
	description: 'Delete a selected reminder',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'general',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, processQueueEntry) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		let userReminderId;
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);
			userReminderId = interaction.options._hoistedOptions[0].value;
		} else {
			userReminderId = args[0];
		}

		//getting reminders
		logDatabaseQueries(4, 'commands/reminders-delete.js DBProcessQueue');
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

		if (reminders.length === 0) {
			if (msg.id) {
				return msg.reply('There are no reminders set for you');
			}
			return interaction.reply({ content: 'There are no reminders set for you', ephemeral: true });
		}

		try {
			DBProcessQueue.destroy({
				where: {
					task: 'remind',
					id: reminders[Number(userReminderId) - 1].id,
				}
			});
			if (msg.id) {
				return msg.reply('Reminder has been successfully deleted');
			}
			return interaction.reply({ content: 'Reminder has been successfully deleted', ephemeral: true });
		} catch (error) {
			if (msg.id) {
				return msg.reply('There are no reminders with the given ID');
			}
			return interaction.reply({ content: 'There are no reminders with the given ID', ephemeral: true });
		}

	}
};