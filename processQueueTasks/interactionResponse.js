module.exports = {
	async execute(client, bancho, processQueueEntry) {
		client.shard.broadcastEval(async (c, { additions }) => {
			try{
			const Discord = require('discord.js');
			
			let args = additions.split(';');

			let interaction = new Discord.InteractionWebhook(c, c.application.id, args[0]);

			console.log(interaction);

			let message = await interaction.fetchMessage();

			console.log(message);

			console.log(interaction);

			await interaction.editMessage(args[1], args[2]);
			} catch (e) {
				console.error(e);
			}
		}, { context: { additions: processQueueEntry.additions } });

		processQueueEntry.destroy();
	},
};