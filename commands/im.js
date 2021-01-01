const { Guilds } = require('../dbObjects');

module.exports = {
	name: 'im',
	aliases: ['i\'m'],
	description: 'Answers with the dadmode',
	//usage: '<bug/feature/request> <description>',
	//guildOnly: true,
	//args: true,
	cooldown: 2,
	noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (!(prefixCommand)) {
			if (args[0]) {
				const guild = await Guilds.findOne({
					where: { guildId: msg.guild.id },
				});

				if (guild) {
					if (guild.dadmodeEnabled) {
						const userMessage = args.join(' ');
						msg.channel.send(`Hi ${userMessage}, I'm dad!`);
					}
				} else {
					Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, dadmodeEnabled: true });
					const userMessage = args.join(' ');
					msg.channel.send(`Hi ${userMessage}, I'm dad!`);
				}
			}
		}
	},
};