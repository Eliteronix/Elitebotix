const Discord = require('discord.js');

module.exports = {
	async execute(client, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let interaction = new Discord.InteractionWebhook(client, client.application.id, args[0]);

		await interaction.send(args[1]);

		processQueueEntry.destroy();
	},
};