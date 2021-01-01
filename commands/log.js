module.exports = {
	name: 'log',
	//aliases: ['developer'],
	description: 'Logs the message in the console',
	//usage: '<bug/feature/request> <description>',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			console.log(msg);
		}
	},
};