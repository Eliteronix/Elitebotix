const { DBAutoRoles } = require('../dbObjects');
const Discord = require('discord.js');
const ObjectsToCsv = require('objects-to-csv');

module.exports = {
	name: 'db-autoroles',
	//aliases: ['developer'],
	description: 'Sends all the AutoRoles found in the db',
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
		const autoRoleList = await DBAutoRoles.findAll();
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');

		const csv = new ObjectsToCsv(autoRoleList);
		console.log(csv);
		// eslint-disable-next-line no-undef
		eliteronixUser.send(`DBAutoRoles - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`, csv);

		for (let i = 0; i < autoRoleList.length; i++) {
			// inside a command, event listener, etc.
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`DBAutoRoles - ID: ${autoRoleList[i].id}`)
				.addFields(
					{ name: 'id', value: autoRoleList[i].id, inline: true },
					{ name: 'guildId', value: autoRoleList[i].guildId, inline: true },
					{ name: 'roleId', value: autoRoleList[i].roleId, inline: true },
					{ name: 'paranoid', value: autoRoleList[i].paranoid, inline: true },
					{ name: 'createdAt', value: autoRoleList[i].createdAt },
					{ name: 'updatedAt', value: autoRoleList[i].updatedAt },
				)
				.setTimestamp()
				// eslint-disable-next-line no-undef
				.setFooter(`${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

			eliteronixUser.send(embed);
			
		}
	},
};