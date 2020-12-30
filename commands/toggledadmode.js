const { Guilds } = require('../dbObjects');

module.exports = {
	name: 'toggledadmode',
	description: 'Toggles the Dadmode setting for the server', //test
	cooldown: 15,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			if (msg.author.id === '138273136285057025') { //Replace with Permission Manage Server
				const guild = await Guilds.findOne({
					where: { guildId: msg.guild.id },
				});

				if (guild) {
					guild.dadmodeEnabled = !(guild.dadmodeEnabled);
					guild.save();

					if(guild.dadmodeEnabled){
						msg.channel.send('Guild mode has been enabled');
					} else {
						msg.channel.send('Guild mode has been disabled');
					}
				} else {
					Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, dadmodeEnabled: false });
					msg.channel.send('Guild mode has been disabled');
				}
			} else {
				msg.channel.send('Insufficient permissions.');
			}
		}
	},
};