const { DBGuilds } = require('../dbObjects');
const { PermissionsBitField } = require('discord.js');
const { logDatabaseQueries } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'goodbye-message',
	description: 'Sends the specified message into the channel the user used the command in as soon as a member leaves.',
	permissions: [PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.SendMessages],
	permissionsTranslated: 'Send Messages and Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'server-admin',
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		logDatabaseQueries(4, 'commands/goodbye-message.js DBGuilds');
		const guild = await DBGuilds.findOne({
			where: { guildId: interaction.guildId },
		});

		if (interaction.options._subcommand === 'current') {
			if (!guild) {
				logDatabaseQueries(4, 'commands/goodbye-message.js DBGuilds current create');
				await DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, sendGoodbyeMessage: false });
				return interaction.editReply('There is currently no goodbye message set.');
			}

			if (!guild.sendGoodbyeMessage) {
				return interaction.editReply('There is currently no goodbye message set.');
			}

			return interaction.editReply(`The current goodbye message is set to channel <#${guild.goodbyeMessageChannel}>: \`${guild.goodbyeMessageText.replace(/`/g, '')}\``);

		} else if (interaction.options._subcommand === 'disable') {
			if (!guild) {
				logDatabaseQueries(4, 'commands/goodbye-message.js DBGuilds disable create');
				await DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, sendGoodbyeMessage: false });
				return interaction.editReply('There is currently no goodbye message set.');
			}

			if (!guild.sendGoodbyeMessage) {
				return interaction.editReply('There is currently no goodbye message set.');
			}

			guild.sendGoodbyeMessage = false;
			await guild.save();
			return interaction.editReply('Goodbye messages have been disabled for this server.');
		} else if (interaction.options._subcommand === 'set') {
			let message = interaction.options.getString('message');

			if (guild) {
				guild.sendGoodbyeMessage = true;
				guild.goodbyeMessageChannel = interaction.channelId;
				guild.goodbyeMessageText = message;
				await guild.save();
			} else {
				logDatabaseQueries(4, 'commands/goodbye-message.js DBGuilds set create');
				await DBGuilds.create({
					guildId: interaction.guildId,
					guildName: interaction.guild.name,
					sendGoodbyeMessage: true,
					goodbyeMessageChannel: interaction.channelId,
					goodbyeMessageText: message
				});
			}

			return interaction.editReply(`The new message \`${message.replace(/`/g, '')}\` has been set for leaving members in the channel \`${interaction.channel.name}\`.`);
		}
	},
};