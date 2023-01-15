const { DBGuilds } = require('../dbObjects');
const { Permissions } = require('discord.js');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'welcome-message',
	description: 'Sends the specified message into the channel the user used the command in as soon as a new member arrives.',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'server-admin',
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options._subcommand === 'set') {
				args.push(interaction.options._hoistedOptions[0].value);
			} else {
				args = [interaction.options._subcommand];
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
					return interaction.reply(`The current welcome message is set to channel \`${guildWelcomeMessageChannel.name}\`: \`${guild.welcomeMessageText.replace(/`/g, '')}\``);
				} else {
					//if no welcome message is set
					if (msg.id) {
						return msg.reply('There is currently no welcome message set.');
					}
					return interaction.reply('There is currently no welcome message set.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: false });
				//Send that no welcome message is set
				if (msg.id) {
					return msg.reply('There is currently no welcome message set.');
				}
				return interaction.reply('There is currently no welcome message set.');
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
					return interaction.reply('Welcome messages have been disabled for this server.');
				} else {
					//if welcome messages are already disabled
					if (msg.id) {
						return msg.reply('Welcome messages are already disabled for this server.');
					}
					return interaction.reply('Welcome messages are already disabled for this server.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: false });
				//Send that no welcome message is set
				if (msg.id) {
					return msg.reply('Welcome messages are already disabled for this server.');
				}
				return interaction.reply('Welcome messages are already disabled for this server.');
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
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: true, welcomeMessageChannel: msg.channel.id, welcomeMessageText: welcomeMessage });
			}
			if (msg.id) {
				return msg.reply(`The new message \`${welcomeMessage.replace(/`/g, '')}\` has been set for welcoming new members in the channel \`${msg.channel.name}\`.`);
			}
			return interaction.reply(`The new message \`${welcomeMessage.replace(/`/g, '')}\` has been set for welcoming new members in the channel \`${msg.channel.name}\`.`);
		}
	},
};