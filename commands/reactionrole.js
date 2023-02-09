const Discord = require('discord.js');
const { DBReactionRolesHeader, DBReactionRoles } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'reactionrole',
	description: 'Create and manage reaction roles',
	botPermissions: [PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageMessages],
	botPermissionsTranslated: 'Manage Roles and Manage Messages',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('reactionrole')
		.setNameLocalizations({
			'de': 'reaktionsrolle',
			'en-GB': 'reactionrole',
			'en-US': 'reactionrole',
		})
		.setDescription('Create and manage reaction roles')
		.setDescriptionLocalizations({
			'de': 'Erstellt und verwalte Reaktionsrollen',
			'en-GB': 'Create and manage reaction roles',
			'en-US': 'Create and manage reaction roles',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
		.addSubcommand(subcommand =>
			subcommand
				.setName('embedadd')
				.setNameLocalizations({
					'de': 'embedhinzufügen',
					'en-GB': 'embedadd',
					'en-US': 'embedadd',
				})
				.setDescription('Create a new embed for reactionroles')
				.setDescriptionLocalizations({
					'de': 'Erstellt ein neues Embed für Reaktionsrollen',
					'en-GB': 'Create a new embed for reactionroles',
					'en-US': 'Create a new embed for reactionroles',
				})
				.addStringOption(option =>
					option
						.setName('name')
						.setNameLocalizations({
							'de': 'name',
							'en-GB': 'name',
							'en-US': 'name',
						})
						.setDescription('The name of the embed')
						.setDescriptionLocalizations({
							'de': 'Der Name des Embeds',
							'en-GB': 'The name of the embed',
							'en-US': 'The name of the embed',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('embedremove')
				.setNameLocalizations({
					'de': 'embedentfernen',
					'en-GB': 'embedremove',
					'en-US': 'embedremove',
				})
				.setDescription('Remove an existing embed')
				.setDescriptionLocalizations({
					'de': 'Entfernt ein bestehendes Embed',
					'en-GB': 'Remove an existing embed',
					'en-US': 'Remove an existing embed',
				})
				.addStringOption(option =>
					option
						.setName('embedid')
						.setNameLocalizations({
							'de': 'embedid',
							'en-GB': 'embedid',
							'en-US': 'embedid',
						})
						.setDescription('The ID of the embed')
						.setDescriptionLocalizations({
							'de': 'Die ID des Embeds',
							'en-GB': 'The ID of the embed',
							'en-US': 'The ID of the embed',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('embedchange')
				.setNameLocalizations({
					'de': 'embedändern',
					'en-GB': 'embedchange',
					'en-US': 'embedchange',
				})
				.setDescription('Change an existing embed')
				.setDescriptionLocalizations({
					'de': 'Ändert ein bestehendes Embed',
					'en-GB': 'Change an existing embed',
					'en-US': 'Change an existing embed',
				})
				.addStringOption(option =>
					option
						.setName('embedid')
						.setNameLocalizations({
							'de': 'embedid',
							'en-GB': 'embedid',
							'en-US': 'embedid',
						})
						.setDescription('The ID of the embed')
						.setDescriptionLocalizations({
							'de': 'Die ID des Embeds',
							'en-GB': 'The ID of the embed',
							'en-US': 'The ID of the embed',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('property')
						.setNameLocalizations({
							'de': 'eigenschaft',
							'en-GB': 'property',
							'en-US': 'property',
						})
						.setDescription('The property to change')
						.setDescriptionLocalizations({
							'de': 'Die Eigenschaft, die geändert werden soll',
							'en-GB': 'The property to change',
							'en-US': 'The property to change',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Title', value: 'title' },
							{ name: 'Description', value: 'description' },
							{ name: 'Color', value: 'color' },
							{ name: 'Image', value: 'image' },
						)
				)
				.addStringOption(option =>
					option
						.setName('value')
						.setNameLocalizations({
							'de': 'wert',
							'en-GB': 'value',
							'en-US': 'value',
						})
						.setDescription('The new title/description/color/image URL')
						.setDescriptionLocalizations({
							'de': 'Der neue Titel/Beschreibung/Farbe/Bild-URL',
							'en-GB': 'The new title/description/color/image URL',
							'en-US': 'The new title/description/color/image URL',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('roleadd')
				.setNameLocalizations({
					'de': 'rollehinzufügen',
					'en-GB': 'roleadd',
					'en-US': 'roleadd',
				})
				.setDescription('Add a role to an embed')
				.setDescriptionLocalizations({
					'de': 'Fügt eine Rolle zu einem Embed hinzu',
					'en-GB': 'Add a role to an embed',
					'en-US': 'Add a role to an embed',
				})
				.addStringOption(option =>
					option
						.setName('embedid')
						.setNameLocalizations({
							'de': 'embedid',
							'en-GB': 'embedid',
							'en-US': 'embedid',
						})
						.setDescription('The ID of the embed')
						.setDescriptionLocalizations({
							'de': 'Die ID des Embeds',
							'en-GB': 'The ID of the embed',
							'en-US': 'The ID of the embed',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('emoji')
						.setNameLocalizations({
							'de': 'emoji',
							'en-GB': 'emoji',
							'en-US': 'emoji',
						})
						.setDescription('The emoji to represent the role')
						.setDescriptionLocalizations({
							'de': 'Das Emoji, das die Rolle repräsentiert',
							'en-GB': 'The emoji to represent the role',
							'en-US': 'The emoji to represent the role',
						})
						.setRequired(true)
				)
				.addRoleOption(option =>
					option
						.setName('role')
						.setNameLocalizations({
							'de': 'rolle',
							'en-GB': 'role',
							'en-US': 'role',
						})
						.setDescription('The role to add')
						.setDescriptionLocalizations({
							'de': 'Die Rolle, die hinzugefügt werden soll',
							'en-GB': 'The role to add',
							'en-US': 'The role to add',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('description')
						.setNameLocalizations({
							'de': 'beschreibung',
							'en-GB': 'description',
							'en-US': 'description',
						})
						.setDescription('The description of the role')
						.setDescriptionLocalizations({
							'de': 'Die Beschreibung der Rolle',
							'en-GB': 'The description of the role',
							'en-US': 'The description of the role',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('roleremove')
				.setNameLocalizations({
					'de': 'rolleentfernen',
					'en-GB': 'roleremove',
					'en-US': 'roleremove',
				})
				.setDescription('Remove a role from an embed')
				.setDescriptionLocalizations({
					'de': 'Entfernt eine Rolle von einem Embed',
					'en-GB': 'Remove a role from an embed',
					'en-US': 'Remove a role from an embed',
				})
				.addStringOption(option =>
					option
						.setName('embedid')
						.setNameLocalizations({
							'de': 'embedid',
							'en-GB': 'embedid',
							'en-US': 'embedid',
						})
						.setDescription('The ID of the embed')
						.setDescriptionLocalizations({
							'de': 'Die ID des Embeds',
							'en-GB': 'The ID of the embed',
							'en-US': 'The ID of the embed',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('emoji')
						.setNameLocalizations({
							'de': 'emoji',
							'en-GB': 'emoji',
							'en-US': 'emoji',
						})
						.setDescription('The emoji to represent the role')
						.setDescriptionLocalizations({
							'de': 'Das Emoji, das die Rolle repräsentiert',
							'en-GB': 'The emoji to represent the role',
							'en-US': 'The emoji to represent the role',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('rolechange')
				.setNameLocalizations({
					'de': 'rolleändern',
					'en-GB': 'rolechange',
					'en-US': 'rolechange',
				})
				.setDescription('Change an existing reactionrole')
				.setDescriptionLocalizations({
					'de': 'Ändert eine bestehende Reaktionsrolle',
					'en-GB': 'Change an existing reactionrole',
					'en-US': 'Change an existing reactionrole',
				})
				.addStringOption(option =>
					option
						.setName('embedid')
						.setNameLocalizations({
							'de': 'embedid',
							'en-GB': 'embedid',
							'en-US': 'embedid',
						})
						.setDescription('The ID of the embed')
						.setDescriptionLocalizations({
							'de': 'Die ID des Embeds',
							'en-GB': 'The ID of the embed',
							'en-US': 'The ID of the embed',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('emoji')
						.setNameLocalizations({
							'de': 'emoji',
							'en-GB': 'emoji',
							'en-US': 'emoji',
						})
						.setDescription('The emoji that represents the role')
						.setDescriptionLocalizations({
							'de': 'Das Emoji, das die Rolle repräsentiert',
							'en-GB': 'The emoji that represents the role',
							'en-US': 'The emoji that represents the role',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('property')
						.setNameLocalizations({
							'de': 'eigenschaft',
							'en-GB': 'property',
							'en-US': 'property',
						})
						.setDescription('The property to change')
						.setDescriptionLocalizations({
							'de': 'Die Eigenschaft, die geändert werden soll',
							'en-GB': 'The property to change',
							'en-US': 'The property to change',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Emoji', value: 'emoji' },
							{ name: 'Description', value: 'description' },
						)
				)
				.addStringOption(option =>
					option
						.setName('value')
						.setNameLocalizations({
							'de': 'wert',
							'en-GB': 'value',
							'en-US': 'value',
						})
						.setDescription('The new emoji/description')
						.setDescriptionLocalizations({
							'de': 'Das neue Emoji/Beschreibung',
							'en-GB': 'The new emoji/description',
							'en-US': 'The new emoji/description',
						})
						.setRequired(true)
				)
		),
	async execute(msg, args, interaction, additionalObjects) {
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

			if (interaction.options.getSubcommand().startsWith('embed')) {
				args = ['embed', interaction.options.getSubcommand().substring(5)];
			} else {
				args = ['role', interaction.options.getSubcommand().substring(4)];
			}

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}
		//Check the first argument
		if (args[0].toLowerCase() === 'embed') {
			//Check the second argument
			if (args[1].toLowerCase() === 'add') {
				//Check if a name was set for the embed
				if (args[2]) {
					//Remove the first two items
					args.shift();
					args.shift();
					//Join the name string
					const embedName = args.join(' ');
					logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed add');
					//Get the last created record for the next embedId
					const reactionRolesHeader = await DBReactionRolesHeader.findOne({
						order: [
							['id', 'DESC'],
						],
					});

					//Predict the next embedId
					let embedId;
					if (reactionRolesHeader) {
						embedId = reactionRolesHeader.id + 1;
					} else {
						embedId = '1';
					}

					//Create embed
					const reactionRoleEmbed = new Discord.EmbedBuilder()
						.setColor('#0099ff')
						.setTitle(embedName)
						.setFooter({ text: `Reactionrole - EmbedId: ${embedId}` });

					if (!msg.id) {
						interaction.editReply({ content: 'Embed will be created', ephemeral: true });
					}
					//Send embed
					const embedMessage = await msg.channel.send({ embeds: [reactionRoleEmbed] });
					//Create the record for the embed in the db
					logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed add create');
					DBReactionRolesHeader.create({ guildId: embedMessage.guild.id, reactionHeaderId: embedMessage.id, reactionChannelHeaderId: msg.channel.id, reactionTitle: embedName, reactionColor: '#0099ff' });
				} else {
					msg.reply('Please specify what name you want to give the embed you want to create.');
					sendHelp(msg);
				}

				//Check the second argument
			} else if (args[1].toLowerCase() === 'remove') {
				if (!(isNaN(args[2]))) {
					logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed remove');
					//Get the embed which should get deleted
					const reactionRolesHeader = await DBReactionRolesHeader.findOne({
						where: { guildId: msg.guildId, id: args[2] },
					});

					//Check if it was found in the db
					if (reactionRolesHeader) {
						//Get the Id of the message
						const embedMessageId = reactionRolesHeader.reactionHeaderId;
						//get the Id of the channel
						const embedChannelId = reactionRolesHeader.reactionChannelHeaderId;
						//Get the channel object
						let embedChannel;
						try {
							embedChannel = msg.guild.channels.cache.get(embedChannelId);
						} catch (e) {
							if (msg.id) {
								msg.reply('Couldn\'t find an embed with this EmbedId');
							} else {
								interaction.editReply({ content: 'Couldn\'t find an embed with this EmbedId', ephemeral: true });
							}
							logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed remove destroy 1');
							DBReactionRolesHeader.destroy({
								where: { guildId: msg.guildId, id: args[2] },
							});
							return console.error(e);
						}
						//Get the message object
						const embedMessage = await embedChannel.messages.fetch({ message: embedMessageId });
						if (!msg.id) {
							interaction.editReply({ content: 'Embed will be deleted', ephemeral: true });
						}
						//Delete the embed
						embedMessage.delete();
						//Delete the record from the db
						logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed remove destroy 2');
						DBReactionRolesHeader.destroy({
							where: { guildId: msg.guildId, id: args[2] },
						});
					} else {
						if (msg.id) {
							msg.reply('Couldn\'t find an embed with this EmbedId');
						} else {
							interaction.editReply({ content: 'Couldn\'t find an embed with this EmbedId', ephemeral: true });
						}
					}
				} else {
					msg.reply('Please specify what Id the embed has you want to remove. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
			} else if (args[1].toLowerCase() === 'change') {
				if (!(isNaN(args[2]))) {
					if (args[3].toLowerCase() === 'title') {
						logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed change title');
						//Get embed from the db
						const reactionRolesHeader = await DBReactionRolesHeader.findOne({
							where: { guildId: msg.guildId, id: args[2] },
						});

						//Check if it was found in the db
						if (reactionRolesHeader) {
							args.shift();
							args.shift();
							args.shift();
							args.shift();
							reactionRolesHeader.reactionTitle = args.join(' ');
							reactionRolesHeader.save().then(
								editEmbed(msg, reactionRolesHeader, additionalObjects[0])
							);

							if (msg.id) {
								return msg.reply('The title for the specified embed has been changed.');
							}
							return interaction.editReply({ content: 'The title for the specified embed has been changed.', ephemeral: true });
						} else {
							if (msg.id) {
								return msg.reply('Couldn\'t find an embed with this EmbedId');
							}
							return interaction.editReply({ content: 'Couldn\'t find an embed with this EmbedId', ephemeral: true });
						}
					} else if (args[3].toLowerCase() === 'description') {
						logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed change description');
						//Get embed from the db
						const reactionRolesHeader = await DBReactionRolesHeader.findOne({
							where: { guildId: msg.guildId, id: args[2] },
						});

						//Check if it was found in the db
						if (reactionRolesHeader) {
							args.shift();
							args.shift();
							args.shift();
							args.shift();
							reactionRolesHeader.reactionDescription = args.join(' ');
							reactionRolesHeader.save().then(
								editEmbed(msg, reactionRolesHeader, additionalObjects[0])
							);

							if (msg.id) {
								return msg.reply('The description for the specified embed has been changed.');
							}
							return interaction.editReply({ content: 'The description for the specified embed has been changed.', ephemeral: true });
						} else {
							if (msg.id) {
								return msg.reply('Couldn\'t find an embed with this EmbedId');
							}
							return interaction.editReply({ content: 'Couldn\'t find an embed with this EmbedId', ephemeral: true });
						}
					} else if (args[3].toLowerCase() === 'color') {
						if (args[4].startsWith('#') && args[4].length === 7) {

							const embedColor = args[4];

							logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed change color');
							//Get embed from the db
							const reactionRolesHeader = await DBReactionRolesHeader.findOne({
								where: { guildId: msg.guildId, id: args[2] },
							});

							//Check if it was found in the db
							if (reactionRolesHeader) {
								args.shift();
								args.shift();
								args.shift();
								args.shift();
								reactionRolesHeader.reactionColor = embedColor;
								reactionRolesHeader.save().then(
									editEmbed(msg, reactionRolesHeader, additionalObjects[0])
								);

								if (msg.id) {
									return msg.reply('The color for the specified embed has been changed.');
								}
								return interaction.editReply({ content: 'The color for the specified embed has been changed.', ephemeral: true });
							} else {
								if (msg.id) {
									return msg.reply('Couldn\'t find an embed with this EmbedId');
								}
								return interaction.editReply({ content: 'Couldn\'t find an embed with this EmbedId', ephemeral: true });
							}
						} else {
							if (msg.id) {
								return msg.reply('Please send a color in a format like \'#0099ff\'');
							}
							return interaction.editReply({ content: 'Please send a color in a format like \'#0099ff\'', ephemeral: true });
						}
					} else if (args[3].toLowerCase() === 'image') {

						const embedImage = args[4];

						logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader embed image');
						//Get embed from the db
						const reactionRolesHeader = await DBReactionRolesHeader.findOne({
							where: { guildId: msg.guildId, id: args[2] },
						});

						//Check if it was found in the db
						if (reactionRolesHeader) {
							args.shift();
							args.shift();
							args.shift();
							args.shift();
							reactionRolesHeader.reactionImage = embedImage;
							reactionRolesHeader.save().then(
								editEmbed(msg, reactionRolesHeader, additionalObjects[0])
							);

							if (msg.id) {
								return msg.reply('The image for the specified embed has been changed.');
							}
							return interaction.editReply({ content: 'The image for the specified embed has been changed.', ephemeral: true });
						} else {
							if (msg.id) {
								return msg.reply('Couldn\'t find an embed with this EmbedId');
							}
							return interaction.editReply({ content: 'Couldn\'t find an embed with this EmbedId', ephemeral: true });
						}
					} else {
						msg.reply('Please specify what you want to change: <title/description/color/image>');
						sendHelp(msg);
					}
				} else {
					msg.reply('Please specify what Id the embed has you want to change. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
			} else {
				//incorrect second argument
				msg.reply('Please specify if you want to add, remove or change the embed.');
				sendHelp(msg);
			}
			//Check the first argument
		} else if (args[0].toLowerCase() === 'role') {
			//Check the second argument
			if (args[1].toLowerCase() === 'add') {
				//Check the third argument if it is an possible embedId
				if (!(isNaN(args[2]))) {
					//Check if there is a role mentioned in the message
					if (interaction || msg.mentions.roles.first() && args[4].startsWith('<@&')) {
						if (args[5]) {

							const headerId = args[2];
							const roleMentioned = args[4].replace('<@&', '').replace('>', '');

							logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader role add');
							//Get embed from the db
							const reactionRolesHeader = await DBReactionRolesHeader.findOne({
								where: { guildId: msg.guildId, id: headerId },
							});

							if (reactionRolesHeader) {
								logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRoles role add 1');
								const reactionRolesEmoji = await DBReactionRoles.findOne({
									where: { dbReactionRolesHeaderId: headerId, emoji: args[3] },
								});

								logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRoles role add 2');
								const reactionRolesRole = await DBReactionRoles.findOne({
									where: { dbReactionRolesHeaderId: headerId, roleId: roleMentioned },
								});

								if (reactionRolesEmoji) {
									if (msg.id) {
										return msg.reply('There is already a reactionrole with this emoji in the specified embed.');
									}
									return interaction.editReply({ content: 'There is already a reactionrole with this emoji in the specified embed.', ephemeral: true });
								} else if (reactionRolesRole) {
									if (msg.id) {
										return msg.reply('There is already a reactionrole with this role in the specified embed.');
									}
									return interaction.editReply({ content: 'There is already a reactionrole with this role in the specified embed.', ephemeral: true });
								} else {
									const emoji = args[3];
									args.shift();
									args.shift();
									args.shift();
									args.shift();
									args.shift();

									logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRoles role add count');
									let totalEmojis = await DBReactionRoles.count({
										where: { dbReactionRolesHeaderId: headerId },
									});

									if (totalEmojis == 20) {
										if (msg.id) {
											return msg.reply('You can only have a maximum of 20 reactionroles in one embed.');
										}
										return interaction.editReply({ content: 'You can only have a maximum of 20 reactionroles in one embed.', ephemeral: true });
									}

									logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRoles role add create');
									DBReactionRoles.create({ dbReactionRolesHeaderId: headerId, roleId: roleMentioned, emoji: emoji, description: args.join(' ') });
									if (msg.id) {
										msg.reply('The role has been added as an reactionrole.');
									} else {
										interaction.editReply({ content: 'The role has been added as an reactionrole.', ephemeral: true });
									}

									//Edit embed
									editEmbed(msg, reactionRolesHeader, additionalObjects[0]);
								}
							} else {
								if (msg.id) {
									return msg.reply('Couldn\'t find an embed with this EmbedId');
								}
								return interaction.editReply({ content: 'Couldn\'t find an embed with this EmbedId', ephemeral: true });
							}
						} else {
							msg.reply('You didn\'t provide a description for the role!');
							sendHelp(msg);
						}
					} else {
						msg.reply('You didn\'t specify the role you want to add to the embed!');
						sendHelp(msg);
					}
				} else {
					msg.reply('Please specify what Id the embed has you want to add a role to. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
				//Check the second argument
			} else if (args[1].toLowerCase() === 'remove') {
				//Check the third argument if it is an possible embedId
				if (!(isNaN(args[2]))) {
					//Check for a fourth argument
					if (args[3]) {
						//Get headerId
						const headerId = args[2];
						const emoji = args[3];

						logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader role remove');
						//Get embed from the db
						const reactionRolesHeader = await DBReactionRolesHeader.findOne({
							where: { guildId: msg.guildId, id: headerId },
						});

						if (reactionRolesHeader) {
							logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader role remove destroy');
							const rowCount = await DBReactionRoles.destroy({
								where: { dbReactionRolesHeaderId: headerId, emoji: emoji }
							});

							if (rowCount > 0) {
								//Edit embed
								editEmbed(msg, reactionRolesHeader, additionalObjects[0]);

								if (interaction) {
									interaction.editReply({ content: 'The role has been removed', ephemeral: true });
								}
							} else {
								if (msg.id) {
									return msg.reply('There were no reactionrole found in the embed with this emoji.');
								}
								return interaction.editReply({ content: 'There were no reactionrole found in the embed with this emoji.', ephemeral: true });
							}
						}
					}
				} else {
					msg.reply('Please specify what Id the embed has you want to add a role to. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
				//Check the second argument
			} else if (args[1].toLowerCase() === 'change') {
				//Check the third argument if it is an possible embedId
				if (!(isNaN(args[2]))) {
					//Get headerId
					const headerId = args[2];

					logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRolesHeader role change');
					//Get embed from the db
					const reactionRolesHeader = await DBReactionRolesHeader.findOne({
						where: { guildId: msg.guildId, id: headerId },
					});

					//Check if there was an embed found in the same guild
					if (reactionRolesHeader) {
						//Get emoji
						const emoji = args[3];
						logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRoles role change');
						//Try to get a reactionRole from the db where there is the same emoji for the embed
						const reactionRolesEmoji = await DBReactionRoles.findOne({
							where: { dbReactionRolesHeaderId: headerId, emoji: emoji },
						});

						//Check if there is an reactionRole with this emoji
						if (reactionRolesEmoji) {
							if (args[4].toLowerCase() === 'emoji') {
								reactionRolesEmoji.emoji = args[5];
								reactionRolesEmoji.save()
									.then(editEmbed(msg, reactionRolesHeader, additionalObjects[0]));
								if (interaction) {
									interaction.editReply({ content: 'The emoji has been changed', ephemeral: true });
								}
							} else if (args[4].toLowerCase() === 'description') {
								args.shift();
								args.shift();
								args.shift();
								args.shift();
								args.shift();
								reactionRolesEmoji.description = args.join(' ');
								reactionRolesEmoji.save()
									.then(editEmbed(msg, reactionRolesHeader, additionalObjects[0]));
								if (interaction) {
									interaction.editReply({ content: 'The description has been changed', ephemeral: true });
								}
							} else {
								msg.reply('Please specify if you want to change the emoji or the description.');
								sendHelp(msg);
							}
						} else {
							if (msg.id) {
								return msg.reply('Couldn\'t find a reactionrole with this emoji in the specified embed.');
							}
							return interaction.editReply({ content: 'Couldn\'t find a reactionrole with this emoji in the specified embed.', ephemeral: true });
						}
					} else {
						if (msg.id) {
							return msg.reply('Couldn\'t find an embed with this EmbedId');
						}
						return interaction.editReply({ content: 'Couldn\'t find an embed with this EmbedId', ephemeral: true });
					}
				} else {
					msg.reply('Please specify what Id the embed has you want to add a role to. (Can be found in the footer of the embed.)');
					sendHelp(msg);
				}
			} else {
				//incorrect second argument
				msg.reply('Please specify if you want to add or remove the embed.');
				sendHelp(msg);
			}
		} else if (args[0].toLowerCase() === 'help') {
			sendHelp(msg);
		} else {
			//Incorrect first argument
			msg.reply('Please provide what kind of object you want to add / remove.');
			sendHelp(msg);
		}
	},
};

async function editEmbed(msg, reactionRolesHeader, client) {
	//Create embed
	const reactionRoleEmbed = new Discord.EmbedBuilder()
		.setColor(reactionRolesHeader.reactionColor)
		.setTitle(reactionRolesHeader.reactionTitle)
		.setThumbnail(reactionRolesHeader.reactionImage)
		.setFooter({ text: `Reactionrole - EmbedId: ${reactionRolesHeader.id}` });

	//Set description if available
	if (reactionRolesHeader.reactionDescription) {
		reactionRoleEmbed.setDescription(reactionRolesHeader.reactionDescription);
	}

	logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRoles editEmbed');
	//Get roles from db
	const reactionRoles = await DBReactionRoles.findAll({
		where: { dbReactionRolesHeaderId: reactionRolesHeader.id }
	});

	//Add roles to embed
	reactionRoles.forEach(reactionRole => {
		//Get role object
		let reactionRoleName = msg.guild.roles.cache.get(reactionRole.roleId);
		//Add field to embed
		reactionRoleEmbed.addFields([{ name: reactionRole.emoji + ': ' + reactionRoleName.name, value: reactionRole.description }]);
	});

	//Get the Id of the message
	const embedMessageId = reactionRolesHeader.reactionHeaderId;
	//get the Id of the channel
	const embedChannelId = reactionRolesHeader.reactionChannelHeaderId;
	//Get the channel object
	let embedChannel;
	try {
		embedChannel = msg.guild.channels.cache.get(embedChannelId);
	} catch (e) {
		msg.reply('Couldn\'t find an embed with this EmbedId');
		logDatabaseQueries(4, 'commands/reactionrole.js DBReactionRoles editEmbed destroy');
		DBReactionRolesHeader.destroy({
			where: { guildId: msg.guildId, id: reactionRolesHeader.id },
		});
		return console.error(e);
	}
	//Get the message object
	let embedMessage = await embedChannel.messages.fetch({ message: embedMessageId });

	//Check if its a message from the old bot to handle legacy embeds
	if (embedMessage.author.id === client.user.id) {
		//Edit the message if same user
		embedMessage.edit({ embeds: [reactionRoleEmbed] });
	} else {
		//Delete the message if different user and send a new one
		try {
			await embedMessage.delete();
		} catch (e) {
			await embedChannel.send('Couldn\'t delete the old embed, please do so manually. (Can\'t be edited anymore due to the migration to the new account)');
		}
		embedMessage = await embedChannel.send({ embeds: [reactionRoleEmbed] });
		reactionRolesHeader.reactionHeaderId = embedMessage.id;
		reactionRolesHeader.save();
	}

	//Remove all reactions from the embed
	embedMessage.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));

	//Add reactions to embed
	for (let i = 0; i < reactionRoles.length; i++) {
		//Add reaction
		await embedMessage.react(reactionRoles[i].emoji);
	}
}

async function sendHelp(msg) {
	let guildPrefix = await getGuildPrefix(msg);

	let helpString = `Correct usage for creating a new embed:\n\`\`\`${guildPrefix}reactionrole embed add <name of the embed>\`\`\``;
	helpString += `Correct usage for removing an existing embed:\n\`\`\`${guildPrefix}reactionrole embed remove <embedId which can be found in the footer>\`\`\``;
	helpString += `Correct usage for changing an existing embed's appearance:\n\`\`\`${guildPrefix}reactionrole embed change <embedId> <title/description/color/image> <new title/description/color/image URL>\`\`\``;
	helpString += `Correct usage for adding a role to an embed:\n\`\`\`${guildPrefix}reactionrole role add <embedId> <emoji for the role> <@role> <description>\`\`\``;
	helpString += `Correct usage for removing a role from an embed:\n\`\`\`${guildPrefix}reactionrole role remove <embedId> <emoji of the role>\`\`\``;
	helpString += `Correct usage for changing a role in an embed:\n\`\`\`${guildPrefix}reactionrole role change <embedId> <emoji of the role> <emoji/description> <new emoji/description>\`\`\``;
	msg.reply(helpString);
}
