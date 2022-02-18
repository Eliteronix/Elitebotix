module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let date = new Date();
		console.log('Reminder executed:', date, processQueueEntry.date);

		if (processQueueEntry.date && processQueueEntry.date.getTime() < date.getTime()) {
			let args = processQueueEntry.additions.split(';');

			const user = await client.users.fetch(args[0]).catch(async () => {
				//Nothing
			});

			if (user) {
				user.send(`Reminder: ${args[1]}`);
			}
			processQueueEntry.destroy();
		} else {
			processQueueEntry.beingExecuted = false;
			processQueueEntry.save();
		}
	},
};