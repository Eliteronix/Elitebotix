const { DBTickets } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('closeTicket');
		logDatabaseQueries(2, 'processQueueTasks/closeTicket.js DBTickets');
		const ticket = await DBTickets.findOne({
			where: { channelId: processQueueEntry.additions }
		});

		if (ticket && ticket.statusId === 100) {
			client.shard.broadcastEval(async (c, { channelId }) => {
				const channel = await c.channels.cache.get(channelId).catch(async () => {
					//Nothing
				});

				if (channel) {
					await channel.delete();

					const guild = await c.guilds.cache.get(channel.guild.id);

					let openCategory = guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Open');
					if (openCategory && !openCategory.children.first()) {
						openCategory.delete();
					}
					let respondedCategory = guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Responded');
					if (respondedCategory && !respondedCategory.children.first()) {
						respondedCategory.delete();
					}
					let inActionCategory = guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - In Action');
					if (inActionCategory && !inActionCategory.children.first()) {
						inActionCategory.delete();
					}
					let awaitingResponseCategory = guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Awaiting Response');
					if (awaitingResponseCategory && !awaitingResponseCategory.children.first()) {
						awaitingResponseCategory.delete();
					}
					let closedCategory = guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Closed');
					if (closedCategory && !closedCategory.children.first()) {
						closedCategory.delete();
					}
				}
			}, { context: { channelId: processQueueEntry.additions } });
		}

		processQueueEntry.destroy();
	},
};