const { DBGuilds, DBGuildWhiteListed } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'whitelist',
	aliases: ['white-list', 'wl'],
	description: 'Whitelist a channel.',
	usage: '<enable> | <disable> | <add> <mentioned_channel> | <remove> <mentioned channel> | <list>',
	// permissions: 'MANAGE_GUILD',
	// permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.deferReply();

			args = [interaction.options._subcommand];
			
			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}

		logDatabaseQueries(4, 'commands/starboard.js DBGuilds');
		let guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId }
		});
        
		if (!guild) {
			guild = await DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name });
		}
        
		if (args[0] == 'enable') {
			if (guild.blackListEnabled) {
				if (msg.id) {
					return msg.reply('You can not have whitelist and blacklist enabled at the same time.');
				}
				return interaction.followUp('You can not have whitelist and blacklist enabled at the same time.');
			}
			
			if (guild.whiteListEnabled) {
				if (msg.id) {
					return msg.reply('Whitelist is already enabled.');
				}
				return interaction.followUp('Whitelist is already enabled.');
			}
			guild.whiteListEnabled = true;
			guild.save();
            
			if (msg.id) {
				return msg.reply('Whitelist has been enabled.');
			}
			return interaction.followUp('Whitelist has been enabled.');

		} else if (args[0] == 'disable') {
			if (!guild.whiteListEnabled) {
				if (msg.id) {
					return msg.reply('Whitelist is already disabled.');
				}
				return interaction.followUp('Whitelist is already disabled.');
			}

			guild.whiteListEnabled = false;
			guild.save();

			if (msg.id) {
				return msg.reply('Whitelist has been disabled.');
			}
			return interaction.editReply('Whitelist has been disabled.');
		} else if (args[0] == 'list') {
			if (!guild.whiteListEnabled) {
				if (msg.id) {
					return msg.reply('Whitelist is not enabled.');
				}
				return interaction.followUp('Whitelist is not enabled.');
			}
            
			let whiteListedChannelsId = await DBGuildWhiteListed.findAll({
				where: {
					guildId: msg.guildId
				}
			});

			if (whiteListedChannelsId.length == 0) {
				if (msg.id) {
					return msg.reply('There are no channels whitelisted.');
				}
				return interaction.followUp('There are no channels whitelisted.');
			}

			let whiteListedChannels = [];
			for (let i = 0; i < whiteListedChannelsId.length; i++) {
				let channel = await msg.guild.channels.fetch(whiteListedChannelsId[i].whiteListedChannelId);
				whiteListedChannels.push(channel.name);
			}
			//mention channels
			let whiteListedChannelsMention = '';
			for (let i = 0; i < whiteListedChannels.length; i++) {
				whiteListedChannelsMention += '<#' + whiteListedChannelsId[i].whiteListedChannelId + '> ';
			}
			if (msg.id) {
				return msg.reply('Whitelisted channels: ' + whiteListedChannelsMention);
			}
			return interaction.editReply('Whitelisted channels: ' + whiteListedChannelsMention);

		} else if (args[0] == 'add') {
			//not mentioned a channel
			if (!msg.mentions.channels.first()) {
				if (msg.id) {
					return msg.reply('You must mention a channel to whitelist.');
				} else {
					return interaction.followUp('You must mention a channel to whitelist.');
				}
			}
			
			let channel = msg.mentions.channels.first().id;

			let whiteListedChannel = await DBGuildWhiteListed.findOne({
				where: {
					guildId: msg.guildId,
					whiteListedChannelId: channel
				}
			});

			if (!whiteListedChannel) {
				await DBGuildWhiteListed.create({
					guildId: msg.guildId,
					whiteListedChannelId: channel
				});
		
				if (msg.id) {
					return msg.reply(`${msg.mentions.channels.first()} has been whitelisted.`);
				}
				return interaction.editReply(`${msg.mentions.channels.first()} has been whitelisted.`);
			} else {
				if (msg.id) {
					return msg.reply(`${msg.mentions.channels.first()} is already whitelisted.`);
				}
				return interaction.editReply(`${msg.mentions.channels.first()} is already whitelisted.`);
			}
		} else if (args[0] == 'remove') {
			//not mentioned a channel
			if (!msg.mentions.channels.first()) {
				if (msg.id) {
					return msg.reply('You must mention a channel to remove from whitelist.');
				} else {
					return interaction.followUp('You must mention a channel to remove from whitelist.');
				}
			}
			//remove channel from db
			let whiteListedChannel = await DBGuildWhiteListed.findOne({
				where: {
					guildId: msg.guild.id,
					whitelistedChannelId: msg.mentions.channels.first().id
				}
			});

			if (!whiteListedChannel) {
				if (msg.id) {
					return msg.reply(`${msg.mentions.channels.first()} is not whitelisted.`);
				}
				return interaction.editReply(`${msg.mentions.channels.first()} is not whitelisted.`);
			} else {
				await DBGuildWhiteListed.destroy({
					where: {
						guildId: msg.guild.id,
						whitelistedChannelId: msg.mentions.channels.first().id
					}
				});
				if (msg.id) {
					return msg.reply(`${msg.mentions.channels.first()} has been removed from whitelist.`);
				}
				return interaction.editReply(`${msg.mentions.channels.first()} has been removed from whitelist.`);
			}
		}
	}
};