//require the dotenv node module
require('dotenv').config();

module.exports = {
	name: 'bot-server',
	//aliases: ['developer'],
	description: 'Sends a message with the bots server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			// eslint-disable-next-line no-undef
			msg.channel.send(`The server is running on the ${process.env.SERVER} environment.`);
		}
	},
};