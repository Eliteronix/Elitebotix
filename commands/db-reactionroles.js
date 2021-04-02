const { DBReactionRoles } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'db-reactionroles',
	//aliases: ['developer'],
	description: 'Sends all the ReactionRoles found in the db',
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
		const DBReactionRolesList = await DBReactionRoles.findAll();
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		// eslint-disable-next-line no-undef
		eliteronixUser.send(`DBReactionRoles - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

		for (let i = 0; i < DBReactionRolesList.length; i++) {
			// inside a command, event listener, etc.
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`DBReactionRoles - ID: ${DBReactionRolesList[i].id}`)
				.addFields(
					{ name: 'id', value: DBReactionRolesList[i].id, inline: true },
					{ name: 'dbReactionRolesHeaderId', value: DBReactionRolesList[i].dbReactionRolesHeaderId, inline: true },
					{ name: 'roleId', value: DBReactionRolesList[i].roleId, inline: true },
					{ name: 'emoji', value: DBReactionRolesList[i].emoji, inline: true },
					{ name: 'description', value: DBReactionRolesList[i].description, inline: true },
					{ name: 'paranoid', value: DBReactionRolesList[i].paranoid, inline: true },
					{ name: 'createdAt', value: DBReactionRolesList[i].createdAt },
					{ name: 'updatedAt', value: DBReactionRolesList[i].updatedAt },
				)
				.setTimestamp()
				// eslint-disable-next-line no-undef
				.setFooter(`${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

			eliteronixUser.send(embed);
		}
	},
};