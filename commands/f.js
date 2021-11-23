const { DBGuilds } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'f',
	//aliases: ['developer'],
	description: 'Answers with o7',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'hidden-general',
	//prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (!(args[0])) {
			//get guild from db
			logDatabaseQueries(4, 'commands/f.js DBGuilds');
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//check if guild is in db
			if (guild) {
				//check if salute is enabled
				if (guild.saluteEnabled) {
					msg.reply('o7');
				}
			} else {
				//Create guild dataset in db if not there yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, saluteEnabled: false });
			}
		}
	},
};