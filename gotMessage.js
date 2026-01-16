const { updateServerUserActivity } = require('./utils');
const Discord = require('discord.js');
const { DBTickets } = require('./dbObjects');
const noTicketCache = {};

module.exports = async function (msg) {
	//check if the message wasn't sent by the bot itself or another bot
	if (msg.author.bot) {
		return;
	}

	//Update user activity
	updateServerUserActivity(msg);

	//Handle Ticket
	handleTicketStatus(msg);
};

async function handleTicketStatus(msg) {
	//Check if the channel is a ticket channel
	if (noTicketCache[msg.channel.id]) {
		return;
	}

	const ticket = await DBTickets.findOne({
		attributes: ['id', 'statusId', 'statusName', 'creatorId', 'additionalParties'],
		where: {
			channelId: msg.channel.id,
			creatorId: msg.author.id
		}
	});

	//If no ticket found, add to cache and return
	if (!ticket) {
		noTicketCache[msg.channel.id] = true;
		return;
	}

	if (ticket.statusId !== 0 && ticket.statusId !== 75 && ticket.statusId !== 100) {
		ticket.statusId = 75;
		ticket.statusName = 'Awaiting Response';
		ticket.save();

		//Move the channel to the correct category
		let awaitingResponseCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Awaiting Response');
		if (!awaitingResponseCategory) {
			awaitingResponseCategory = await msg.guild.channels.create('Tickets - Awaiting Response', { type: Discord.ChannelType.GuildCategory });
			await awaitingResponseCategory.permissionOverwrites.set([
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
			await awaitingResponseCategory.setPosition(position);
		}
		await msg.channel.setParent(awaitingResponseCategory);


		let permissions = [
			{
				id: ticket.creatorId,
				allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'READ_MESSAGE_HISTORY'],
			},
			{
				id: msg.channel.guild.roles.everyone.id,
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

		await msg.channel.permissionOverwrites.set(permissions);

		let openCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
		if (openCategory && !openCategory.children.first()) {
			await openCategory.delete();
		}
		let respondedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Responded');
		if (respondedCategory && !respondedCategory.children.first()) {
			await respondedCategory.delete();
		}
		let inActionCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - In Action');
		if (inActionCategory && !inActionCategory.children.first()) {
			await inActionCategory.delete();
		}
		let closedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Closed');
		if (closedCategory && !closedCategory.children.first()) {
			await closedCategory.delete();
		}
	}
}