module.exports = {
	name: 'args-info',
	//aliases: ['developer'],
	description: 'Shows your arguments',
	//usage: '<bug/feature/request> <description>',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			msg.channel.send(`Command name: args-info\nArguments: ${args}`);
		}
	},
};