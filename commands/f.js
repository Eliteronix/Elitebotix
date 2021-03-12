module.exports = {
	name: 'f',
	//aliases: ['developer'],
	description: 'Answers with o7',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'hidden-general',
	//prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	execute(msg, args) {
		if(!(args[0])){
			msg.channel.send('o7');
		}
	},
};