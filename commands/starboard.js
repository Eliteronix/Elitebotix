const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder, ChannelType } = require('discord.js');
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
				)
		),
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

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

			args = [interaction.options.getSubcommand()];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}
		const guildPrefix = await getGuildPrefix(msg);
		logDatabaseQueries(4, 'commands/starboard.js DBGuilds');
		//TODO: add attributes and logdatabasequeries
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId }
		});
		if (args[0].toLowerCase() === 'enable') {
			if (guild) {
				if (guild.starBoardEnabled) {
					if (msg.id) {
						return msg.reply(`The starboard is already enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
					}
					return interaction.editReply(`The starboard is already enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
				} else {
					if (!guild.starBoardMinimum) {
						guild.starBoardMinimum = 3;
					}
					if (!guild.starBoardChannel) {
						guild.starBoardChannel = msg.channel.id;
					}
					guild.starBoardEnabled = true;
					guild.save();
					if (msg.id) {
						return msg.reply(`The starboard has been enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
					}
					return interaction.editReply(`The starboard has been enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
				}
			} else {
				logDatabaseQueries(4, 'commands/starboard.js DBGuilds create 1');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, starBoardEnabled: true, starBoardMinimum: 3, starBoardChannel: msg.channel.id });
				if (msg.id) {
					return msg.reply(`The starboard has been enabled on this server for channel <#${msg.channel.id}> with a minimum requirement of 3 stars.`);
				}
				return interaction.editReply(`The starboard has been enabled on this server for channel <#${msg.channel.id}> with a minimum requirement of 3 stars.`);
			}
		} else if (args[0].toLowerCase() === 'disable') {
			if (guild) {
				if (guild.starBoardEnabled) {
					guild.starBoardEnabled = false;
					guild.save();
					if (msg.id) {
						return msg.reply('The starboard is has been disabled on this server.');
					}
					return interaction.editReply('The starboard is has been disabled on this server.');
				} else {
					if (msg.id) {
						return msg.reply('The starboard is not enabled on this server.');
					}
					return interaction.editReply('The starboard is not enabled on this server.');
				}
			} else {
				if (msg.id) {
					return msg.reply('The starboard is not enabled on this server.');
				}
				return interaction.editReply('The starboard is not enabled on this server.');
			}
		} else if (args[0].toLowerCase() === 'channel') {
			if (!msg.mentions.channels.first()) {
				if (msg.id) {
					return msg.reply('Please mention a channel where the highlighted messages should be sent into.');
				}
				return interaction.editReply('Please mention a channel where the highlighted messages should be sent into.');
			}
			if (guild) {
				guild.starBoardEnabled = true;
				if (!guild.starBoardMinimum) {
					guild.starBoardMinimum = 3;
				}
				guild.starBoardChannel = msg.mentions.channels.first().id;
				guild.save();
				if (msg.id) {
					return msg.reply(`The starboard has been enabled on this server for channel <#${msg.mentions.channels.first().id}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
				}
				return interaction.editReply(`The starboard has been enabled on this server for channel <#${msg.mentions.channels.first().id}> with a minimum requirement of ${guild.starBoardMinimum} stars.`);
			} else {
				logDatabaseQueries(4, 'commands/starboard.js DBGuilds create 2');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, starBoardEnabled: true, starBoardMinimum: 3, starBoardChannel: msg.mentions.channels.first().id });
				if (msg.id) {
					return msg.reply(`The starboard has been enabled on this server for channel <#${msg.mentions.channels.first().id}> with a minimum requirement of 3 stars.`);
				}
				return interaction.editReply(`The starboard has been enabled on this server for channel <#${msg.mentions.channels.first().id}> with a minimum requirement of 3 stars.`);
			}
		} else if (args[0].toLowerCase() === 'minimum') {
			if (!args[1] || isNaN(args[1]) || parseInt(args[1]) < 1) {
				if (msg.id) {
					return msg.reply('Please provide a valid number (at least 1) that should be the minimum requirement for highlighting the message.');
				}
				return interaction.editReply('Please provide a valid number (at least 1) that should be the minimum requirement for highlighting the message.');
			}
			if (guild) {
				guild.starBoardEnabled = true;
				if (!guild.starBoardChannel) {
					guild.starBoardChannel = msg.channel.id;
				}
				guild.starBoardMinimum = parseInt(args[1]);
				guild.save();
				if (msg.id) {
					return msg.reply(`The starboard has been enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${parseInt(args[1])} stars.`);
				}
				return interaction.editReply(`The starboard has been enabled on this server for channel <#${guild.starBoardChannel}> with a minimum requirement of ${parseInt(args[1])} stars.`);
			} else {
				logDatabaseQueries(4, 'commands/starboard.js DBGuilds create 3');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, starBoardEnabled: true, starBoardMinimum: parseInt(args[1]), starBoardChannel: msg.channel.id });
				if (msg.id) {
					return msg.reply(`The starboard has been enabled on this server for channel <#${msg.channel.id}> with a minimum requirement of ${parseInt(args[1])} stars.`);
				}
				return interaction.editReply(`The starboard has been enabled on this server for channel <#${msg.channel.id}> with a minimum requirement of ${parseInt(args[1])} stars.`);
			}
		} else {
			msg.reply(`Please specify what setting about the starboard you would like to change.\nUsage: \`${guildPrefix}${this.name} ${this.usage}\``);
		}
	},
};