const Discord = require('discord.js');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let user = await client.users.fetch(args[0]);

		try {
			await user.send(args[2]);
		} catch (error) {
			if (error.message === 'Cannot send messages to this user') {
				if (args[1]) {
					let interaction = new Discord.InteractionWebhook(client, client.application.id, args[1]);

					interaction.send(args[3]);
				}
			} else {
				console.error(error);
			}
		}

		processQueueEntry.destroy();
	},
};