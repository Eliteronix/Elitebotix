const Discord = require('discord.js');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let user = await client.users.fetch(args[0]);

		try {
			let attachment = new Discord.AttachmentBuilder(args[2], { name: args[3] });

			await user.send({ content: args[1], files: [attachment] });
		} catch (error) {
			if (error.message !== 'Cannot send messages to this user') {
				console.error(error);
			}
		}

		processQueueEntry.destroy();
	},
};