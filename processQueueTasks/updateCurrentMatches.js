const { updateCurrentMatchesChannel } = require('../utils');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		updateCurrentMatchesChannel(client);
		await processQueueEntry.destroy();
	},
};