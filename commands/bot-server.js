//require the dotenv node module
require('dotenv').config();

module.exports = {
	name: 'bot-server',
	//aliases: ['developer'],
	description: 'Sends a message with the bots server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	execute(msg, args) {
		// eslint-disable-next-line no-undef
		msg.reply(`The server is running on the ${process.env.SERVER} environment on ${process.env.PROVIDER}.`);
	},
};