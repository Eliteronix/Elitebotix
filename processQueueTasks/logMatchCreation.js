const { logMatchCreation } = require("../utils");

module.exports = {
	async execute(client, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		logMatchCreation(client, args[1], args[0]);

		processQueueEntry.destroy();
	},
};