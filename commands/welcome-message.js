const { DBGuilds } = require('../dbObjects');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
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
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
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
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options.getSubcommand() === 'set') {
				args.push(interaction.options._hoistedOptions[0].value);
			} else {
				args = [interaction.options.getSubcommand()];
			}
		}
		//Check first argument of the command
		if (args[0] === 'current') {
			logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds current');
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Check if there is a welcome message set
				if (guild.sendWelcomeMessage) {
					//get the channel id
					const guildWelcomeMessageChannelId = guild.welcomeMessageChannel;
					//get the channel object by the id
					const guildWelcomeMessageChannel = msg.guild.channels.cache.find(channel => channel.id === guildWelcomeMessageChannelId);
					if (msg.id) {
						return msg.reply(`The current welcome message is set to channel \`${guildWelcomeMessageChannel.name}\`: \`${guild.welcomeMessageText.replace(/`/g, '')}\``);
					}
					return interaction.editReply(`The current welcome message is set to channel \`${guildWelcomeMessageChannel.name}\`: \`${guild.welcomeMessageText.replace(/`/g, '')}\``);
				} else {
					//if no welcome message is set
					if (msg.id) {
						return msg.reply('There is currently no welcome message set.');
					}
					return interaction.editReply('There is currently no welcome message set.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds current create');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: false });
				//Send that no welcome message is set
				if (msg.id) {
					return msg.reply('There is currently no welcome message set.');
				}
				return interaction.editReply('There is currently no welcome message set.');
			}
			//Check first argument of the command
		} else if (args[0] === 'disable') {
			logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds disable');
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Check if there is a welcome message set
				if (guild.sendWelcomeMessage) {
					//Set the dataset to no welcome message
					guild.sendWelcomeMessage = false;
					//Save the dataset
					guild.save();
					if (msg.id) {
						return msg.reply('Welcome messages have been disabled for this server.');
					}
					return interaction.editReply('Welcome messages have been disabled for this server.');
				} else {
					//if welcome messages are already disabled
					if (msg.id) {
						return msg.reply('Welcome messages are already disabled for this server.');
					}
					return interaction.editReply('Welcome messages are already disabled for this server.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds disable create');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: false });
				//Send that no welcome message is set
				if (msg.id) {
					return msg.reply('Welcome messages are already disabled for this server.');
				}
				return interaction.editReply('Welcome messages are already disabled for this server.');
			}
			//If not specified keyword for the command
		} else {
			//Define welcome message from the rest of the arguments
			let welcomeMessage = args.join(' ');
			logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds else');
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Set welcome message fields and save the dataset
				guild.sendWelcomeMessage = true;
				guild.welcomeMessageChannel = msg.channel.id;
				guild.welcomeMessageText = welcomeMessage;
				guild.save();
			} else {
				//if guild was not found, create it in db
				logDatabaseQueries(4, 'commands/welcome-message.js DBGuilds else create');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: true, welcomeMessageChannel: msg.channel.id, welcomeMessageText: welcomeMessage });
			}
			if (msg.id) {
				return msg.reply(`The new message \`${welcomeMessage.replace(/`/g, '')}\` has been set for welcoming new members in the channel \`${msg.channel.name}\`.`);
			}
			return interaction.editReply(`The new message \`${welcomeMessage.replace(/`/g, '')}\` has been set for welcoming new members in the channel \`${msg.channel.name}\`.`);
		}
	},
};