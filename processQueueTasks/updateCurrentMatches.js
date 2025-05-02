const { updateCurrentMatchesChannel } = require('../utils');

module.exports = {
	async execute(client, processQueueEntry) {
		updateCurrentMatchesChannel(client);
		await processQueueEntry.destroy();
	},
};