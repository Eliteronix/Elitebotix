const { DBReactionRolesHeader } = require('../dbObjects');

module.exports = {
	name: 'db-reactionrolesheader',
	//aliases: ['developer'],
	description: 'Sends all the ReactionRolesHeaders found in the db',
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
	async execute(msg, args) {
		console.log('ReactionRolesHeaders:');
		const DBReactionRolesHeadersList = await DBReactionRolesHeader.findAll();
		console.log(DBReactionRolesHeadersList);
	},
};