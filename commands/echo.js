module.exports = {
	name: 'echo',
	//aliases: ['developer'],
	description: 'Answers with the same message',
	usage: '<message>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'developer',
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			msg.reply(msg.content);
		}
	},
};