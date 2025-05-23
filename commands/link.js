const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'link',
	description: 'Sends a link to add the bot to a server',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('link')
		.setNameLocalizations({
			'de': 'link',
			'en-GB': 'link',
			'en-US': 'link',
		})
		.setDescription('Sends a link to add the bot to a server')
		.setDescriptionLocalizations({
			'de': 'Sendet einen Link, um den Bot zu deinem Server hinzuzufügen',
			'en-GB': 'Sends a link to add the bot to a server',
			'en-US': 'Sends a link to add the bot to a server',
		})
		.setDMPermission(true),
	async execute(interaction) {
		try {
			return await interaction.reply('Here is a [link](https://discord.com/oauth2/authorize?client_id=981205694340546571&scope=bot+applications.commands&permissions=285256792) to add the bot to your server');
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}
	},
};