//Require discord.js module
const Discord = require('discord.js');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'server-info',
	description: 'Sends an info card about the server',
	//permissions: 'MANAGE_MESSAGES',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'general',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		const guildInfoEmbed = new Discord.MessageEmbed()
			.setColor('#ffcc00')
			.setTitle(`${interaction.guild.name}`)
			.addFields(
				{ name: 'Server Owner', value: `${interaction.client.users.cache.find(user => user.id === `${interaction.guild.ownerId}`)}` },
				{ name: 'Member count', value: `${interaction.guild.memberCount}` },
				{ name: 'AFK Timeout', value: `${interaction.guild.afkTimeout / 60} minutes` }
			)
			.setTimestamp();

		if (interaction.guild.iconURL()) {
			guildInfoEmbed.setThumbnail(`${interaction.guild.iconURL()}`);
		}

		return interaction.editReply({ embeds: [guildInfoEmbed] });
	},
};