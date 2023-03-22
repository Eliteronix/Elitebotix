const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'reminders',
	description: 'Sends your set reminders',
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('reminders')
		.setNameLocalizations({
			'de': 'erinnerungen',
			'en-GB': 'reminders',
			'en-US': 'reminders',
		})
		.setDescription('Sends your set reminders')
		.setDescriptionLocalizations({
			'de': 'Sendet deine gesetzten Erinnerungen',
			'en-GB': 'Sends your set reminders',
			'en-US': 'Sends your set reminders',
		})
		.setDMPermission(true),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
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
		}

		logDatabaseQueries(4, 'commands/reminders.js DBProcessQueue');
		//Get all the reminders by the user
		//TODO: add attributes and logdatabasequeries
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
			return interaction.editReply({ content: 'There are no reminders set for you', ephemeral: true });
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
					if (msg.channel.type === Discord.ChannelType.DM) return;
					msg.reply('You have received a DM with your pending reminders.');
				})
				.catch(() => {
					return msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
				});
		}
		return interaction.editReply({ content: message, ephemeral: true });
	}
};
