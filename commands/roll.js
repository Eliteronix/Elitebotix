const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'roll',
	// aliases: ['dice', 'ouo'],
	description: 'Rolls a number between 1 and 100 or 1 and the number specified',
	usage: '[Number]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	// guildOnly: true,
	//args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
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

		return interaction.reply(`<@${interaction.user.id}> rolled ${result}!`);
	},
};