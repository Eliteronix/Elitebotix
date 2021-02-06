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
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	execute(msg, args) {
		msg.reply(msg.content);
	},
};