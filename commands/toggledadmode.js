const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'toggledadmode',
	//aliases: ['developer'],
	description: 'Toggles the Dadmode setting for the server',
	//usage: '<bug/feature/request> <description>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId },
		});

		//Check if guild exists in db
		if (guild) {
			//reverse dadmode and save dataset
			if (guild.dadmodeEnabled === true) {
				guild.dadmodeEnabled = false;
			} else {
				guild.dadmodeEnabled = true;
			}
			guild.save();

			//output change
			if (guild.dadmodeEnabled) {
				msg.reply('Dadmode has been enabled');
			} else {
				msg.reply('Dadmode has been disabled');
			}
		} else {
			//Create guild in db if it wasn't there yet and disable it by default
			DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, dadmodeEnabled: true });
			msg.reply('Dadmode has been activated');
		}
	},
};