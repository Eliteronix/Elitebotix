const Discord = require('discord.js');

module.exports = {
	async execute(client, bancho, processQueueEntry) {			
		let args = additions.split(';');

		let interaction = new Discord.InteractionWebhook(client, client.application.id, args[0]);

		await interaction.send(args[2]);

		processQueueEntry.destroy();
	},
};