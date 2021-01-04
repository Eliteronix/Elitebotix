const { Guilds } = require('../dbObjects');

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
			//Only for Eliteronix#4208
			if (msg.author.id === '138273136285057025') {
				//Gets an array of all guilds
				const guildList = await Guilds.findAll({ attributes: ['guildId'] });
				//Adds all guilds in a single string
				const guildString = guildList.map(t => t.guildId).join(', ') || 'No guilds found.';
				//Sends a message with the guilds
				msg.channel.send(`List of Guilds: ${guildString}`);
			}  else {
				//Send if not Eliteronix#4208
				msg.channel.send('Insufficient permissions.');
			}
		}
	},
};