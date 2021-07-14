const { DBGuilds, DBTickets } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');
const Discord = require('discord.js');

module.exports = {
	name: 'ticket',
	//aliases: ['developer'],
	description: 'Ticket manager',
	usage: '<issue description> | <responded/r/action/a/close/c>',
	// permissions: 'MANAGE_GUILD',
	// permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 10,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guild.id, ticketsEnabled: true },
		});

		if (guild) {
			if (args[0].toLowerCase() === 'responded' || args[0].toLowerCase() === 'r') {
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guild.id, channelId: msg.channel.id }
				});

				if (ticket) {
					if (ticket.creatorId === msg.author.id && msg.guild.ownerID !== msg.author.id) {
						return;
					}
					ticket.statusId = 25;
					ticket.statusName = 'Responded';
					ticket.save();

					//Move the channel to the correct category
					let repondedCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Responded');
					if (!repondedCategory) {
						repondedCategory = await msg.guild.channels.create('Tickets - Responded', { type: 'category' });
						await repondedCategory.overwritePermissions([
							{
								id: msg.guild.roles.everyone.id,
								deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
							},
						]);
						let openCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Open');
						let position = 0;
						if (openCategory) {
							position++;
						}
						await repondedCategory.setPosition(position);
					}
					msg.channel.setParent(repondedCategory);

					await msg.channel.overwritePermissions([
						{
							id: ticket.creatorId,
							allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'READ_MESSAGE_HISTORY'],
						},
						{
							id: msg.guild.roles.everyone.id,
							deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
						},
					]);

					msg.delete();
				} else {
					return msg.channel.send('This is not a valid ticket channel.');
				}
				return;
			} else if (args[0].toLowerCase() === 'action' || args[0].toLowerCase() === 'a') {
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guild.id, channelId: msg.channel.id }
				});

				if (ticket) {
					if (ticket.creatorId === msg.author.id && msg.guild.ownerID !== msg.author.id) {
						return;
					}
					ticket.statusId = 50;
					ticket.statusName = 'In action';
					ticket.save();

					//Move the channel to the correct category
					let inActionCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - In Action');
					if (!inActionCategory) {
						inActionCategory = await msg.guild.channels.create('Tickets - In Action', { type: 'category' });
						await inActionCategory.overwritePermissions([
							{
								id: msg.guild.roles.everyone.id,
								deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
							},
						]);
						let openCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Open');
						let position = 0;
						if (openCategory) {
							position++;
						}
						let respondedCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Responded');
						if (respondedCategory) {
							position++;
						}
						await inActionCategory.setPosition(position);
					}
					msg.channel.setParent(inActionCategory);

					await msg.channel.overwritePermissions([
						{
							id: ticket.creatorId,
							allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'READ_MESSAGE_HISTORY'],
						},
						{
							id: msg.guild.roles.everyone.id,
							deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
						},
					]);

					msg.delete();
				} else {
					return msg.channel.send('This is not a valid ticket channel.');
				}
				return;
			} else if (args[0].toLowerCase() === 'close' || args[0].toLowerCase() === 'c') {
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guild.id, channelId: msg.channel.id }
				});

				if (ticket) {
					if (ticket.creatorId === msg.author.id && msg.guild.ownerID !== msg.author.id) {
						return;
					}
					ticket.statusId = 100;
					ticket.statusName = 'Closed';
					ticket.save();

					//Move the channel to the correct category
					let closedCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Closed');
					if (!closedCategory) {
						closedCategory = await msg.guild.channels.create('Tickets - Closed', { type: 'category' });
						await closedCategory.overwritePermissions([
							{
								id: msg.guild.roles.everyone.id,
								deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
							},
						]);
						let openCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Open');
						let position = 0;
						if (openCategory) {
							position++;
						}
						let respondedCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Responded');
						if (respondedCategory) {
							position++;
						}
						let inActionCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - In Action');
						if (inActionCategory) {
							position++;
						}
						let awaitingResponseCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Awaiting Response');
						if (awaitingResponseCategory) {
							position++;
						}
						await closedCategory.setPosition(position);
					}
					msg.channel.setParent(closedCategory);

					await msg.channel.overwritePermissions([
						{
							id: ticket.creatorId,
							allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
							deny: ['SEND_MESSAGES']
						},
						{
							id: msg.guild.roles.everyone.id,
							deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
						},
					]);

					msg.channel.send('The Ticket has been closed.');
					msg.delete();
				} else {
					return msg.channel.send('This is not a valid ticket channel.');
				}
				return;
			}

			const tickets = await DBTickets.findAll({
				where: { guildId: msg.guild.id }
			});

			let openCategory = msg.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Open');
			if (!openCategory) {
				openCategory = await msg.guild.channels.create('Tickets - Open', { type: 'category' });
				await openCategory.overwritePermissions([
					{
						id: msg.guild.roles.everyone.id,
						deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
					},
				]);
				await openCategory.setPosition(0);
			}
			let ticketChannel = await msg.guild.channels.create(`${msg.guild.name.substring(0, 3)}-${(tickets.length + 1).toString().padStart(6, '0')}-${msg.author.username.substring(0, 3)}`, 'text');
			ticketChannel.setParent(openCategory);

			await ticketChannel.overwritePermissions([
				{
					id: msg.author.id,
					allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'READ_MESSAGE_HISTORY'],
				},
				{
					id: msg.guild.roles.everyone.id,
					deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
				},
			]);

			const messageEmbed = new Discord.MessageEmbed()
				.setColor('#03C04A')
				.setAuthor(`${msg.author.username}#${msg.author.discriminator}`, msg.author.displayAvatarURL())
				.setDescription(`<@${msg.author.id}> created a ticket.`)
				.addFields(
					{ name: 'Ticket Message', value: args.join(' ') },
				)
				.setTimestamp();

			await ticketChannel.send(messageEmbed);

			ticketChannel.send('Staff will take over shortly.\nPlease make sure to describe your issue as well as possible in the meantime.');

			DBTickets.create({
				guildId: msg.guild.id,
				channelId: ticketChannel.id,
				creatorId: msg.author.id,
				statusId: 0,
				statusName: 'Open'
			});

			msg.delete();
		} else {
			const guildPrefix = await getGuildPrefix(msg);
			return msg.channel.send(`Tickets aren't enabled on this server.\nStaff can enable tickets by using \`${guildPrefix}toggletickets\`.`);
		}
	},
};