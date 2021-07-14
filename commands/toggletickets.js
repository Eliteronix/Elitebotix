const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'toggletickets',
	//aliases: ['developer'],
	description: 'Toggles the tickets setting for the server',
	//usage: '<bug/feature/request> <description>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	botPermissions: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
	botPermissionsTranslated: 'Manage Channels and Manage Roles',
	guildOnly: true,
	// args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guild.id },
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
				msg.channel.send('Tickets have been enabled');
			} else {
				msg.channel.send('Tickets have been disabled');
			}
		} else {
			//Create guild in db if it wasn't there yet and disable it by default
			DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, ticketsEnabled: true });
			msg.channel.send('Tickets have been enabled');
		}
	},
};