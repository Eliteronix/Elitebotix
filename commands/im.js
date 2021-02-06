const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'im',
	aliases: ['i\'m'],
	description: 'Answers with the dadmode',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 2,
	noCooldownMessage: true,
	tags: 'hidden-general',
	//prefixCommand: true,
	async execute(msg, args) {
		if (args[0]) {
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
			});

			//check if guild is in db
			if (guild) {
				//check if dadmode is enabled
				if (guild.dadmodeEnabled) {
					//Send dad answer
					const userMessage = args.join(' ');
					msg.channel.send(`Hi ${userMessage}, I'm dad!`);
				}
			} else {
				//Create guild dataset in db if not there yet
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, dadmodeEnabled: true });
				//Send dad answer
				const userMessage = args.join(' ');
				msg.channel.send(`Hi ${userMessage}, I'm dad!`);
			}
		}
	},
};