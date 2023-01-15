const { DBGuilds } = require('../dbObjects');
const { Permissions } = require('discord.js');
const { logDatabaseQueries } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');

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
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}
		logDatabaseQueries(4, 'commands/toggletickets.js DBGuilds');
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: interaction.guildId },
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
				interaction.editReply('Tickets have been enabled');
			} else {
				interaction.editReply('Tickets have been disabled');
			}
		} else {
			//Create guild in db if it wasn't there yet and disable it by default
			DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, ticketsEnabled: true });
			interaction.editReply('Tickets have been enabled');
		}
	},
};