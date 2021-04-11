module.exports = {
	async execute(processQueueEntry) {
		console.log('YEP');

		processQueueEntry.destroy();
	},
};