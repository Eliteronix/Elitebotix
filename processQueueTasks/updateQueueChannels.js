const { updateQueueChannels } = require('../utils');

module.exports = {
	async execute(client, processQueueEntry) {
		updateQueueChannels(client);
		await processQueueEntry.destroy();
	},
};