const { DBGuilds } = require('../dbObjects');
const { Permissions } = require('discord.js');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'toggletickets',
	description: 'Toggles the tickets setting for the server',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.MANAGE_ROLES],
	botPermissionsTranslated: 'Manage Channels and Manage Roles',
	cooldown: 5,
	tags: 'server-admin',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		logDatabaseQueries(4, 'commands/toggletickets.js DBGuilds');
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId },
		});

		//Check if guild exists in db
		if (guild) {
			//reverse dadmode and save dataset
			if (guild.ticketsEnabled === true) {
				guild.ticketsEnabled = false;
			} else {
				guild.ticketsEnabled = true;
			}
			guild.save();

			//output change
			if (guild.ticketsEnabled) {
				msg.reply('Tickets have been enabled');
			} else {
				msg.reply('Tickets have been disabled');
			}
		} else {
			//Create guild in db if it wasn't there yet and disable it by default
			DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, ticketsEnabled: true });
			msg.reply('Tickets have been enabled');
		}
	},
};