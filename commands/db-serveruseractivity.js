const { DBServerUserActivity } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'db-serveruseractivity',
	//aliases: ['developer'],
	description: 'Sends all the ServerUserActivities found in the db',
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
		const ServerUserActivityList = await DBServerUserActivity.findAll();
		const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
		// eslint-disable-next-line no-undef
		eliteronixUser.send(`DBServerUserActivity - ${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

		for (let i = 0; i < ServerUserActivityList.length; i++) {
			// inside a command, event listener, etc.
			const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`DBServerUserActivity - ID: ${ServerUserActivityList[i].id}`)
				.addFields(
					{ name: 'id', value: ServerUserActivityList[i].id, inline: true },
					{ name: 'guildId', value: ServerUserActivityList[i].guildId, inline: true },
					{ name: 'userId', value: ServerUserActivityList[i].userId, inline: true },
					{ name: 'points', value: ServerUserActivityList[i].points, inline: true },
					{ name: 'paranoid', value: ServerUserActivityList[i].paranoid, inline: true },
					{ name: 'createdAt', value: ServerUserActivityList[i].createdAt },
					{ name: 'updatedAt', value: ServerUserActivityList[i].updatedAt },
				)
				.setTimestamp()
				// eslint-disable-next-line no-undef
				.setFooter(`${process.env.SERVER} Environment on ${process.env.PROVIDER}`);

			eliteronixUser.send(embed);
		}
	},
};