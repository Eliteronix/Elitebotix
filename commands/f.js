module.exports = {
	name: 'f',
	description: 'Answers with o7',
	cooldown: 5,
	noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (!(prefixCommand)) {
			msg.channel.send('o7');
		}
	},
};