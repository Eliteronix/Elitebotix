const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'db-guilds',
	//aliases: ['developer'],
	description: 'Sends all the guilds found in the db',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			const guildList = await DBGuilds.findAll();
			console.log(guildList);
		}
	},
};