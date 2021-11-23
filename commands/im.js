const { DBGuilds } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'im',
	aliases: ['i\'m'],
	description: 'Answers with the dadmode',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	//args: true,
	cooldown: 2,
	noCooldownMessage: true,
	tags: 'hidden-general',
	//prefixCommand: true,
	async execute(msg, args) {
		if (args[0]) {
			//get guild from db
			logDatabaseQueries(4, 'commands/im.js DBGuilds');
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//check if guild is in db
			if (guild) {
				//check if dadmode is enabled
				if (guild.dadmodeEnabled) {
					//Send dad answer
					const userMessage = args.join(' ');
					msg.reply(`Hi \`${userMessage.replace(/`/g, '')}\`, I'm dad!`);
				}
			} else {
				//Create guild dataset in db if not there yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, dadmodeEnabled: false });
			}
		}
	},
};