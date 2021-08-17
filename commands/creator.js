//Require discord.js module
const Discord = require('discord.js');

module.exports = {
	name: 'creator',
	aliases: ['developer', 'donate', 'support'],
	description: 'Sends an info card about the developer',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		const eliteronixUser = await additionalObjects[0].users.fetch('138273136285057025');

		//Create new embed
		const creatorInfoEmbed = new Discord.MessageEmbed()
			.setColor('#0492C2')
			.setTitle('Developer info card')
			.setDescription('I\'m currently working on this bot on my own.\nFeel free to support me using the links below.')
			.setThumbnail(`${eliteronixUser.avatarURL()}`)
			.addFields(
				{ name: 'Discord', value: '[Eliteronix#4208](https://discord.com/invite/Asz5Gfe)' },
				{ name: 'Github', value: '[Eliteronix](https://github.com/Eliteronix)' },
				{ name: 'Twitter', value: '[@Eliteronix](https://twitter.com/Eliteronix)' },
				{ name: 'Paypal', value: '[paypal.me/Eliteronix](https://paypal.me/Eliteronix)' },
				{ name: 'Twitch', value: '[Eliteronix](https://twitch.tv/Eliteronix)' }
			)
			.setTimestamp();

		if (msg) {
			return msg.channel.send({ embeds: [creatorInfoEmbed] });
		}

		await interaction.reply('Creator Embed is being sent');
		return interaction.channel.send({ embeds: [creatorInfoEmbed] });
	},
};