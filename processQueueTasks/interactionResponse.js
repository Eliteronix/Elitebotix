const Discord = require('discord.js');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let interaction = new Discord.InteractionWebhook(client, client.application.id, args[0]);

		await interaction.editMessage(args[1], args[2]);

		processQueueEntry.destroy();
	},
};