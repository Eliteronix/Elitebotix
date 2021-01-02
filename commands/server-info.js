//Require discord.js module
const Discord = require('discord.js');

module.exports = {
	name: 'server-info',
	//aliases: ['developer'],
	description: 'Sends an info card about the server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_MESSAGES',
	//permissionsTranslated: 'Manage Server',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			// inside a command, event listener, etc.
			const guildInfoEmbed = new Discord.MessageEmbed()
				.setColor('#ffcc00')
				.setTitle(`${msg.guild.name}`)
				.setThumbnail(`${msg.guild.iconURL()}`)
				.addFields(
					{ name: 'Server Owner', value: `${msg.client.users.cache.find(user => user.id === `${msg.guild.ownerID}`)}`},
					{ name: 'Region', value: `${msg.guild.region}` },
					{ name: 'Member count', value: `${msg.guild.memberCount}` },
					{ name: 'AFK Timeout', value: `${msg.guild.afkTimeout/60} minutes`}
				)
				.setTimestamp();

			msg.channel.send(guildInfoEmbed);
		}
	},
};