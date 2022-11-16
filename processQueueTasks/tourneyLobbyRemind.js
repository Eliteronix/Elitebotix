module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('tourneyLobbyRemind');
		let args = processQueueEntry.additions.split(';');

		const user = await client.users.fetch(args[0]).catch(async () => {
			//Nothing
		});

		let players = args[4].split(',');
		let playerNames = '';
		for (let i = 0; i < players.length; i++) {
			playerNames += `${players[i]} `;
		}
		// args[3] is the date. convert it to a discord timestamp
		let date = new Date(args[3]);

		if (user) {
			user.send(`The lobby \`${args[1]}\` in ${args[2]} is going to happen <t:${date}:R>\nThe players are: ${playerNames}`);
		}
		processQueueEntry.destroy();
	},
};