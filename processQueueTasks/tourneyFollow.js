const { getOsuPlayerName } = require('../utils');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('tourneyFollow');
		let args = processQueueEntry.additions.split(';');

		const user = await client.users.fetch(args[0]).catch(async () => {
			//Nothing
		});

		if (user) {
			let players = args[2].split(',');

			for (let i = 0; i < players.length; i++) {
				players[i] = await getOsuPlayerName(players[i]);
			}

			let message = `Follow Notification:\n\`${players.join('`, `')}\` played one or more rounds in a match.\nhttps://osu.ppy.sh/community/matches/${args[1]}`;

			if (args[3].toLowerCase().includes('qualifier')) {
				message = `Follow Notification:\n\`${players.join('`, `')}\` played one or more rounds in a match.\n${args[3]}\n(Qualifier MP Links are hidden)`;
			}

			await user.send(message);
		}
		processQueueEntry.destroy();
	},
};