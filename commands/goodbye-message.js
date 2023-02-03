const { DBGuilds } = require('../dbObjects');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
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
	data: new SlashCommandBuilder()
		.setName('goodbye-message')
		.setNameLocalizations({
			'de': 'abschiedsnachricht',
			'en-GB': 'goodbye-message',
			'en-US': 'goodbye-message',
		})
		.setDescription('Lets you set up a message to be sent when someone leaves the server')
		.setDescriptionLocalizations({
			'de': 'Ermöglicht es dir, eine Nachricht zu erstellen, die gesendet wird, wenn jemand den Server verlässt',
			'en-GB': 'Lets you set up a message to be sent when someone leaves the server',
			'en-US': 'Lets you set up a message to be sent when someone leaves the server',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand
				.setName('current')
				.setNameLocalizations({
					'de': 'aktuell',
					'en-GB': 'current',
					'en-US': 'current',
				})
				.setDescription('Shows the current goodbye-message')
				.setDescriptionLocalizations({
					'de': 'Zeigt die aktuelle Abschiedsnachricht an',
					'en-GB': 'Shows the current goodbye-message',
					'en-US': 'Shows the current goodbye-message',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disable')
				.setNameLocalizations({
					'de': 'deaktivieren',
					'en-GB': 'disable',
					'en-US': 'disable',
				})
				.setDescription('Disables goodbye-messages')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert Abschiedsnachrichten',
					'en-GB': 'Disables goodbye-messages',
					'en-US': 'Disables goodbye-messages',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('set')
				.setNameLocalizations({
					'de': 'setzen',
					'en-GB': 'set',
					'en-US': 'set',
				})
				.setDescription('Allows you to set a new goodbye-message in the current channel')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht es dir, eine neue Abschiedsnachricht im aktuellen Kanal zu erstellen',
					'en-GB': 'Allows you to set a new goodbye-message in the current channel',
					'en-US': 'Allows you to set a new goodbye-message in the current channel',
				})
				.addStringOption(option =>
					option
						.setName('message')
						.setNameLocalizations({
							'de': 'nachricht',
							'en-GB': 'message',
							'en-US': 'message',
						})
						.setDescription('The message to be sent (use "@member" to mention the member)')
						.setDescriptionLocalizations({
							'de': 'Die Nachricht, die gesendet werden soll (verwende "@member", um den Member zu erwähnen)',
							'en-GB': 'The message to be sent (use "@member" to mention the member)',
							'en-US': 'The message to be sent (use "@member" to mention the member)',
						})
						.setRequired(true)
				)
		),
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

		if (interaction.options.getSubcommand() === 'current') {
			if (!guild) {
				logDatabaseQueries(4, 'commands/goodbye-message.js DBGuilds current create');
				await DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, sendGoodbyeMessage: false });
				return interaction.editReply('There is currently no goodbye message set.');
			}

			if (!guild.sendGoodbyeMessage) {
				return interaction.editReply('There is currently no goodbye message set.');
			}

			return interaction.editReply(`The current goodbye message is set to channel <#${guild.goodbyeMessageChannel}>: \`${guild.goodbyeMessageText.replace(/`/g, '')}\``);

		} else if (interaction.options.getSubcommand() === 'disable') {
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
		} else if (interaction.options.getSubcommand() === 'set') {
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