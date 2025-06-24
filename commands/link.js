const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'link',
	description: 'Sends a link to add the bot to a server',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
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
			return await interaction.reply(`Here is a [link](https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&scope=bot+applications.commands&permissions=285256792) to add the bot to your server or alternatively use [this link](https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&integration_type=1&scope=applications.commands) to add the bot to your user to use it anywhere.`);
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