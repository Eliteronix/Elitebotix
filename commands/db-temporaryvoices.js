const { DBTemporaryVoices } = require('../dbObjects');

module.exports = {
	name: 'db-temporaryvoices',
	//aliases: ['developer'],
	description: 'Sends all the TemporaryVoices found in the db',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			const TemporaryVoicesList = await DBTemporaryVoices.findAll();
			console.log(TemporaryVoicesList);
		}
	},
};