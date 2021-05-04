module.exports = {
	async execute(client, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		const user = await client.users.fetch(args[0]).catch(async () => {
			//Nothing
		});

		user.send(`Reminder: ${args[1]}`);
	},
};