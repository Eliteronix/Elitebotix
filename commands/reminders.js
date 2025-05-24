const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');

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

		//Get all the reminders by the user
		const reminders = await DBProcessQueue.findAll({
			attributes: ['date', 'additions'],
			where: {
				task: 'remind',
				additions: {
					[Op.like]: `${interaction.user.id}%`,
				}
			},
			order: [
				['date', 'ASC'],
			]
		});

		if (reminders.length === 0) {
			return await interaction.editReply({ content: 'There are no reminders set for you', flags: MessageFlags.Ephemeral });
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

		return await interaction.editReply({ content: message, flags: MessageFlags.Ephemeral });
	}
};
