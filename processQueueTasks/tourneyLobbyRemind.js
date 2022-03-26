module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		const user = await client.users.fetch(args[0]).catch(async () => {
			//Nothing
		});

		let players = args[4].split(',');
		let playerNames = '';
		for (let i = 0; i < players.length; i++) {
			playerNames += `${players[i]} `;
		}

		if (user) {
			user.send(`The lobby \`${args[1]}\` in ${args[2]} is going to happen <t:${args[3]}:R>\nThe players are: ${playerNames}`);
		}
		processQueueEntry.destroy();
	},
};