const { DBAutoRoles } = require('../dbObjects');

module.exports = {
	name: 'db-autoroles',
	//aliases: ['developer'],
	description: 'Sends all the AutoRoles found in the db',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'developer',
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			const autoRoleList = await DBAutoRoles.findAll();
			console.log(autoRoleList);
		}
	},
};