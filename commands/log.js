module.exports = {
	name: 'log',
	//aliases: ['developer'],
	description: 'Logs the message in the console',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'developer',
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			console.log(msg);
		}
	},
};