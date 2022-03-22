module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		const user = await client.users.fetch(args[0]).catch(async () => {
			//Nothing
		});

		if (user) {
			user.send(`The lobby \`${args[1]}\` in ${args[2]} is going to happen <t:${args[3]}:R>`);
		}
		processQueueEntry.destroy();
	},
};