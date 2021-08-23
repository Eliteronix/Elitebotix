const Discord = require('discord.js');
const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'logging',
	aliases: ['server-logging'],
	description: '[Toggle] Logs the enabled events in the specified channel.',
	usage: 'list | <channel> <mentioned channel> | <eventnames to toggle>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args) {
		let guild = await DBGuilds.findOne({
			where: { guildId: msg.guild.id }
		});
		if (args[0].toLowerCase() === 'list') {
			let channel = 'Not yet set.';
			if (guild && guild.loggingChannel) {
				channel = `<#${guild.loggingChannel}>`;
			}

			let nicknames = '❌ Not being logged';
			if (guild && guild.loggingNicknames) {
				nicknames = '✅ Being logged';
			}

			let usernames = '❌ Not being logged';
			if (guild && guild.loggingUsernames) {
				usernames = '✅ Being logged';
			}

			let userdiscriminators = '❌ Not being logged';
			if (guild && guild.loggingDiscriminators) {
				userdiscriminators = '✅ Being logged';
			}

			let useravatars = '❌ Not being logged';
			if (guild && guild.loggingAvatars) {
				useravatars = '✅ Being logged';
			}

			let userroles = '❌ Not being logged';
			if (guild && guild.loggingUserroles) {
				userroles = '✅ Being logged';
			}

			let userjoining = '❌ Not being logged';
			if (guild && guild.loggingMemberAdd) {
				userjoining = '✅ Being logged';
			}

			let userleaving = '❌ Not being logged';
			if (guild && guild.loggingMemberRemove) {
				userleaving = '✅ Being logged';
			}

			let rolecreate = '❌ Not being logged';
			if (guild && guild.loggingRoleCreate) {
				rolecreate = '✅ Being logged';
			}

			let roleupdate = '❌ Not being logged';
			if (guild && guild.loggingRoleUpdate) {
				roleupdate = '✅ Being logged';
			}

			let roledelete = '❌ Not being logged';
			if (guild && guild.loggingRoleDelete) {
				roledelete = '✅ Being logged';
			}

			let banadd = '❌ Not being logged';
			if (guild && guild.loggingBanAdd) {
				banadd = '✅ Being logged';
			}

			let banremove = '❌ Not being logged';
			if (guild && guild.loggingBanRemove) {
				banremove = '✅ Being logged';
			}

			let guildupdate = '❌ Not being logged';
			if (guild && guild.loggingGuildUpdate) {
				guildupdate = '✅ Being logged';
			}

			let servermute = '❌ Not being logged';
			if (guild && guild.loggingServerMute) {
				servermute = '✅ Being logged';
			}

			let serverdeaf = '❌ Not being logged';
			if (guild && guild.loggingServerDeaf) {
				serverdeaf = '✅ Being logged';
			}

			let joinvoice = '❌ Not being logged';
			if (guild && guild.loggingJoinVoice) {
				joinvoice = '✅ Being logged';
			}

			let leavevoice = '❌ Not being logged';
			if (guild && guild.loggingLeaveVoice) {
				leavevoice = '✅ Being logged';
			}

			let channelcreate = '❌ Not being logged';
			if (guild && guild.loggingChannelCreate) {
				channelcreate = '✅ Being logged';
			}

			let channelupdate = '❌ Not being logged';
			if (guild && guild.loggingChannelUpdate) {
				channelupdate = '✅ Being logged';
			}

			let channeldelete = '❌ Not being logged';
			if (guild && guild.loggingChannelDelete) {
				channeldelete = '✅ Being logged';
			}

			let invitecreate = '❌ Not being logged';
			if (guild && guild.loggingInviteCreate) {
				invitecreate = '✅ Being logged';
			}

			let invitedelete = '❌ Not being logged';
			if (guild && guild.loggingInviteDelete) {
				invitedelete = '✅ Being logged';
			}

			let messageupdate = '❌ Not being logged';
			if (guild && guild.loggingMessageUpdate) {
				messageupdate = '✅ Being logged';
			}

			let messagedelete = '❌ Not being logged';
			if (guild && guild.loggingMessageDelete) {
				messagedelete = '✅ Being logged';
			}

			let emojicreate = '❌ Not being logged';
			if (guild && guild.loggingEmojiCreate) {
				emojicreate = '✅ Being logged';
			}

			let emojiupdate = '❌ Not being logged';
			if (guild && guild.loggingEmojiUpdate) {
				emojiupdate = '✅ Being logged';
			}

			let emojidelete = '❌ Not being logged';
			if (guild && guild.loggingEmojiDelete) {
				emojidelete = '✅ Being logged';
			}

			const guildPrefix = await getGuildPrefix(msg);

			const loggingEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setDescription('A list of all events and if they are being logged or not is being provided below (part 1)')
				.addFields(
					{ name: 'Channel', value: channel },
					{ name: 'nicknames', value: nicknames, inline: true },
					{ name: 'usernames', value: usernames, inline: true },
					{ name: 'userdiscriminators', value: userdiscriminators, inline: true },
					{ name: 'useravatars', value: useravatars, inline: true },
					{ name: 'userroles', value: userroles, inline: true },
					{ name: 'userjoining', value: userjoining, inline: true },
					{ name: 'userleaving', value: userleaving, inline: true },
					{ name: 'rolecreate', value: rolecreate, inline: true },
					{ name: 'roleupdate', value: roleupdate, inline: true },
					{ name: 'roledelete', value: roledelete, inline: true },
					{ name: 'banadd', value: banadd, inline: true },
					{ name: 'banremove', value: banremove, inline: true },
					{ name: 'guildupdate', value: guildupdate, inline: true },
					{ name: 'servermute', value: servermute, inline: true },
					{ name: 'serverdeaf', value: serverdeaf, inline: true },
					{ name: 'joinvoice', value: joinvoice, inline: true },
					{ name: 'leavevoice', value: leavevoice, inline: true },
					{ name: 'channelcreate', value: channelcreate, inline: true },
					{ name: 'channelupdate', value: channelupdate, inline: true },
					{ name: 'channeldelete', value: channeldelete, inline: true },
					{ name: 'invitecreate', value: invitecreate, inline: true },
					{ name: 'invitedelete', value: invitedelete, inline: true },
					{ name: 'messageupdate', value: messageupdate, inline: true },
					{ name: 'messagedelete', value: messagedelete, inline: true },
				)
				.setTimestamp()
				.setFooter(`To toggle any of these events use: \`${guildPrefix}${this.name} <eventname>\``);

			msg.reply({ embeds: [loggingEmbed] });

			const loggingEmbed2 = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setDescription('A list of all events and if they are being logged or not is being provided below (part 2)')
				.addFields(
					{ name: 'emojicreate', value: emojicreate, inline: true },
					{ name: 'emojiupdate', value: emojiupdate, inline: true },
					{ name: 'emojidelete', value: emojidelete, inline: true },
				)
				.setTimestamp()
				.setFooter(`To toggle any of these events use: \`${guildPrefix}${this.name} <eventname>\``);

			msg.reply({ embeds: [loggingEmbed2] });
		} else if (args[0].toLowerCase() === 'channel') {
			if (!msg.mentions.channels.first()) {
				return msg.reply('Please mention a channel where the highlighted messages should be sent into.');
			}
			if (guild) {
				guild.loggingChannel = msg.mentions.channels.first().id;
				guild.save();
				return msg.reply(`The enabled events are now being logged into the channel <#${msg.mentions.channels.first().id}>.`);
			} else {
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, loggingChannel: msg.mentions.channels.first().id });
				return msg.reply(`The enabled events are now being logged into the channel <#${msg.mentions.channels.first().id}>.`);
			}
		} else {
			if (!guild || !guild.loggingChannel) {
				const guildPrefix = await getGuildPrefix(msg);
				msg.reply(`Be sure to use \`${guildPrefix}${this.name} channel <mentioned channel>\` to set a channel where this information should be logged into.`);
			}
			if (!guild) {
				guild = await DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name });
			}
			args.forEach(arg => {
				if (arg.toLowerCase() === 'nicknames') {
					if (guild.loggingNicknames) {
						guild.loggingNicknames = false;
						guild.save();
						msg.reply('Nickname changes will no longer get logged in the specified channel.');
					} else {
						guild.loggingNicknames = true;
						guild.save();
						msg.reply('Nickname changes will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'usernames') {
					if (guild.loggingUsernames) {
						guild.loggingUsernames = false;
						guild.save();
						msg.reply('Username changes will no longer get logged in the specified channel.');
					} else {
						guild.loggingUsernames = true;
						guild.save();
						msg.reply('Username changes will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'userdiscriminators') {
					if (guild.loggingDiscriminators) {
						guild.loggingDiscriminators = false;
						guild.save();
						msg.reply('Discriminator changes will no longer get logged in the specified channel.');
					} else {
						guild.loggingDiscriminators = true;
						guild.save();
						msg.reply('Discriminator changes will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'useravatars') {
					if (guild.loggingAvatars) {
						guild.loggingAvatars = false;
						guild.save();
						msg.reply('Avatar changes will no longer get logged in the specified channel.');
					} else {
						guild.loggingAvatars = true;
						guild.save();
						msg.reply('Avatar changes will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'userroles') {
					if (guild.loggingUserroles) {
						guild.loggingUserroles = false;
						guild.save();
						msg.reply('User role changes will no longer get logged in the specified channel.');
					} else {
						guild.loggingUserroles = true;
						guild.save();
						msg.reply('User role changes will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'userjoining') {
					if (guild.loggingMemberAdd) {
						guild.loggingMemberAdd = false;
						guild.save();
						msg.reply('Users joining will no longer get logged in the specified channel.');
					} else {
						guild.loggingMemberAdd = true;
						guild.save();
						msg.reply('Users joining will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'userleaving') {
					if (guild.loggingMemberRemove) {
						guild.loggingMemberRemove = false;
						guild.save();
						msg.reply('Users leaving will no longer get logged in the specified channel.');
					} else {
						guild.loggingMemberRemove = true;
						guild.save();
						msg.reply('Users leaving will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'rolecreate') {
					if (guild.loggingRoleCreate) {
						guild.loggingRoleCreate = false;
						guild.save();
						msg.reply('Create roles will no longer get logged in the specified channel.');
					} else {
						guild.loggingRoleCreate = true;
						guild.save();
						msg.reply('Create roles will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'roleupdate') {
					if (guild.loggingRoleUpdate) {
						guild.loggingRoleUpdate = false;
						guild.save();
						msg.reply('Updated roles will no longer get logged in the specified channel.');
					} else {
						guild.loggingRoleUpdate = true;
						guild.save();
						msg.reply('Updated roles will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'roledelete') {
					if (guild.loggingRoleDelete) {
						guild.loggingRoleDelete = false;
						guild.save();
						msg.reply('Deleted roles will no longer get logged in the specified channel.');
					} else {
						guild.loggingRoleDelete = true;
						guild.save();
						msg.reply('Deleted roles will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'banadd') {
					if (guild.loggingBanAdd) {
						guild.loggingBanAdd = false;
						guild.save();
						msg.reply('Banned users will no longer get logged in the specified channel.');
					} else {
						guild.loggingBanAdd = true;
						guild.save();
						msg.reply('Banned users will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'banremove') {
					if (guild.loggingBanRemove) {
						guild.loggingBanRemove = false;
						guild.save();
						msg.reply('Unbanned users will no longer get logged in the specified channel.');
					} else {
						guild.loggingBanRemove = true;
						guild.save();
						msg.reply('Unbanned users will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'guildupdate') {
					if (guild.loggingGuildUpdate) {
						guild.loggingGuildUpdate = false;
						guild.save();
						msg.reply('Guild updates will no longer get logged in the specified channel.');
					} else {
						guild.loggingGuildUpdate = true;
						guild.save();
						msg.reply('Guild updates will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'servermute') {
					if (guild.loggingServerMute) {
						guild.loggingServerMute = false;
						guild.save();
						msg.reply('Server mutes will no longer get logged in the specified channel.');
					} else {
						guild.loggingServerMute = true;
						guild.save();
						msg.reply('Server mutes will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'serverdeaf') {
					if (guild.loggingServerDeaf) {
						guild.loggingServerDeaf = false;
						guild.save();
						msg.reply('Server deafs will no longer get logged in the specified channel.');
					} else {
						guild.loggingServerDeaf = true;
						guild.save();
						msg.reply('Server deafs will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'joinvoice') {
					if (guild.loggingJoinVoice) {
						guild.loggingJoinVoice = false;
						guild.save();
						msg.reply('Joining voices will no longer get logged in the specified channel.');
					} else {
						guild.loggingJoinVoice = true;
						guild.save();
						msg.reply('Joining voices will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'leavevoice') {
					if (guild.loggingLeaveVoice) {
						guild.loggingLeaveVoice = false;
						guild.save();
						msg.reply('Leaving voices will no longer get logged in the specified channel.');
					} else {
						guild.loggingLeaveVoice = true;
						guild.save();
						msg.reply('Leaving voices will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'channelcreate') {
					if (guild.loggingChannelCreate) {
						guild.loggingChannelCreate = false;
						guild.save();
						msg.reply('Created channels will no longer get logged in the specified channel.');
					} else {
						guild.loggingChannelCreate = true;
						guild.save();
						msg.reply('Created channels will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'channelupdate') {
					if (guild.loggingChannelUpdate) {
						guild.loggingChannelUpdate = false;
						guild.save();
						msg.reply('Updated channels will no longer get logged in the specified channel.');
					} else {
						guild.loggingChannelUpdate = true;
						guild.save();
						msg.reply('Updated channels will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'channeldelete') {
					if (guild.loggingChannelDelete) {
						guild.loggingChannelDelete = false;
						guild.save();
						msg.reply('Deleted channels will no longer get logged in the specified channel.');
					} else {
						guild.loggingChannelDelete = true;
						guild.save();
						msg.reply('Deleted channels will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'invitecreate') {
					if (guild.loggingInviteCreate) {
						guild.loggingInviteCreate = false;
						guild.save();
						msg.reply('Created invites will no longer get logged in the specified channel.');
					} else {
						guild.loggingInviteCreate = true;
						guild.save();
						msg.reply('Created invites will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'invitedelete') {
					if (guild.loggingInviteDelete) {
						guild.loggingInviteDelete = false;
						guild.save();
						msg.reply('Deleted invites will no longer get logged in the specified channel.');
					} else {
						guild.loggingInviteDelete = true;
						guild.save();
						msg.reply('Deleted invites will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'messageupdate') {
					if (guild.loggingMessageUpdate) {
						guild.loggingMessageUpdate = false;
						guild.save();
						msg.reply('Updated messages will no longer get logged in the specified channel.');
					} else {
						guild.loggingMessageUpdate = true;
						guild.save();
						msg.reply('Updated messages will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'messagedelete') {
					if (guild.loggingMessageDelete) {
						guild.loggingMessageDelete = false;
						guild.save();
						msg.reply('Deleted messages will no longer get logged in the specified channel.');
					} else {
						guild.loggingMessageDelete = true;
						guild.save();
						msg.reply('Deleted messages will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'emojicreate') {
					if (guild.loggingEmojiCreate) {
						guild.loggingEmojiCreate = false;
						guild.save();
						msg.reply('Created emojis will no longer get logged in the specified channel.');
					} else {
						guild.loggingEmojiCreate = true;
						guild.save();
						msg.reply('Created emojis will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'emojiupdate') {
					if (guild.loggingEmojiUpdate) {
						guild.loggingEmojiUpdate = false;
						guild.save();
						msg.reply('Updated emojis will no longer get logged in the specified channel.');
					} else {
						guild.loggingEmojiUpdate = true;
						guild.save();
						msg.reply('Updated emojis will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'emojidelete') {
					if (guild.loggingEmojiDelete) {
						guild.loggingEmojiDelete = false;
						guild.save();
						msg.reply('Deleted emojis will no longer get logged in the specified channel.');
					} else {
						guild.loggingEmojiDelete = true;
						guild.save();
						msg.reply('Deleted emojis will now get logged in the specified channel.');
					}
				} else {
					msg.reply(`\`${arg.replace(/`/g, '')}\` is not a valid event to log.`);
				}
			});
		}
	},
};