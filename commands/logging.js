const Discord = require('discord.js');
const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'logging',
	description: '[Toggle] Logs the enabled events in the specified channel.',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('logging')
		.setNameLocalizations({
			'de': 'logging',
			'en-GB': 'logging',
			'en-US': 'logging',
		})
		.setDescription('Lets you log the enabled events in the specified channel')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir die aktivierten Ereignisse im angegebenen Kanal zu loggen',
			'en-GB': 'Lets you log the enabled events in the specified channel',
			'en-US': 'Lets you log the enabled events in the specified channel',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setNameLocalizations({
					'de': 'liste',
					'en-GB': 'list',
					'en-US': 'list',
				})
				.setDescription('Shows the current logging settings')
				.setDescriptionLocalizations({
					'de': 'Zeigt die aktuellen Logeinstellungen an',
					'en-GB': 'Shows the current logging settings',
					'en-US': 'Shows the current logging settings',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('channel')
				.setNameLocalizations({
					'de': 'kanal',
					'en-GB': 'channel',
					'en-US': 'channel',
				})
				.setDescription('Sets the channel that is supposed to log the information')
				.setDescriptionLocalizations({
					'de': 'Setzt den Kanal, in dem die Informationen geloggt werden sollen',
					'en-GB': 'Sets the channel that is supposed to log the information',
					'en-US': 'Sets the channel that is supposed to log the information',
				})
				.addChannelOption(option =>
					option
						.setName('channel')
						.setNameLocalizations({
							'de': 'kanal',
							'en-GB': 'channel',
							'en-US': 'channel',
						})
						.setDescription('The channel that is supposed to log the information')
						.setDescriptionLocalizations({
							'de': 'Der Kanal, in dem die Informationen geloggt werden sollen',
							'en-GB': 'The channel that is supposed to log the information',
							'en-US': 'The channel that is supposed to log the information',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('toggleevent')
				.setNameLocalizations({
					'de': 'ereignis',
					'en-GB': 'event',
					'en-US': 'event',
				})
				.setDescription('Allows you to toggle if an event should be logged')
				.setDescriptionLocalizations({
					'de': 'Erlaubt es dir ein Ereignis zu aktivieren oder zu deaktivieren',
					'en-GB': 'Allows you to toggle if an event should be logged',
					'en-US': 'Allows you to toggle if an event should be logged',
				})
				.addStringOption(option =>
					option
						.setName('eventname')
						.setNameLocalizations({
							'de': 'ereignisname',
							'en-GB': 'eventname',
							'en-US': 'eventname',
						})
						.setDescription('The eventname found in the list embeds')
						.setDescriptionLocalizations({
							'de': 'Der Ereignisname, der in den Listen Embeds zu finden ist',
							'en-GB': 'The eventname found in the list embeds',
							'en-US': 'The eventname found in the list embeds',
						})
						.setRequired(true)
						.setAutocomplete(true)
				)
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		const events = [
			'nicknames',
			'usernames',
			'userdiscriminators',
			'useravatars',
			'userroles',
			'userjoining',
			'userleaving',
			'rolecreate',
			'roleupdate',
			'roledelete',
			'banadd',
			'banremove',
			'guildupdate',
			'servermute',
			'serverdeaf',
			'joinvoice',
			'leavevoice',
			'channelcreate',
			'channelupdate',
			'channeldelete',
			'invitecreate',
			'invitedelete',
			'messageupdate',
			'messagedelete',
			'emojicreate',
			'emojiupdate',
			'emojidelete',
		];

		let filtered = events.filter(choice => choice.includes(focusedValue));

		filtered = filtered.slice(0, 25);

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
		}
	},
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		//TODO:Follow ups are not ephemeral
		if (interaction) {
			try {
				await interaction.deferReply();
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options.getSubcommand() !== 'toggleevent') {
				args = [interaction.options.getSubcommand()];
			}

			if (interaction.options.getSubcommand() !== 'list') {
				args.push(interaction.options._hoistedOptions[0].value);
			}
		}

		//TODO: Attributes
		logDatabaseQueries(4, 'commands/logging.js DBGuilds');
		let guild = await DBGuilds.findOne({
			attributes: [
				'id',
				'loggingChannel',
				'loggingNicknames',
				'loggingUsernames',
				'loggingDiscriminators',
				'loggingAvatars',
				'loggingUserroles',
				'loggingMemberAdd',
				'loggingMemberRemove',
				'loggingRoleCreate',
				'loggingRoleUpdate',
				'loggingRoleDelete',
				'loggingBanAdd',
				'loggingBanRemove',
				'loggingGuildUpdate',
				'loggingServerMute',
				'loggingServerDeaf',
				'loggingJoinVoice',
				'loggingLeaveVoice',
				'loggingChannelCreate',
				'loggingChannelUpdate',
				'loggingChannelDelete',
				'loggingInviteCreate',
				'loggingInviteDelete',
				'loggingMessageUpdate',
				'loggingMessageDelete',
				'loggingEmojiCreate',
				'loggingEmojiUpdate',
				'loggingEmojiDelete',
			],
			where: {
				guildId: msg.guildId
			}
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

			const loggingEmbed = new Discord.EmbedBuilder()
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
				.setFooter({ text: `To toggle any of these events use: \`${guildPrefix}${this.name} <eventname>\`` });

			if (msg.id) {
				await msg.reply({ embeds: [loggingEmbed] });
			} else {
				await interaction.followUp({ embeds: [loggingEmbed] });
			}

			const loggingEmbed2 = new Discord.EmbedBuilder()
				.setColor('#0099ff')
				.setDescription('A list of all events and if they are being logged or not is being provided below (part 2)')
				.addFields(
					{ name: 'emojicreate', value: emojicreate, inline: true },
					{ name: 'emojiupdate', value: emojiupdate, inline: true },
					{ name: 'emojidelete', value: emojidelete, inline: true },
				)
				.setTimestamp()
				.setFooter({ text: `To toggle any of these events use: \`${guildPrefix}${this.name} <eventname>\`` });

			if (msg.id) {
				msg.reply({ embeds: [loggingEmbed2] });
			} else {
				interaction.followUp({ embeds: [loggingEmbed2] });
			}
		} else if (args[0].toLowerCase() === 'channel') {
			if (!msg.mentions.channels.first()) {
				if (msg.id) {
					return msg.reply('Please mention a channel where the highlighted messages should be sent into.');
				}
				return interaction.followUp('Please mention a channel where the highlighted messages should be sent into.');
			}
			if (guild) {
				guild.loggingChannel = msg.mentions.channels.first().id;
				guild.save();
				if (msg.id) {
					return msg.reply(`The enabled events are now being logged into the channel <#${msg.mentions.channels.first().id}>.`);
				}
				return interaction.followUp(`The enabled events are now being logged into the channel <#${msg.mentions.channels.first().id}>.`);
			} else {
				logDatabaseQueries(4, 'commands/logging.js DBGuilds create 1');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, loggingChannel: msg.mentions.channels.first().id });
				if (msg.id) {
					return msg.reply(`The enabled events are now being logged into the channel <#${msg.mentions.channels.first().id}>.`);
				}
				return interaction.followUp(`The enabled events are now being logged into the channel <#${msg.mentions.channels.first().id}>.`);
			}
		} else {
			if (!guild || !guild.loggingChannel) {
				const guildPrefix = await getGuildPrefix(msg);
				if (msg.id) {
					msg.reply(`Be sure to use \`${guildPrefix}${this.name} channel <mentioned channel>\` to set a channel where this information should be logged into.`);
				}
				interaction.followUp(`Be sure to use \`${guildPrefix}${this.name} channel <mentioned channel>\` to set a channel where this information should be logged into.`);
			}
			if (!guild) {
				logDatabaseQueries(4, 'commands/logging.js DBGuilds create 2');
				guild = await DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name });
			}
			args.forEach(arg => {
				if (arg.toLowerCase() === 'nicknames') {
					if (guild.loggingNicknames) {
						guild.loggingNicknames = false;
						guild.save();
						if (msg.id) {
							msg.reply('Nickname changes will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Nickname changes will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingNicknames = true;
						guild.save();
						if (msg.id) {
							msg.reply('Nickname changes will now get logged in the specified channel.');
						} else {
							interaction.followUp('Nickname changes will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'usernames') {
					if (guild.loggingUsernames) {
						guild.loggingUsernames = false;
						guild.save();
						if (msg.id) {
							msg.reply('Username changes will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Username changes will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingUsernames = true;
						guild.save();
						if (msg.id) {
							msg.reply('Username changes will now get logged in the specified channel.');
						} else {
							interaction.followUp('Username changes will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'userdiscriminators') {
					if (guild.loggingDiscriminators) {
						guild.loggingDiscriminators = false;
						guild.save();
						if (msg.id) {
							msg.reply('Discriminator changes will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Discriminator changes will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingDiscriminators = true;
						guild.save();
						if (msg.id) {
							msg.reply('Discriminator changes will now get logged in the specified channel.');
						} else {
							interaction.followUp('Discriminator changes will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'useravatars') {
					if (guild.loggingAvatars) {
						guild.loggingAvatars = false;
						guild.save();
						if (msg.id) {
							msg.reply('Avatar changes will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Avatar changes will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingAvatars = true;
						guild.save();
						if (msg.id) {
							msg.reply('Avatar changes will now get logged in the specified channel.');
						} else {
							interaction.followUp('Avatar changes will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'userroles') {
					if (guild.loggingUserroles) {
						guild.loggingUserroles = false;
						guild.save();
						if (msg.id) {
							msg.reply('User role changes will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('User role changes will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingUserroles = true;
						guild.save();
						if (msg.id) {
							msg.reply('User role changes will now get logged in the specified channel.');
						} else {
							interaction.followUp('User role changes will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'userjoining') {
					if (guild.loggingMemberAdd) {
						guild.loggingMemberAdd = false;
						guild.save();
						if (msg.id) {
							msg.reply('Users joining will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Users joining will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingMemberAdd = true;
						guild.save();
						if (msg.id) {
							msg.reply('Users joining will now get logged in the specified channel.');
						} else {
							interaction.followUp('Users joining will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'userleaving') {
					if (guild.loggingMemberRemove) {
						guild.loggingMemberRemove = false;
						guild.save();
						if (msg.id) {
							msg.reply('Users leaving will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Users leaving will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingMemberRemove = true;
						guild.save();
						if (msg.id) {
							msg.reply('Users leaving will now get logged in the specified channel.');
						} else {
							interaction.followUp('Users leaving will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'rolecreate') {
					if (guild.loggingRoleCreate) {
						guild.loggingRoleCreate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Create roles will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Create roles will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingRoleCreate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Create roles will now get logged in the specified channel.');
						} else {
							interaction.followUp('Create roles will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'roleupdate') {
					if (guild.loggingRoleUpdate) {
						guild.loggingRoleUpdate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Updated roles will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Updated roles will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingRoleUpdate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Updated roles will now get logged in the specified channel.');
						} else {
							interaction.followUp('Updated roles will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'roledelete') {
					if (guild.loggingRoleDelete) {
						guild.loggingRoleDelete = false;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted roles will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted roles will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingRoleDelete = true;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted roles will now get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted roles will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'banadd') {
					if (guild.loggingBanAdd) {
						guild.loggingBanAdd = false;
						guild.save();
						if (msg.id) {
							msg.reply('Banned users will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Banned users will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingBanAdd = true;
						guild.save();
						if (msg.id) {
							msg.reply('Banned users will now get logged in the specified channel.');
						} else {
							interaction.followUp('Banned users will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'banremove') {
					if (guild.loggingBanRemove) {
						guild.loggingBanRemove = false;
						guild.save();
						if (msg.id) {
							msg.reply('Unbanned users will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Unbanned users will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingBanRemove = true;
						guild.save();
						if (msg.id) {
							msg.reply('Unbanned users will now get logged in the specified channel.');
						} else {
							interaction.followUp('Unbanned users will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'guildupdate') {
					if (guild.loggingGuildUpdate) {
						guild.loggingGuildUpdate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Guild updates will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Guild updates will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingGuildUpdate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Guild updates will now get logged in the specified channel.');
						} else {
							interaction.followUp('Guild updates will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'servermute') {
					if (guild.loggingServerMute) {
						guild.loggingServerMute = false;
						guild.save();
						if (msg.id) {
							msg.reply('Server mutes will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Server mutes will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingServerMute = true;
						guild.save();
						if (msg.id) {
							msg.reply('Server mutes will now get logged in the specified channel.');
						} else {
							interaction.followUp('Server mutes will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'serverdeaf') {
					if (guild.loggingServerDeaf) {
						guild.loggingServerDeaf = false;
						guild.save();
						if (msg.id) {
							msg.reply('Server deafs will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Server deafs will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingServerDeaf = true;
						guild.save();
						if (msg.id) {
							msg.reply('Server deafs will now get logged in the specified channel.');
						} else {
							interaction.followUp('Server deafs will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'joinvoice') {
					if (guild.loggingJoinVoice) {
						guild.loggingJoinVoice = false;
						guild.save();
						if (msg.id) {
							msg.reply('Joining voices will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Joining voices will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingJoinVoice = true;
						guild.save();
						if (msg.id) {
							msg.reply('Joining voices will now get logged in the specified channel.');
						} else {
							interaction.followUp('Joining voices will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'leavevoice') {
					if (guild.loggingLeaveVoice) {
						guild.loggingLeaveVoice = false;
						guild.save();
						if (msg.id) {
							msg.reply('Leaving voices will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Leaving voices will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingLeaveVoice = true;
						guild.save();
						if (msg.id) {
							msg.reply('Leaving voices will now get logged in the specified channel.');
						} else {
							interaction.followUp('Leaving voices will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'channelcreate') {
					if (guild.loggingChannelCreate) {
						guild.loggingChannelCreate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Created channels will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Created channels will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingChannelCreate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Created channels will now get logged in the specified channel.');
						} else {
							interaction.followUp('Created channels will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'channelupdate') {
					if (guild.loggingChannelUpdate) {
						guild.loggingChannelUpdate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Updated channels will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Updated channels will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingChannelUpdate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Updated channels will now get logged in the specified channel.');
						} else {
							interaction.followUp('Updated channels will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'channeldelete') {
					if (guild.loggingChannelDelete) {
						guild.loggingChannelDelete = false;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted channels will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted channels will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingChannelDelete = true;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted channels will now get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted channels will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'invitecreate') {
					if (guild.loggingInviteCreate) {
						guild.loggingInviteCreate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Created invites will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Created invites will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingInviteCreate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Created invites will now get logged in the specified channel.');
						} else {
							interaction.followUp('Created invites will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'invitedelete') {
					if (guild.loggingInviteDelete) {
						guild.loggingInviteDelete = false;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted invites will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted invites will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingInviteDelete = true;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted invites will now get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted invites will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'messageupdate') {
					if (guild.loggingMessageUpdate) {
						guild.loggingMessageUpdate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Updated messages will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Updated messages will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingMessageUpdate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Updated messages will now get logged in the specified channel.');
						} else {
							interaction.followUp('Updated messages will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'messagedelete') {
					if (guild.loggingMessageDelete) {
						guild.loggingMessageDelete = false;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted messages will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted messages will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingMessageDelete = true;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted messages will now get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted messages will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'emojicreate') {
					if (guild.loggingEmojiCreate) {
						guild.loggingEmojiCreate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Created emojis will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Created emojis will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingEmojiCreate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Created emojis will now get logged in the specified channel.');
						} else {
							interaction.followUp('Created emojis will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'emojiupdate') {
					if (guild.loggingEmojiUpdate) {
						guild.loggingEmojiUpdate = false;
						guild.save();
						if (msg.id) {
							msg.reply('Updated emojis will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Updated emojis will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingEmojiUpdate = true;
						guild.save();
						if (msg.id) {
							msg.reply('Updated emojis will now get logged in the specified channel.');
						} else {
							interaction.followUp('Updated emojis will now get logged in the specified channel.');
						}
					}
				} else if (arg.toLowerCase() === 'emojidelete') {
					if (guild.loggingEmojiDelete) {
						guild.loggingEmojiDelete = false;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted emojis will no longer get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted emojis will no longer get logged in the specified channel.');
						}
					} else {
						guild.loggingEmojiDelete = true;
						guild.save();
						if (msg.id) {
							msg.reply('Deleted emojis will now get logged in the specified channel.');
						} else {
							interaction.followUp('Deleted emojis will now get logged in the specified channel.');
						}
					}
				} else {
					if (msg.id) {
						msg.reply(`\`${arg.replace(/`/g, '')}\` is not a valid event to log.`);
					} else {
						interaction.followUp(`\`${arg.replace(/`/g, '')}\` is not a valid event to log.`);
					}
				}
			});
		}
	},
};