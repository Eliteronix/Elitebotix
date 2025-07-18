const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'server-info',
	description: 'Sends an info card about the server',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('server-info')
		.setNameLocalizations({
			'de': 'server-info',
			'en-GB': 'server-info',
			'en-US': 'server-info',
		})
		.setDescription('Sends an info card about the server')
		.setDescriptionLocalizations({
			'de': 'Sende eine Info-Karte über den Server',
			'en-GB': 'Sends an info card about the server',
			'en-US': 'Sends an info card about the server',
		})
		.setDMPermission(false),
	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		const guildInfoEmbed = new Discord.EmbedBuilder()
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

		return await interaction.editReply({ embeds: [guildInfoEmbed] });
	},
};