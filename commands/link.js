const { Permissions } = require('discord.js');

module.exports = {
	name: 'link',
	aliases: ['invite'],
	description: 'Sends a link to add the bot to a server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			return interaction.reply('Here is a [link](https://discord.com/oauth2/authorize?client_id=784836063058329680&scope=bot+applications.commands&permissions=285256792) to add the bot to your server');
		}

		//Link with permissions | Administrator, Manage Roles, Manage Channels, Read Messages, Send Messages, Manage Messages, Attach Files, View Channel, Move Members, Add Reactions
		msg.reply('Here is a link to add the bot to your server: https://discord.com/oauth2/authorize?client_id=784836063058329680&scope=bot+applications.commands&permissions=285256792');
	},
};