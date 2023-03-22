const { DBGuilds } = require('../dbObjects');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { logDatabaseQueries } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'welcome-message',
	description: 'Sends the specified message into the channel the user used the command in as soon as a new member arrives.',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('welcome-message')
		.setNameLocalizations({
			'de': 'willkommensnachricht',
			'en-GB': 'welcome-message',
			'en-US': 'welcome-message',
		})
		.setDescription('Lets you set up a message to be sent when someone joins the server')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir eine Willkommensnachricht für neue Mitglieder zu setzen',
			'en-GB': 'Lets you set up a message to be sent when someone joins the server',
			'en-US': 'Lets you set up a message to be sent when someone joins the server',
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
				.setDescription('Shows the current welcome-message')
				.setDescriptionLocalizations({
					'de': 'Zeigt die aktuelle Willkommensnachricht an',
					'en-GB': 'Shows the current welcome-message',
					'en-US': 'Shows the current welcome-message',
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
				.setDescription('Disables welcome-messages')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert Willkommensnachrichten',
					'en-GB': 'Disables welcome-messages',
					'en-US': 'Disables welcome-messages',
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
				.setDescription('Allows you to set a new welcome-message in the current channel')
				.setDescriptionLocalizations({
					'de': 'Erlaubt es dir eine neue Willkommensnachricht in diesem Kanal zu setzen',
					'en-GB': 'Allows you to set a new welcome-message in the current channel',
					'en-US': 'Allows you to set a new welcome-message in the current channel',
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
							'de': 'Die Nachricht die gesendet werden soll (Benutze "@member" um das Mitglied zu erwähnen)',
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
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		//TODO: add attributes and logdatabasequeries
		logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds');
		const guild = await DBGuilds.findOne({
			where: { guildId: interaction.guildId },
		});

		if (interaction.options.getSubcommand() === 'current') {
			if (!guild) {
				logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds current create');
				await DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, sendWelcomeMessage: false });
				return interaction.editReply('There is currently no welcome message set.');
			}

			if (!guild.sendWelcomeMessage) {
				return interaction.editReply('There is currently no welcome message set.');
			}

			return interaction.editReply(`The current welcome message is set to channel <#${guild.welcomeMessageChannel}>: \`${guild.welcomeMessageText.replace(/`/g, '')}\``);

		} else if (interaction.options.getSubcommand() === 'disable') {
			if (!guild) {
				logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds disable create');
				await DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, sendWelcomeMessage: false });
				return interaction.editReply('There is currently no welcome message set.');
			}

			if (!guild.sendWelcomeMessage) {
				return interaction.editReply('There is currently no welcome message set.');
			}

			guild.sendWelcomeMessage = false;
			await guild.save();
			return interaction.editReply('Welcome messages have been disabled for this server.');
		} else if (interaction.options.getSubcommand() === 'set') {
			let message = interaction.options.getString('message');

			if (guild) {
				guild.sendWelcomeMessage = true;
				guild.welcomeMessageChannel = interaction.channelId;
				guild.welcomeMessageText = message;
				await guild.save();
			} else {
				logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds set create');
				await DBGuilds.create({
					guildId: interaction.guildId,
					guildName: interaction.guild.name,
					sendWelcomeMessage: true,
					welcomeMessageChannel: interaction.channelId,
					welcomeMessageText: message
				});
			}

			return interaction.editReply(`The new message \`${message.replace(/`/g, '')}\` has been set for welcoming new members in the channel \`${interaction.channel.name}\`.`);
		}
	},
};