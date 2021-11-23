const { DBGuilds } = require('../dbObjects');
const { Permissions } = require('discord.js');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'toggleowo',
	//aliases: ['developer'],
	description: 'Toggles the owo setting for the server (sends an owo after another owo/uwu)',
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
		logDatabaseQueries(4, 'commands/toggleowo.js DBGuilds');
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId },
		});

		//Check if guild exists in db
		if (guild) {
			//reverse owo and save dataset
			if (guild.owoEnabled === true) {
				guild.owoEnabled = false;
			} else {
				guild.owoEnabled = true;
			}
			guild.save();

			//output change
			if (guild.owoEnabled) {
				msg.reply('owo has been enabled');
			} else {
				msg.reply('owo has been disabled');
			}
		} else {
			//Create guild in db if it wasn't there yet and disable it by default
			DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, owoEnabled: true });
			msg.reply('owo has been activated');
		}
	},
};