//Require discord.js module
const Discord = require('discord.js');
const { populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'server-info',
	aliases: ['guild-info'],
	description: 'Sends an info card about the server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_MESSAGES',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(additionalObjects[0], interaction);
			await additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
				data: {
					type: 4,
					data: {
						content: 'Server info card will be sent'
					}
				}
			});
		}

		const guildInfoEmbed = new Discord.MessageEmbed()
			.setColor('#ffcc00')
			.setTitle(`${msg.guild.name}`)
			.addFields(
				{ name: 'Server Owner', value: `${msg.client.users.cache.find(user => user.id === `${msg.guild.ownerID}`)}` },
				{ name: 'Region', value: `${msg.guild.region}` },
				{ name: 'Member count', value: `${msg.guild.memberCount}` },
				{ name: 'AFK Timeout', value: `${msg.guild.afkTimeout / 60} minutes` }
			)
			.setTimestamp();

		if (msg.guild.iconURL()) {
			guildInfoEmbed.setThumbnail(`${msg.guild.iconURL()}`);
		}

		msg.channel.send(guildInfoEmbed);
	},
};