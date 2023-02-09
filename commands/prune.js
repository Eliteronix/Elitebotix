const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'prune',
	description: 'Deletes the specified amount of messages; Messages have to be less than 2 weeks old',
	botPermissions: PermissionsBitField.Flags.ManageMessages,
	botPermissionsTranslated: 'Manage Messages',
	cooldown: 15,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('prune')
		.setNameLocalizations({
			'de': 'löschen',
			'en-GB': 'prune',
			'en-US': 'prune',
		})
		.setDescription('Deletes the specified amount of messages; Messages have to be less than 2 weeks old')
		.setDescriptionLocalizations({
			'de': 'Löscht die angegebene Anzahl an Nachrichten; Nachrichten müssen weniger als 2 Wochen alt sein',
			'en-GB': 'Deletes the specified amount of messages; Messages have to be less than 2 weeks old',
			'en-US': 'Deletes the specified amount of messages; Messages have to be less than 2 weeks old',
		})
		.addIntegerOption(option =>
			option.setName('amount')
				.setNameLocalizations({
					'de': 'anzahl',
					'en-GB': 'amount',
					'en-US': 'amount',
				})
				.setDescription('The amount of messages to delete')
				.setDescriptionLocalizations({
					'de': 'Die Anzahl an Nachrichten, die gelöscht werden sollen',
					'en-GB': 'The amount of messages to delete',
					'en-US': 'The amount of messages to delete',
				})
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(99)
		),
	async execute(msg, args, interaction) {
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

		//Set amount by argument + 1
		const amount = interaction.options.getInteger('amount') + 1;

		//Delete messages which are less than 2 weeks old
		interaction.channel.bulkDelete(amount, true).catch(async (err) => {
			console.error(err);
			return await interaction.editReply('There was an error trying to prune messages in this channel');
		});

		return await interaction.followUp({ content: 'Deleted messages', ephemeral: true });
	},
};