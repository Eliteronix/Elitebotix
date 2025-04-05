const { updateQueueChannels } = require('../utils');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		updateQueueChannels(client);
		await processQueueEntry.destroy();
	},
};