const { DBTemporaryVoices } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'db-temporaryvoices',
	//aliases: ['developer'],
	description: 'Sends all the TemporaryVoices found in the db',
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
		const TemporaryVoicesList = await DBTemporaryVoices.findAll();
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		// eslint-disable-next-line no-undef
		eliteronixUser.send(`DBTemporaryVoices - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

		for (let i = 0; i < TemporaryVoicesList.length; i++) {
			// inside a command, event listener, etc.
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`DBTemporaryVoices - ID: ${TemporaryVoicesList[i].id}`)
				.addFields(
					{ name: 'id', value: TemporaryVoicesList[i].id, inline: true },
					{ name: 'guildId', value: TemporaryVoicesList[i].guildId, inline: true },
					{ name: 'channelId', value: TemporaryVoicesList[i].channelId, inline: true },
					{ name: 'textChannelId', value: TemporaryVoicesList[i].textChannelId, inline: true },
					{ name: 'creatorId', value: TemporaryVoicesList[i].creatorId, inline: true },
					{ name: 'paranoid', value: TemporaryVoicesList[i].paranoid, inline: true },
					{ name: 'createdAt', value: TemporaryVoicesList[i].createdAt },
					{ name: 'updatedAt', value: TemporaryVoicesList[i].updatedAt },
				)
				.setTimestamp()
				// eslint-disable-next-line no-undef
				.setFooter(`${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

			eliteronixUser.send(embed);
		}
	},
};
