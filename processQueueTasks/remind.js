module.exports = {
	async execute(client, processQueueEntry) {
		// console.log('remind');
		let args = processQueueEntry.additions.split(';');

		const user = await client.users.fetch(args[0]).catch(async () => {
			//Nothing
		});

		if (user) {
			try {
				await user.send(`Reminder: ${args[1]}`);
			} catch (error) {
				if (error.message !== 'Cannot send messages to this user') {
					console.error(error);
				}
			}
		}
		processQueueEntry.destroy();
	},
};