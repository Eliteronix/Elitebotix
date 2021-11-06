const { DBGuilds } = require('../dbObjects');
const { Permissions } = require('discord.js');
const { populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'goodbye-message',
	aliases: ['farewell-message'],
	description: 'Sends the specified message into the channel the user used the command in as soon as a member leaves.',
	usage: '<current/disable/message to send> (use "@member" to mention the member)',
	permissions: [Permissions.FLAGS.MANAGE_GUILD, Permissions.FLAGS.SEND_MESSAGES],
	permissionsTranslated: 'Send Messages and Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args, interaction) {
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
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Check if there is a goodbye message set
				if (guild.sendGoodbyeMessage) {
					//get the channel id
					const guildGoodbyeMessageChannelId = guild.goodbyeMessageChannel;
					//get the channel object by the id
					const guildGoodbyeMessageChannel = msg.guild.channels.cache.find(channel => channel.id === guildGoodbyeMessageChannelId);
					if (msg.id) {
						return msg.reply(`The current goodbye message is set to channel \`${guildGoodbyeMessageChannel.name}\`: \`${guild.goodbyeMessageText.replace(/`/g, '')}\``);
					}
					return interaction.reply(`The current goodbye message is set to channel \`${guildGoodbyeMessageChannel.name}\`: \`${guild.goodbyeMessageText.replace(/`/g, '')}\``);
				} else {
					//if no goodbye message is set
					if (msg.id) {
						return msg.reply('There is currently no goodbye message set.');
					}
					return interaction.reply('There is currently no goodbye message set.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendGoodbyeMessage: false });
				//Send that no goodbye message is set
				if (msg.id) {
					return msg.reply('There is currently no goodbye message set.');
				}
				return interaction.reply('There is currently no goodbye message set.');
			}
			//Check first argument of the command
		} else if (args[0] === 'disable') {
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Check if there is a goodbye message set
				if (guild.sendGoodbyeMessage) {
					//Set the dataset to no goodbye message
					guild.sendGoodbyeMessage = false;
					//Save the dataset
					guild.save();
					if (msg.id) {
						return msg.reply('Goodbye messages have been disabled for this server.');
					}
					return interaction.reply('Goodbye messages have been disabled for this server.');
				} else {
					//if goodbye messages are already disabled
					if (msg.id) {
						return msg.reply('Goodbye messages are already disabled for this server.');
					}
					return interaction.reply('Goodbye messages are already disabled for this server.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendGoodbyeMessage: false });
				//Send that no goodbye message is set
				if (msg.id) {
					return msg.reply('Goodbye messages are already disabled for this server.');
				}
				return interaction.reply('Goodbye messages are already disabled for this server.');
			}
			//If not specified keyword for the command
		} else {
			//Define goodbye message from the rest of the arguments
			let goodbyeMessage = args.join(' ');
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Set goodbye message fields and save the dataset
				guild.sendGoodbyeMessage = true;
				guild.goodbyeMessageChannel = msg.channel.id;
				guild.goodbyeMessageText = goodbyeMessage;
				guild.save();
			} else {
				//if guild was not found, create it in db
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendGoodbyeMessage: true, goodbyeMessageChannel: msg.channel.id, goodbyeMessageText: goodbyeMessage });
			}
			if (msg.id) {
				return msg.reply(`The new message \`${goodbyeMessage.replace(/`/g, '')}\` has been set for leaving members in the channel \`${msg.channel.name}\`.`);
			}
			return interaction.reply(`The new message \`${goodbyeMessage.replace(/`/g, '')}\` has been set for leaving members in the channel \`${msg.channel.name}\`.`);
		}
	},
};