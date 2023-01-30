const { PermissionsBitField } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'prune',
	description: 'Deletes the specified amount of messages; Messages have to be less than 2 weeks old',
	permissions: PermissionsBitField.Flags.ManageMessages,
	permissionsTranslated: 'Manage Messages',
	botPermissions: PermissionsBitField.Flags.ManageMessages,
	botPermissionsTranslated: 'Manage Messages',
	cooldown: 15,
	tags: 'server-admin',
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		//Set amount by argument + 1
		const amount = interaction.options.getInteger('amount') + 1;

		if (amount <= 1 || amount > 100) {
			return interaction.editReply('You need to input a number between 1 and 99.');
		}

		//Delete messages which are less than 2 weeks old
		interaction.channel.bulkDelete(amount, true).catch(async (err) => {
			console.error(err);
			return await interaction.editReply('There was an error trying to prune messages in this channel');
		});

		return await interaction.followUp({ content: 'Deleted messages', ephemeral: true });
	},
};