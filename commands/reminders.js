const { Permissions } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction } = require('../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'reminders',
	aliases: ['remind-list', 'reminders-list'],
	description: 'Sends current time of the given location',
	//usage: '<location>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	//args: false,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);
		}

		//Get all the reminders by the user
		const reminders = await DBProcessQueue.findAll({
			where: {
				task: 'remind',
				additions: {
					[Op.like]: `${msg.author.id}%`,
				}
			}
		});

		if (reminders.length === 0) {
			if (msg) {
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
			date = reminders[i].date;

			setReminders.push(args[1]);
			reminderTime.push(date.toLocaleTimeString('en-UK', {
				day: 'numeric', // numeric, 2-digit
				year: 'numeric', // numeric, 2-digit
				month: '2-digit', // numeric, 2-digit, long, short, narrow
				hour: 'numeric', // numeric, 2-digit
				minute: 'numeric', // numeric, 2-digit
				second: 'numeric', // numeric, 2-digit
			}));
		}

		for (let i = 0; i < setReminders.length; i++) {
			message += `\`${setReminders[i]}\`  -  will be sent on ${reminderTime[i]}\n`;
		}

		if (msg) {
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
