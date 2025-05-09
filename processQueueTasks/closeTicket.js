const { DBTickets } = require('../dbObjects');
const Discord = require('discord.js');
const { logBroadcastEval } = require('../config.json');

module.exports = {
	async execute(client, processQueueEntry) {
		const ticket = await DBTickets.findOne({
			attributes: ['statusId'],
			where: {
				channelId: processQueueEntry.additions
			}
		});

		if (ticket && ticket.statusId === 100) {
			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting processQueueTasks/closeTicket.js to shards...');
			}

			client.shard.broadcastEval(async (c, { channelId }) => {
				const channel = await c.channels.cache.get(channelId);

				if (channel) {
					await channel.delete();

					const guild = await c.guilds.cache.get(channel.guild.id);

					if (!guild || guild.shardId !== c.shardId) {
						return;
					}

					let openCategory = guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
					if (openCategory && !openCategory.children.first()) {
						await openCategory.delete();
					}
					let respondedCategory = guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Responded');
					if (respondedCategory && !respondedCategory.children.first()) {
						await respondedCategory.delete();
					}
					let inActionCategory = guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - In Action');
					if (inActionCategory && !inActionCategory.children.first()) {
						await inActionCategory.delete();
					}
					let awaitingResponseCategory = guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Awaiting Response');
					if (awaitingResponseCategory && !awaitingResponseCategory.children.first()) {
						await awaitingResponseCategory.delete();
					}
					let closedCategory = guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Closed');
					if (closedCategory && !closedCategory.children.first()) {
						await closedCategory.delete();
					}
				}
			}, { context: { channelId: processQueueEntry.additions } });
		}

		processQueueEntry.destroy();
	},
};