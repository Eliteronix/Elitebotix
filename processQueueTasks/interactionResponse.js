module.exports = {
	async execute(client, bancho, processQueueEntry) {
		client.shard.broadcastEval(async (c, { additions }) => {
			const Discord = require('discord.js');
			
			let args = additions.split(';');
			console.log(args[0]);
			console.log(args[1]);
			console.log(args[2]);

			let interaction = new Discord.InteractionWebhook(c, c.application.id, args[0]);

			await interaction.editMessage(args[1], args[2]);

		}, { context: { additions: processQueueEntry.additions } });

		processQueueEntry.destroy();
	},
};