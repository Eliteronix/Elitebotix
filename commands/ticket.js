const { DBGuilds, DBTickets, DBProcessQueue } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'ticket',
	description: 'Ticket manager',
	botPermissions: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages, Manage Channels and Manage Roles',
	cooldown: 10,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('ticket')
		.setNameLocalizations({
			'de': 'ticket',
			'en-GB': 'ticket',
			'en-US': 'ticket',
		})
		.setDescription('Create and manage tickets')
		.setDescriptionLocalizations({
			'de': 'Erstelle und verwalte Tickets',
			'en-GB': 'Create and manage tickets',
			'en-US': 'Create and manage tickets',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand
				.setName('create')
				.setNameLocalizations({
					'de': 'erstellen',
					'en-GB': 'create',
					'en-US': 'create',
				})
				.setDescription('Create a ticket')
				.setDescriptionLocalizations({
					'de': 'Erstelle ein Ticket',
					'en-GB': 'Create a ticket',
					'en-US': 'Create a ticket',
				})
				.addStringOption(option =>
					option
						.setName('issue')
						.setNameLocalizations({
							'de': 'problem',
							'en-GB': 'issue',
							'en-US': 'issue',
						})
						.setDescription('The issue description for your ticket')
						.setDescriptionLocalizations({
							'de': 'Die Beschreibung des Problems für dein Ticket',
							'en-GB': 'The issue description for your ticket',
							'en-US': 'The issue description for your ticket',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('state')
				.setNameLocalizations({
					'de': 'status',
					'en-GB': 'state',
					'en-US': 'state',
				})
				.setDescription('Manage a ticket\'s workflow state')
				.setDescriptionLocalizations({
					'de': 'Verwalte den Status eines Tickets',
					'en-GB': 'Manage a ticket\'s workflow state',
					'en-US': 'Manage a ticket\'s workflow state',
				})
				.addStringOption(option =>
					option
						.setName('state')
						.setNameLocalizations({
							'de': 'status',
							'en-GB': 'state',
							'en-US': 'state',
						})
						.setDescription('The ticket\'s workflow state')
						.setDescriptionLocalizations({
							'de': 'Der Status des Tickets',
							'en-GB': 'The ticket\'s workflow state',
							'en-US': 'The ticket\'s workflow state',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Responded', value: 'responded' },
							{ name: 'In action', value: 'action' },
							{ name: 'Close', value: 'close' },
						)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('addrole')
				.setNameLocalizations({
					'de': 'rollehinzufügen',
					'en-GB': 'addrole',
					'en-US': 'addrole',
				})
				.setDescription('Add a role to a ticket')
				.setDescriptionLocalizations({
					'de': 'Füge eine Rolle zu einem Ticket hinzu',
					'en-GB': 'Add a role to a ticket',
					'en-US': 'Add a role to a ticket',
				})
				.addRoleOption(option =>
					option
						.setName('role')
						.setNameLocalizations({
							'de': 'rolle',
							'en-GB': 'role',
							'en-US': 'role',
						})
						.setDescription('The role to add to the ticket')
						.setDescriptionLocalizations({
							'de': 'Die Rolle, die dem Ticket hinzugefügt werden soll',
							'en-GB': 'The role to add to the ticket',
							'en-US': 'The role to add to the ticket',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('removerole')
				.setNameLocalizations({
					'de': 'rolleentfernen',
					'en-GB': 'removerole',
					'en-US': 'removerole',
				})
				.setDescription('Remove a role from a ticket')
				.setDescriptionLocalizations({
					'de': 'Entferne eine Rolle von einem Ticket',
					'en-GB': 'Remove a role from a ticket',
					'en-US': 'Remove a role from a ticket',
				})
				.addRoleOption(option =>
					option
						.setName('role')
						.setNameLocalizations({
							'de': 'rolle',
							'en-GB': 'role',
							'en-US': 'role',
						})
						.setDescription('The role to remove from the ticket')
						.setDescriptionLocalizations({
							'de': 'Die Rolle, die vom Ticket entfernt werden soll',
							'en-GB': 'The role to remove from the ticket',
							'en-US': 'The role to remove from the ticket',
						})
						.setRequired(true)
				)
		),
	// eslint-disable-next-line no-unused-vars
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

			if (interaction.options.getSubcommand() === 'create') {
				args = interaction.options._hoistedOptions[0].value.split(' ');
			} else if (interaction.options.getSubcommand() === 'state') {
				args = interaction.options._hoistedOptions[0].value;
			} else if (interaction.options.getSubcommand() === 'addrole') {
				args = ['add', interaction.options._hoistedOptions[0].value];
			} else if (interaction.options.getSubcommand() === 'removerole') {
				args = ['remove', interaction.options._hoistedOptions[0].value];
			}
		}

		logDatabaseQueries(4, 'commands/ticket.js DBGuilds');
		//get guild from db
		//TODO: add attributes and logdatabasequeries
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId, ticketsEnabled: true },
		});

		if (guild) {
			if (args[0].toLowerCase() === 'add') {
				//TODO: add attributes and logdatabasequeries
				logDatabaseQueries(4, 'commands/ticket.js DBTickets add');
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guildId, channelId: msg.channel.id }
				});

				if (ticket) {
					if (ticket.creatorId === msg.author.id && msg.guild.ownerId !== msg.author.id) {
						if (interaction) {
							await interaction.editReply('You don\'t have permissions to add roles to the ticket.');
						}
						return;
					}

					msg.mentions.users.forEach(user => {
						ticket.additionalParties = `${ticket.additionalParties};${user.id}`;
					});

					msg.mentions.roles.forEach(role => {
						ticket.additionalParties = `${ticket.additionalParties};${role.id}`;
					});
					ticket.save();

					if (interaction) {
						await interaction.editReply('The role has been added to the ticket.');
					}
					return await setPermissions(msg.channel, ticket);
				}
				if (interaction) {
					return await interaction.editReply('This is not a valid ticket channel.');
				}
			} else if (args[0].toLowerCase() === 'remove') {
				//TODO: add attributes and logdatabasequeries
				logDatabaseQueries(4, 'commands/ticket.js DBTickets remove');
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guildId, channelId: msg.channel.id }
				});

				if (ticket) {
					if (ticket.creatorId === msg.author.id && msg.guild.ownerId !== msg.author.id) {
						if (interaction) {
							await interaction.editReply('You don\'t have permissions to remove roles from the ticket.');
						}
						return;
					}

					msg.mentions.users.forEach(user => {
						let oldLength = ticket.additionalParties.length;
						let newLength = 0;
						while (oldLength !== newLength) {
							oldLength = ticket.additionalParties.length;
							ticket.additionalParties = ticket.additionalParties.replace(`;${user.id}`);
							newLength = ticket.additionalParties.length;
						}
					});

					msg.mentions.roles.forEach(role => {
						let oldLength = ticket.additionalParties.length;
						let newLength = 0;
						while (oldLength !== newLength) {
							oldLength = ticket.additionalParties.length;
							ticket.additionalParties = ticket.additionalParties.replace(`;${role.id}`);
							newLength = ticket.additionalParties.length;
						}
					});
					ticket.save();

					if (interaction) {
						await interaction.editReply('The role has been removed from the ticket.');
					}
					return await setPermissions(msg.channel, ticket);
				}
				if (interaction) {
					return await interaction.editReply('This is not a valid ticket channel.');
				}
			} else if (args[0].toLowerCase() === 'responded' || args[0].toLowerCase() === 'r') {
				//TODO: add attributes and logdatabasequeries
				logDatabaseQueries(4, 'commands/ticket.js DBTickets responded');
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guildId, channelId: msg.channel.id }
				});

				if (ticket) {
					if (ticket.creatorId === msg.author.id && msg.guild.ownerId !== msg.author.id) {
						if (interaction) {
							await interaction.editReply('You don\'t have permissions to change the ticket state.');
						}
						return;
					}
					if (ticket.statusId === 100) {
						if (msg.id) {
							return msg.reply('The ticket is already closed. Please create a new ticket instead.');
						}
						return await interaction.editReply('The ticket is already closed. Please create a new ticket instead.');
					}
					ticket.statusId = 25;
					ticket.statusName = 'Responded';
					ticket.save();

					//Move the channel to the correct category
					let repondedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Responded');
					if (!repondedCategory) {
						repondedCategory = await msg.guild.channels.create('Tickets - Responded', { type: Discord.ChannelType.GuildCategory });
						await repondedCategory.permissionOverwrites.set([
							{
								id: msg.guild.roles.everyone.id,
								deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
							},
						]);
						let openCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
						let position = 0;
						if (openCategory) {
							position++;
						}
						await repondedCategory.setPosition(position);
					}
					await msg.channel.setParent(repondedCategory);

					await setPermissions(msg.channel, ticket);

					if (interaction) {
						await interaction.editReply('The ticket state has been updated.');
					} else {
						msg.delete();
					}
					removeEmptyCategories(msg);
				} else {
					if (msg.id) {
						return msg.reply('This is not a valid ticket channel.');
					}
					return await interaction.editReply('This is not a valid ticket channel.');
				}
				return;
			} else if (args[0].toLowerCase() === 'action' || args[0].toLowerCase() === 'a') {
				//TODO: add attributes and logdatabasequeries
				logDatabaseQueries(4, 'commands/ticket.js DBTickets action');
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guildId, channelId: msg.channel.id }
				});

				if (ticket) {
					if (ticket.creatorId === msg.author.id && msg.guild.ownerId !== msg.author.id) {
						if (interaction) {
							await interaction.editReply('You don\'t have permissions to change the ticket state.');
						}
						return;
					}
					if (ticket.statusId === 100) {
						if (msg.id) {
							return msg.reply('The ticket is already closed. Please create a new ticket instead.');
						}
						return await interaction.editReply('The ticket is already closed. Please create a new ticket instead.');
					}
					ticket.statusId = 50;
					ticket.statusName = 'In action';
					ticket.save();

					//Move the channel to the correct category
					let inActionCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - In Action');
					if (!inActionCategory) {
						inActionCategory = await msg.guild.channels.create('Tickets - In Action', { type: Discord.ChannelType.GuildCategory });
						await inActionCategory.permissionOverwrites.set([
							{
								id: msg.guild.roles.everyone.id,
								deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
							},
						]);
						let openCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
						let position = 0;
						if (openCategory) {
							position++;
						}
						let respondedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Responded');
						if (respondedCategory) {
							position++;
						}
						await inActionCategory.setPosition(position);
					}
					await msg.channel.setParent(inActionCategory);

					await setPermissions(msg.channel, ticket);

					if (interaction) {
						await interaction.editReply('The ticket state has been updated.');
					} else {
						msg.delete();
					}
					removeEmptyCategories(msg);
				} else {
					if (msg.id) {
						return msg.reply('This is not a valid ticket channel.');
					}
					return await interaction.editReply('This is not a valid ticket channel.');
				}
				return;
			} else if (args[0].toLowerCase() === 'close' || args[0].toLowerCase() === 'c') {
				//TODO: add attributes and logdatabasequeries
				logDatabaseQueries(4, 'commands/ticket.js DBTickets close');
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guildId, channelId: msg.channel.id }
				});

				if (ticket) {
					if (ticket.creatorId === msg.author.id && msg.guild.ownerId !== msg.author.id) {
						if (interaction) {
							await interaction.editReply('You don\'t have permissions to change the ticket state.');
						}
						return;
					}
					if (ticket.statusId === 100) {
						if (msg.id) {
							return msg.reply('The ticket is already closed.');
						}
						return await interaction.editReply('The ticket is already closed.');
					}
					ticket.statusId = 100;
					ticket.statusName = 'Closed';
					ticket.save();

					//Move the channel to the correct category
					let closedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Closed');
					if (!closedCategory) {
						closedCategory = await msg.guild.channels.create('Tickets - Closed', { type: Discord.ChannelType.GuildCategory });
						await closedCategory.permissionOverwrites.set([
							{
								id: msg.guild.roles.everyone.id,
								deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
							},
						]);
						let openCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
						let position = 0;
						if (openCategory) {
							position++;
						}
						let respondedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Responded');
						if (respondedCategory) {
							position++;
						}
						let inActionCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - In Action');
						if (inActionCategory) {
							position++;
						}
						let awaitingResponseCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Awaiting Response');
						if (awaitingResponseCategory) {
							position++;
						}
						await closedCategory.setPosition(position);
					}
					await msg.channel.setParent(closedCategory);

					await setPermissions(msg.channel, ticket);

					await msg.channel.send('The Ticket has been closed.');
					if (interaction) {
						await interaction.editReply('The ticket state has been updated.');
					} else {
						msg.delete();
					}
					removeEmptyCategories(msg);

					let date = new Date();
					date.setUTCMinutes(date.getUTCMinutes() + 3);
					logDatabaseQueries(4, 'commands/ticket.js DBProcessQueue create closeTicket');
					return DBProcessQueue.create({ guildId: msg.guildId, task: 'closeTicket', priority: 5, additions: msg.channel.id, date: date });
				} else {
					if (msg.id) {
						return msg.reply('This is not a valid ticket channel.');
					}
					return await interaction.editReply('This is not a valid ticket channel.');
				}
			}

			if (!args[1]) {
				if (msg.id) {
					return msg.reply('Please describe the problem in further detail.');
				}
				return await interaction.editReply('Please describe the problem in further detail.');
			}

			//TODO: add attributes and logdatabasequeries
			logDatabaseQueries(4, 'commands/ticket.js DBTickets all');
			const tickets = await DBTickets.findAll({
				where: { guildId: msg.guildId }
			});

			let openCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
			if (!openCategory) {
				openCategory = await msg.guild.channels.create('Tickets - Open', { type: Discord.ChannelType.GuildCategory });
				await openCategory.permissionOverwrites.set([
					{
						id: msg.guild.roles.everyone.id,
						deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
					},
				]);
				await openCategory.setPosition(0);
			}
			let ticketChannel = await msg.guild.channels.create(`${msg.guild.name.substring(0, 3)}-${(tickets.length + 1).toString().padStart(6, '0')}-${msg.author.username.substring(0, 3)}`, 'text');
			await ticketChannel.setParent(openCategory);

			logDatabaseQueries(4, 'commands/ticket.js DBTickets create Open');
			const ticket = await DBTickets.create({
				guildId: msg.guildId,
				channelId: ticketChannel.id,
				creatorId: msg.author.id,
				statusId: 0,
				statusName: 'Open'
			});

			await setPermissions(ticketChannel, ticket);

			const messageEmbed = new Discord.EmbedBuilder()
				.setColor('#03C04A')
				.setAuthor({ name: `${msg.author.username}#${msg.author.discriminator}`, iconURL: msg.author.displayAvatarURL() })
				.setDescription(`<@${msg.author.id}> created a ticket.`)
				.addFields(
					{ name: 'Ticket Message', value: args.join(' ') },
				)
				.setTimestamp();

			await ticketChannel.send({ embeds: [messageEmbed] });

			await ticketChannel.send('Staff will take over shortly.\nPlease make sure to describe your issue as well as possible in the meantime.');

			if (msg.id) {
				return msg.delete();
			}
			return await interaction.editReply('The Ticket has been created.');
		} else {
			const guildPrefix = await getGuildPrefix(msg);
			if (msg.id) {
				return msg.reply(`Tickets aren't enabled on this server.\nAdmins can enable tickets by using \`${guildPrefix}toggletickets\`.`);
			}
			return await interaction.editReply(`Tickets aren't enabled on this server.\nAdmins can enable tickets by using \`${guildPrefix}toggletickets\`.`);
		}
	},
};

async function removeEmptyCategories(msg) {
	let openCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
	if (openCategory && !openCategory.children.first()) {
		openCategory.delete();
	}
	let respondedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Responded');
	if (respondedCategory && !respondedCategory.children.first()) {
		respondedCategory.delete();
	}
	let inActionCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - In Action');
	if (inActionCategory && !inActionCategory.children.first()) {
		inActionCategory.delete();
	}
	let awaitingResponseCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Awaiting Response');
	if (awaitingResponseCategory && !awaitingResponseCategory.children.first()) {
		awaitingResponseCategory.delete();
	}
	let closedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Closed');
	if (closedCategory && !closedCategory.children.first()) {
		closedCategory.delete();
	}
}

async function setPermissions(channel, ticket) {
	let permissions = [
		{
			id: ticket.creatorId,
			allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'READ_MESSAGE_HISTORY'],
		},
		{
			id: channel.guild.roles.everyone.id,
			deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
		},
	];

	if (ticket.additionalParties) {
		let parties = ticket.additionalParties.split(';');

		parties.forEach(async (party) => {
			if (!isNaN(party)) {
				permissions.push(
					{
						id: party,
						allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'READ_MESSAGE_HISTORY'],
					}
				);
			}
		});
	}

	await channel.permissionOverwrites.set(permissions);
}