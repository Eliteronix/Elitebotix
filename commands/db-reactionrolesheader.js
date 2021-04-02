const { DBReactionRolesHeader } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'db-reactionrolesheader',
	//aliases: ['developer'],
	description: 'Sends all the ReactionRolesHeaders found in the db',
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
		const DBReactionRolesHeadersList = await DBReactionRolesHeader.findAll();
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		// eslint-disable-next-line no-undef
		eliteronixUser.send(`DBReactionRolesHeader - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

		for (let i = 0; i < DBReactionRolesHeadersList.length; i++) {
			// inside a command, event listener, etc.
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`DBReactionRolesHeader - ID: ${DBReactionRolesHeadersList[i].id}`)
				.addFields(
					{ name: 'id', value: DBReactionRolesHeadersList[i].id, inline: true },
					{ name: 'guildId', value: DBReactionRolesHeadersList[i].guildId, inline: true },
					{ name: 'reactionHeaderId', value: DBReactionRolesHeadersList[i].reactionHeaderId, inline: true },
					{ name: 'reactionChannelHeaderId', value: DBReactionRolesHeadersList[i].reactionChannelHeaderId, inline: true },
					{ name: 'reactionTitle', value: DBReactionRolesHeadersList[i].reactionTitle, inline: true },
					{ name: 'reactionColor', value: DBReactionRolesHeadersList[i].reactionColor, inline: true },
					{ name: 'reactionDescription', value: DBReactionRolesHeadersList[i].reactionDescription, inline: true },
					{ name: 'reactionImage', value: DBReactionRolesHeadersList[i].reactionImage, inline: true },
					{ name: 'paranoid', value: DBReactionRolesHeadersList[i].paranoid, inline: true },
					{ name: 'createdAt', value: DBReactionRolesHeadersList[i].createdAt },
					{ name: 'updatedAt', value: DBReactionRolesHeadersList[i].updatedAt },
				)
				.setTimestamp()
				// eslint-disable-next-line no-undef
				.setFooter(`${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

			eliteronixUser.send(embed);
		}
	},
};