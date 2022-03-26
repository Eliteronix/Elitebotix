const { DBGuilds, DBGuildBlackListed } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'blacklist',
	aliases: ['black-list', 'bl'],
	description: 'Blacklist a channel.',
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
			if (guild.whiteListEnabled) {
				if (msg.id) {
					return msg.reply('You can not have whitelist and blacklist enabled at the same time.');
				}
				return interaction.followUp('You can not have whitelist and blacklist enabled at the same time.');
			}

			if (guild.blackListEnabled) {
				if (msg.id) {
					return msg.reply('Blacklist is already enabled.');
				}
				return interaction.followUp('Blacklist is already enabled.');
			}

			guild.blackListEnabled = true;
			guild.save();

			if (msg.id) {
				return msg.reply('Blacklist has been enabled.');
			}
			return interaction.followUp('Blacklist has been enabled.');

		} else if (args[0] == 'disable') {
			if (!guild.blackListEnabled) {
				if (msg.id) {
					return msg.reply('Blacklist is already disabled.');
				}
				return interaction.followUp('Blacklist is already disabled.');
			}
			guild.blackListEnabled = false;
			guild.save();
			if (msg.id) {
				return msg.reply('Blacklist has been disabled.');
			}
			return interaction.editReply('Blacklist has been disabled.');
		} else if (args[0] == 'list') {
			if (!guild.blackListEnabled) {
				if (msg.id) {
					return msg.reply('Blacklist is not enabled.');
				}
				return interaction.followUp('Blacklist is not enabled.');
			}

			let blackListedChannelsId = await DBGuildBlackListed.findAll({
				where: {
					guildId: msg.guildId
				}
			});

			if (blackListedChannelsId.length == 0) {
				if (msg.id) {
					return msg.reply('There are no channels blacklisted.');
				}
				return interaction.followUp('There are no channels blacklisted.');
			}

			let blackListedChannels = [];
			for (let i = 0; i < blackListedChannelsId.length; i++) {
				let channel = await msg.guild.channels.fetch(blackListedChannelsId[i].blackListedChannelId);
				blackListedChannels.push(channel.name);
			}
			//mention channels
			let blackListedChannelsMention = '';
			for (let i = 0; i < blackListedChannelsId.length; i++) {
				blackListedChannelsMention += '<#' + blackListedChannelsId[i].blackListedChannelId + '> ';
			}
			if (msg.id) {
				return msg.reply('Blacklisted channels: ' + blackListedChannelsMention);
			}
			return interaction.editReply('Blacklisted channels: ' + blackListedChannelsMention);

		} else if (args[0] == 'add') {
			//not mentioned a channel
			if (!msg.mentions.channels.first()) {
				if (msg.id) {
					return msg.reply('You must mention a channel to blacklist.');
				} else {
					return interaction.followUp('You must mention a channel to blacklist.');
				}
			}

			let channel = msg.mentions.channels.first().id;

			let blackListedChannel = await DBGuildBlackListed.findOne({
				where: {
					guildId: msg.guildId,
					blackListedChannelId: channel
				}
			});

			if (!blackListedChannel) {
				await DBGuildBlackListed.create({
					guildId: msg.guildId,
					blackListedChannelId: channel
				});

				if (msg.id) {
					return msg.reply(`${msg.mentions.channels.first()} has been blacklisted.`);
				}
				return interaction.editReply(`${msg.mentions.channels.first()} has been blacklisted.`);
			} else {
				if (msg.id) {
					return msg.reply(`${msg.mentions.channels.first()} is already blacklisted.`);
				}
				return interaction.editReply(`${msg.mentions.channels.first()} is already blacklisted.`);
			}
		} else if (args[0] == 'remove') {
			//not mentioned a channel
			if (!msg.mentions.channels.first()) {
				if (msg.id) {
					return msg.reply('You must mention a channel to remove from blacklist.');
				} else {
					return interaction.followUp('You must mention a channel to remove from blacklist.');
				}
			}
			//remove channel from db
			let blackListedChannel = await DBGuildBlackListed.findOne({
				where: {
					guildId: msg.guild.id,
					blacklistedChannelId: msg.mentions.channels.first().id
				}
			});

			if (!blackListedChannel) {
				if (msg.id) {
					return msg.reply(`${msg.mentions.channels.first()} is not blacklisted.`);
				}
				return interaction.editReply(`${msg.mentions.channels.first()} is not blacklisted.`);
			} else {
				await DBGuildBlackListed.destroy({
					where: {
						guildId: msg.guild.id,
						blacklistedChannelId: msg.mentions.channels.first().id
					}
				});
				if (msg.id) {
					return msg.reply(`${msg.mentions.channels.first()} has been removed from blacklist.`);
				}
				return interaction.editReply(`${msg.mentions.channels.first()} has been removed from blacklist.`);
			}
		}
	}
};