module.exports = {
	name: 'im',
	aliases: ['i\'m'],
	description: 'Answers with the dadmode',
	cooldown: 2,
	noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (!(prefixCommand)) {
			if (args[0]) {
				const userMessage = args.join(' ');
				msg.channel.send(`Hi ${userMessage}, I'm dad!`);
			}
		}
	},
};