const { DBGuilds } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'db-guilds',
	//aliases: ['developer'],
	description: 'Sends all the guilds found in the db',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		const guildList = await DBGuilds.findAll();
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		// eslint-disable-next-line no-undef
		eliteronixUser.send(`DBGuilds - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

		for (let i = 0; i < guildList.length; i++) {
			// inside a command, event listener, etc.
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`DBGuilds - ID: ${guildList[i].id}`)
				.addFields(
					{ name: 'id', value: guildList[i].id, inline: true },
					{ name: 'guildId', value: guildList[i].guildId, inline: true },
					{ name: 'guildName', value: guildList[i].guildName, inline: true },
					{ name: 'customPrefixUsed', value: guildList[i].customPrefixUsed, inline: true },
					{ name: 'customPrefix', value: guildList[i].customPrefix, inline: true },
					{ name: 'dadmodeEnabled', value: guildList[i].dadmodeEnabled, inline: true },
					{ name: 'sendWelcomeMessage', value: guildList[i].sendWelcomeMessage, inline: true },
					{ name: 'welcomeMessageChannel', value: guildList[i].welcomeMessageChannel, inline: true },
					{ name: 'welcomeMessageText', value: guildList[i].welcomeMessageText, inline: true },
					{ name: 'sendGoodbyeMessage', value: guildList[i].sendGoodbyeMessage, inline: true },
					{ name: 'goodbyeMessageChannel', value: guildList[i].goodbyeMessageChannel, inline: true },
					{ name: 'goodbyeMessageText', value: guildList[i].goodbyeMessageText, inline: true },
					{ name: 'temporaryVoices', value: guildList[i].temporaryVoices, inline: true },
					{ name: 'addTemporaryText', value: guildList[i].addTemporaryText, inline: true },
					{ name: 'paranoid', value: guildList[i].paranoid, inline: true },
					{ name: 'createdAt', value: guildList[i].createdAt },
					{ name: 'updatedAt', value: guildList[i].updatedAt },
				)
				.setTimestamp()
				// eslint-disable-next-line no-undef
				.setFooter(`${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

			eliteronixUser.send(embed);
		}
	},
};