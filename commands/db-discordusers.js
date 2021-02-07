const { DBDiscordUsers } = require('../dbObjects');

module.exports = {
	name: 'db-discordusers',
	//aliases: ['developer'],
	description: 'Sends all the DiscordUsers found in the db',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		console.log('DiscordUsers:');
		const discordUsersList = await DBDiscordUsers.findAll();
		console.log(discordUsersList);
	},
};