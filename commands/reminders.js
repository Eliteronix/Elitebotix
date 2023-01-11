const { Permissions } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'reminders',
	aliases: ['remind-list', 'reminders-list'],
	description: 'Sends your set reminders',
	//usage: '<location>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	//args: false,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);
		}

		logDatabaseQueries(4, 'commands/reminders.js DBProcessQueue');
		//Get all the reminders by the user
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

		let setReminders = [];
		let reminderTime = [];
		let date = new Date();
		let message = '';

		for (let i = 0; i < reminders.length; i++) {
			let args = reminders[i].additions.split(';');
			date = Date.parse(reminders[i].date) / 1000;
			setReminders.push(args[1]);
			reminderTime.push(date);
		}

		for (let i = 0; i < setReminders.length; i++) {
			message += `[${i + 1}] \`${setReminders[i]}\`  -  will be sent on <t:${reminderTime[i]}:F>\n`;
		}
		if (msg.id) {
			//Try DM'ing the user
			return msg.author.send(message, { split: true })
				.then(async () => {
					if (msg.channel.type === 'DM') return;
					msg.reply('You have received a DM with your pending reminders.');
				})
				.catch(() => {
					return msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
				});
		}
		return interaction.reply({ content: message, ephemeral: true });
	}
};
