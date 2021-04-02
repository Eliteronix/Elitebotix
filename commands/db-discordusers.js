const { DBDiscordUsers } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'db-discordusers',
	//aliases: ['developer'],
	description: 'Sends all the DiscordUsers found in the db',
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
		const discordUsersList = await DBDiscordUsers.findAll();
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		// eslint-disable-next-line no-undef
		eliteronixUser.send(`DBDiscordUsers - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

		for (let i = 0; i < discordUsersList.length; i++) {
			// inside a command, event listener, etc.
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`DBDiscordUsers - ID: ${discordUsersList[i].id}`)
				.addFields(
					{ name: 'id', value: discordUsersList[i].id, inline: true },
					{ name: 'userId', value: discordUsersList[i].userId, inline: true },
					{ name: 'osuUserId', value: discordUsersList[i].osuUserId, inline: true },
					{ name: 'osuVerificationCode', value: discordUsersList[i].osuVerificationCode, inline: true },
					{ name: 'osuVerified', value: discordUsersList[i].osuVerified, inline: true },
					{ name: 'osuName', value: discordUsersList[i].osuName, inline: true },
					{ name: 'osuPP', value: discordUsersList[i].osuPP, inline: true },
					{ name: 'osuRank', value: discordUsersList[i].osuRank, inline: true },
					{ name: 'taikoPP', value: discordUsersList[i].taikoPP, inline: true },
					{ name: 'taikoRank', value: discordUsersList[i].taikoRank, inline: true },
					{ name: 'catchPP', value: discordUsersList[i].catchPP, inline: true },
					{ name: 'catchRank', value: discordUsersList[i].catchRank, inline: true },
					{ name: 'maniaPP', value: discordUsersList[i].maniaPP, inline: true },
					{ name: 'maniaRank', value: discordUsersList[i].maniaRank, inline: true },
					{ name: 'osuMainServer', value: discordUsersList[i].osuMainServer, inline: true },
					{ name: 'osuMainMode', value: discordUsersList[i].osuMainMode, inline: true },
					{ name: 'paranoid', value: discordUsersList[i].paranoid, inline: true },
					{ name: 'createdAt', value: discordUsersList[i].createdAt },
					{ name: 'updatedAt', value: discordUsersList[i].updatedAt },
				)
				.setTimestamp()
				// eslint-disable-next-line no-undef
				.setFooter(`${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

			eliteronixUser.send(embed);
		}
	},
};