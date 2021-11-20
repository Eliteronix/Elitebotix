const { Permissions } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction } = require('../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'reminders-delete',
	//aliases: ['remind-list', 'reminders-list'],
	description: 'Delete a selected reminder',
	usage: '<ID>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, processQueueEntry) {
		let userReminderId;
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);
			userReminderId = interaction.options._hoistedOptions[0].value;
		} else {
			userReminderId = args[0];
		} 

		//getting reminders
		const reminders = await DBProcessQueue.findAll({
			where: {
				task: 'remind',
				additions: {
					[Op.like]: `${msg.author.id}%`,
				}
			}
		});
        
		if (reminders.length === 0) {
			if (msg.id) {
				return  msg.reply('There are no reminders set for you');
			} else return interaction.reply({ content: 'There are no reminders set for you', ephemeral: true });
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
			} else return interaction.reply({ content: 'Reminder has been successfully deleted', ephemeral: true });
		} catch (error) {
			if (msg.id) {
				return msg.reply('There are no reminders with the given ID');
			}
			return interaction.reply({ content: 'There are no reminders with the given ID', ephemeral: true });
		}
        
	}
};