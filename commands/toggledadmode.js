const { Guilds } = require('../dbObjects');

module.exports = {
	name: 'toggledadmode',
	description: 'Toggles the Dadmode setting for the server', //test
	cooldown: 5,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			if (msg.member.hasPermission('MANAGE_GUILD')) {
				const guild = await Guilds.findOne({
					where: { guildId: msg.guild.id },
				});

				if (guild) {
					guild.dadmodeEnabled = !(guild.dadmodeEnabled);
					guild.save();

					if(guild.dadmodeEnabled){
						msg.channel.send('Dadmode has been enabled');
					} else {
						msg.channel.send('Dadmode has been disabled');
					}
				} else {
					Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, dadmodeEnabled: false });
					msg.channel.send('Dadmode has been disabled');
				}
			} else {
				msg.channel.send('You need the "Manage Server" permission.');
			}
		}
	},
};