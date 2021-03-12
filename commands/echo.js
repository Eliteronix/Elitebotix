module.exports = {
	name: 'echo',
	//aliases: ['developer'],
	description: 'Answers with the same message',
	usage: '<message>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	execute(msg, args) {
		msg.reply(`\`${msg.content.replace(/`/g, '')}\``);
	},
};