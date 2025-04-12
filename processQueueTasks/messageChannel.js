const Discord = require('discord.js');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting processQueueTasks/messageChannel.js');
		}

		client.shard.broadcastEval(async (c, { channelId, message }) => {
			let channel = await c.channels.cache.get(channelId);
			if (channel) {
				await channel.send(message);
			}
		}, { context: { channelId: args[0], message: args[1] } });

		processQueueEntry.destroy();
	},
};