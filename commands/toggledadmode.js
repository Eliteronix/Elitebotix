const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'toggledadmode',
	//aliases: ['developer'],
	description: 'Toggles the Dadmode setting for the server',
	//usage: '<bug/feature/request> <description>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
			});

			//Check if guild exists in db
			if (guild) {
				//reverse dadmode and save dataset
				guild.dadmodeEnabled = !(guild.dadmodeEnabled);
				guild.save();

				//output change
				if (guild.dadmodeEnabled) {
					msg.channel.send('Dadmode has been enabled');
				} else {
					msg.channel.send('Dadmode has been disabled');
				}
			} else {
				//Create guild in db if it wasn't there yet and disable it by default
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, dadmodeEnabled: false });
				msg.channel.send('Dadmode has been disabled');
			}
		}
	},
};