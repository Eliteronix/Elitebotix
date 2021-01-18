const { Guilds, ReactionRolesHeader, AutoRoles } = require('../dbObjects');

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
			const guildList = await Guilds.findAll();
			console.log(guildList);

			const guilds = await Guilds.destroy({ where: {  }});
			console.log(guilds);
			const reactionRolesHeader = await ReactionRolesHeader.findAll();
			console.log(reactionRolesHeader);
			const autoRoles = await AutoRoles.findAll();
			console.log(autoRoles);
		}
	},
};