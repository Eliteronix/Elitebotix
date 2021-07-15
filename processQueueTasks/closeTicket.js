const { DBTickets } = require('../dbObjects');

module.exports = {
	async execute(client, processQueueEntry) {
		const ticket = await DBTickets.findOne({
			where: { channelId: processQueueEntry.additions }
		});

		if (ticket && ticket.statusId === 100) {
			const channel = await client.channels.fetch(processQueueEntry.additions).catch(async () => {
				//Nothing
			});

			channel.delete();

			let openCategory = channel.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Open');
			if (openCategory && !openCategory.children.first()) {
				openCategory.delete();
			}
			let respondedCategory = channel.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Responded');
			if (respondedCategory && !respondedCategory.children.first()) {
				respondedCategory.delete();
			}
			let inActionCategory = channel.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - In Action');
			if (inActionCategory && !inActionCategory.children.first()) {
				inActionCategory.delete();
			}
			let awaitingResponseCategory = channel.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Awaiting Response');
			if (awaitingResponseCategory && !awaitingResponseCategory.children.first()) {
				awaitingResponseCategory.delete();
			}
			let closedCategory = channel.guild.channels.cache.find(c => c.type === 'category' && c.name === 'Tickets - Closed');
			if (closedCategory && !closedCategory.children.first()) {
				closedCategory.delete();
			}
		}
	},
};