module.exports = {
	name: 'args-info',
	description: 'Shows your arguments',
	args: true,
	cooldown: 5,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			msg.channel.send(`Command name: args-info\nArguments: ${args}`);
		}
	},
};