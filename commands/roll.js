const { PermissionsBitField } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'roll',
	description: 'Rolls a number between 1 and 100 or 1 and the number specified',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'misc',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let max = 100;

		if (interaction.options.getInteger('maximum')) {
			max = interaction.options.getInteger('maximum');

			if (max < 2) {
				max = 2;
			}
		}

		const result = Math.floor(Math.random() * max) + 1;

		return await interaction.editReply(`<@${interaction.user.id}> rolled ${result}!`);
	},
};