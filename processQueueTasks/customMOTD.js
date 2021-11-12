const { pause } = require('../utils');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		//used to block new osu-referee matches to be scheduled while customMOTDs are blocking it
		await pause(parseInt(processQueueEntry.additions) * 1000);
		processQueueEntry.destroy();
	},
};