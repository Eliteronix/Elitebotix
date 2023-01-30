const { PermissionsBitField } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'link',
	description: 'Sends a link to add the bot to a server',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'general',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			return await interaction.reply('Here is a [link](https://discord.com/oauth2/authorize?client_id=981205694340546571&scope=bot+applications.commands&permissions=285256792) to add the bot to your server');
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}
	},
};