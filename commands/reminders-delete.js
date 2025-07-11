const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction } = require('../utils');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'reminders-delete',
	description: 'Delete a selected reminder',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('reminders-delete')
		.setNameLocalizations({
			'de': 'erinnerungen-löschen',
			'en-GB': 'reminders-delete',
			'en-US': 'reminders-delete',
		})
		.setDescription('Delete a selected reminder')
		.setDescriptionLocalizations({
			'de': 'Löscht eine ausgewählte Erinnerung',
			'en-GB': 'Delete a selected reminder',
			'en-US': 'Delete a selected reminder',
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
		),
	async execute(interaction, msg, args) {
		//TODO: Remove message code and replace with interaction code
		let userReminderId;
		if (interaction) {
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
			msg = await populateMsgFromInteraction(interaction);
			userReminderId = interaction.options._hoistedOptions[0].value;
		} else {
			userReminderId = args[0];
		}

		//getting reminders
		//TODO: add attributes
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
			return await interaction.editReply({ content: 'There are no reminders set for you', flags: MessageFlags.Ephemeral });
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
			return await interaction.editReply({ content: 'Reminder has been successfully deleted', flags: MessageFlags.Ephemeral });
		} catch (error) {
			if (msg.id) {
				return msg.reply('There are no reminders with the given ID');
			}
			return await interaction.editReply({ content: 'There are no reminders with the given ID', flags: MessageFlags.Ephemeral });
		}

	}
};