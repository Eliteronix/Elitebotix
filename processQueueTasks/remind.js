module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('remind');
		let args = processQueueEntry.additions.split(';');

		const user = await client.users.fetch(args[0]).catch(async () => {
			//Nothing
		});

		if (user) {
			await user.send(`Reminder: ${args[1]}`);
		}
		processQueueEntry.destroy();
	},
};