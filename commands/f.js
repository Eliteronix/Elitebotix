const { DBGuilds } = require('../dbObjects');

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
		if(!(args[0])){
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
			});

			//check if guild is in db
			if (guild) {
				//check if salute is enabled
				if (guild.saluteEnabled) {
					msg.channel.send('o7');
				}
			} else {
				//Create guild dataset in db if not there yet
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, saluteEnabled: false });
			}
		}
	},
};