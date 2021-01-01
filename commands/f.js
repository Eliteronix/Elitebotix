module.exports = {
	name: 'f',
	//aliases: ['developer'],
	description: 'Answers with o7',
	//usage: '<bug/feature/request> <description>',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (!(prefixCommand)) {
			msg.channel.send('o7');
		}
	},
};