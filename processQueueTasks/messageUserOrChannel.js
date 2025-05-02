const { logBroadcastEval } = require('../config.json');

module.exports = {
	async execute(client, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let user = await client.users.fetch(args[0]);

		try {
			await user.send(args[2]);
		} catch (error) {
			if (error.message === 'Cannot send messages to this user') {
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting processQueueTasks/messageUserOrChannel.js');
				}

				client.shard.broadcastEval(async (c, { channelId, message }) => {
					let channel = await c.channels.cache.get(channelId);
					if (channel) {
						await channel.send(message);
					}
				}, { context: { channelId: args[1], message: args[3] } });
			} else {
				console.error(error);
			}
		}

		processQueueEntry.destroy();
	},
};