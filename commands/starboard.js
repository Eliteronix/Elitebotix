const { DBGuilds } = require('../dbObjects');
const { PermissionsBitField, SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'starboard',
	description: 'Sends the messages receiving a star into the specified channel.',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('starboard')
		.setNameLocalizations({
			'de': 'starboard',
			'en-GB': 'starboard',
			'en-US': 'starboard',
		})
		.setDescription('Sends the messages receiving a star into the specified channel.')
		.setDescriptionLocalizations({
			'de': 'Sendet die Nachrichten, die einen Stern erhalten, in den angegebenen Kanal.',
			'en-GB': 'Sends the messages receiving a star into the specified channel.',
			'en-US': 'Sends the messages receiving a star into the specified channel.',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand.setName('enable')
				.setNameLocalizations({
					'de': 'aktivieren',
					'en-GB': 'enable',
					'en-US': 'enable',
				})
				.setDescription('Enable the starboard for the server')
				.setDescriptionLocalizations({
					'de': 'Aktiviert das Starboard für den Server',
					'en-GB': 'Enable the starboard for the server',
					'en-US': 'Enable the starboard for the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand.setName('disable')
				.setNameLocalizations({
					'de': 'deaktivieren',
					'en-GB': 'disable',
					'en-US': 'disable',
				})
				.setDescription('Disable the starboard for the server')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert das Starboard für den Server',
					'en-GB': 'Disable the starboard for the server',
					'en-US': 'Disable the starboard for the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand.setName('channel')
				.setNameLocalizations({
					'de': 'kanal',
					'en-GB': 'channel',
					'en-US': 'channel',
				})
				.setDescription('Set the starboard channel where starred messages get sent to')
				.setDescriptionLocalizations({
					'de': 'Setzt den Kanal, in den die Nachrichten gesendet werden, die einen Stern erhalten',
					'en-GB': 'Set the starboard channel where starred messages get sent to',
					'en-US': 'Set the starboard channel where starred messages get sent to',
				})
				.addChannelOption(option =>
					option.setName('channel')
						.setNameLocalizations({
							'de': 'kanal',
							'en-GB': 'channel',
							'en-US': 'channel',
						})
						.setDescription('The channel to send messages to')
						.setDescriptionLocalizations({
							'de': 'Der Kanal, in den die Nachrichten gesendet werden',
							'en-GB': 'The channel to send messages to',
							'en-US': 'The channel to send messages to',
						})
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName('minimum')
				.setNameLocalizations({
					'de': 'minimum',
					'en-GB': 'minimum',
					'en-US': 'minimum',
				})
				.setDescription('Set the minimum amount of stars needed to highlight')
				.setDescriptionLocalizations({
					'de': 'Setzt die Anzahl der Sterne, die benötigt werden, um hervorgehoben zu werden',
					'en-GB': 'Set the minimum amount of stars needed to highlight',
					'en-US': 'Set the minimum amount of stars needed to highlight',
				})
				.addIntegerOption(option =>
					option.setName('amount')
						.setNameLocalizations({
							'de': 'anzahl',
							'en-GB': 'amount',
							'en-US': 'amount',
						})
						.setDescription('The minimum amount of stars needed')
						.setDescriptionLocalizations({
							'de': 'Die Anzahl der Sterne, die benötigt werden',
							'en-GB': 'The minimum amount of stars needed',
							'en-US': 'The minimum amount of stars needed',
						})
						.setRequired(true)
						.setMinValue(1)
				)
		),
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

		const guild = await DBGuilds.findOne({
			attributes: ['id', 'starBoardEnabled', 'starBoardChannel', 'starBoardMinimum'],
			where: {
				guildId: interaction.guildId
			}
		});

		if (interaction.options.getSubcommand() === 'enable') {
			if (guild) {
				if (guild.starBoardEnabled) {
					return await interaction.editReply(`The starboard is already enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
				}

				if (!guild.starBoardMinimum) {
					guild.starBoardMinimum = 3;
				}

				if (!guild.starBoardChannel) {
					guild.starBoardChannel = interaction.channelId;
				}

				guild.starBoardEnabled = true;
				guild.save();

				return await interaction.editReply(`The starboard has been enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
			}

			DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, starBoardEnabled: true, starBoardMinimum: 3, starBoardChannel: interaction.channelId });

			return await interaction.editReply(`The starboard has been enabled on this server for channel <#${interaction.channelId}> with a minimum requirement of 3 stars.`);
		} else if (interaction.options.getSubcommand() === 'disable') {
			if (guild && guild.starBoardEnabled) {
				guild.starBoardEnabled = false;
				guild.save();

				return await interaction.editReply('The starboard is has been disabled on this server.');
			}

			return await interaction.editReply('The starboard is not enabled on this server.');
		} else if (interaction.options.getSubcommand() === 'channel') {
			if (guild) {
				guild.starBoardEnabled = true;

				if (!guild.starBoardMinimum) {
					guild.starBoardMinimum = 3;
				}

				guild.starBoardChannel = interaction.options.getChannel('channel').id;
				guild.save();

				return await interaction.editReply(`The starboard has been enabled on this server for channel <#${interaction.options.getChannel('channel').id}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
			}

			DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, starBoardEnabled: true, starBoardMinimum: 3, starBoardChannel: interaction.options.getChannel('channel').id });

			return await interaction.editReply(`The starboard has been enabled on this server for channel <#${interaction.options.getChannel('channel').id}> with a minimum requirement of 3 stars.`);
		} else if (interaction.options.getSubcommand() === 'minimum') {
			if (guild) {
				guild.starBoardEnabled = true;

				if (!guild.starBoardChannel) {
					guild.starBoardChannel = interaction.channelId;
				}

				guild.starBoardMinimum = parseInt(interaction.options.getInteger('amount'));
				guild.save();

				return await interaction.editReply(`The starboard has been enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${parseInt(interaction.options.getInteger('amount'))} stars.`);
			}

			DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, starBoardEnabled: true, starBoardMinimum: parseInt(interaction.options.getInteger('amount')), starBoardChannel: interaction.channelId });

			return await interaction.editReply(`The starboard has been enabled on this server for channel <#${interaction.channelId}> with a minimum requirement of ${parseInt(interaction.options.getInteger('amount'))} stars.`);
		}
	},
};