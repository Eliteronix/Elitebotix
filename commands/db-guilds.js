const { Guilds } = require('../dbObjects');

module.exports = {
	name: 'db-guilds',
	//aliases: ['developer'],
	description: 'Sends all the guilds found in the db',
	//usage: '<bug/feature/request> <description>',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			if (msg.author.id === '138273136285057025') {
				const guildList = await Guilds.findAll({ attributes: ['guildId'] });
				const guildString = guildList.map(t => t.guildId).join(', ') || 'No guilds found.';
				msg.channel.send(`List of Guilds: ${guildString}`);
			}  else {
				msg.channel.send('Insufficient permissions.');
			}
		}
	},
};