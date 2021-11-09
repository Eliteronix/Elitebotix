//Require discord.js module
const Discord = require('discord.js');
const { populateMsgFromInteraction } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'server-info',
	aliases: ['guild-info'],
	description: 'Sends an info card about the server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_MESSAGES',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);
			await interaction.reply('Server info card will be sent');
		}

		const guildInfoEmbed = new Discord.MessageEmbed()
			.setColor('#ffcc00')
			.setTitle(`${msg.guild.name}`)
			.addFields(
				{ name: 'Server Owner', value: `${msg.client.users.cache.find(user => user.id === `${msg.guild.ownerId}`)}` },
				{ name: 'Member count', value: `${msg.guild.memberCount}` },
				{ name: 'AFK Timeout', value: `${msg.guild.afkTimeout / 60} minutes` }
			)
			.setTimestamp();

		if (msg.guild.iconURL()) {
			guildInfoEmbed.setThumbnail(`${msg.guild.iconURL()}`);
		}

		if (msg.id) {
			return msg.reply({ embeds: [guildInfoEmbed] });
		}
		return interaction.followUp({ embeds: [guildInfoEmbed] });
	},
};