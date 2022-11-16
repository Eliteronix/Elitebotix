module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {

		twitchClient.join(processQueueEntry.additions);

		processQueueEntry.destroy();
	},
};