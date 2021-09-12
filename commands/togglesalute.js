const { DBGuilds } = require('../dbObjects');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'togglesalute',
	//aliases: ['developer'],
	description: 'Toggles the salute setting for the server (sends an o7 after a \'F\')',
	//usage: '<bug/feature/request> <description>',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
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
			//reverse salute and save dataset
			if (guild.saluteEnabled === true) {
				guild.saluteEnabled = false;
			} else {
				guild.saluteEnabled = true;
			}
			guild.save();

			//output change
			if (guild.saluteEnabled) {
				msg.reply('Salute has been enabled');
			} else {
				msg.reply('Salute has been disabled');
			}
		} else {
			//Create guild in db if it wasn't there yet and disable it by default
			DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, saluteEnabled: true });
			msg.reply('Salute has been activated');
		}
	},
};