const { DBProcessQueue } = require('../dbObjects');

module.exports = {
	async execute(client, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		const channel = await client.channels.fetch(args[0]).catch(async () => {
			//Nothing
		});

		if (channel) {
			//Grab recent stuff and send it in

			let date = new Date();

			console.log(date);

			date.setTime(date.getTime() + (date.getTime() - processQueueEntry.createdAt.getTime()));

			date.setUTCMinutes(date.getUTCMinutes() + 5);

			console.log(processQueueEntry.additions);

			DBProcessQueue.create({ guildId: processQueueEntry.guildId, task: processQueueEntry.task, priority: processQueueEntry.priority, additions: processQueueEntry.additions, date: date });

		}

	},
};