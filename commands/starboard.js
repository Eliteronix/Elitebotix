const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'starboard',
	aliases: ['star-board'],
	description: 'Sends the messages receiving a star into the specified channel.',
	usage: '<enable/disable> | <channel> <mentioned channel> | <minimum> <#amount>',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.deferReply({ ephemeral: true });

			args = [interaction.options._subcommand];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}
		const guildPrefix = await getGuildPrefix(msg);
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