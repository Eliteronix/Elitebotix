//Require discord.js module
const Discord = require('discord.js');

module.exports = {
	name: 'creator',
	aliases: ['developer'],
	description: 'Sends an info card about the developer',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	execute(msg, args) {
		//Create new embed
		const creatorInfoEmbed = new Discord.MessageEmbed()
			.setColor('#0492C2')
			.setTitle('Creator info card')
			.setThumbnail(`${msg.client.users.cache.find(user => user.id === '138273136285057025').avatarURL()}`)
			.addFields(
				{ name: 'Discord', value: 'Eliteronix#4208' },
				{ name: 'Github', value: 'Eliteronix' },
				{ name: 'Twitter', value: '@Eliteronix' }
			)
			.setTimestamp();

		msg.channel.send(creatorInfoEmbed);
	},
};