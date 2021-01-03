const { Guilds } = require('../dbObjects');

module.exports = {
	name: 'toggledadmode',
	//aliases: ['developer'],
	description: 'Toggles the Dadmode setting for the server',
	//usage: '<bug/feature/request> <description>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			const guild = await Guilds.findOne({
				where: { guildId: msg.guild.id },
			});

			if (guild) {
				guild.dadmodeEnabled = !(guild.dadmodeEnabled);
				guild.save();

				if (guild.dadmodeEnabled) {
					msg.channel.send('Dadmode has been enabled');
				} else {
					msg.channel.send('Dadmode has been disabled');
				}
			} else {
				Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, dadmodeEnabled: false });
				msg.channel.send('Dadmode has been disabled');
			}
		}
	},
};