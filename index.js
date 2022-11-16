const { ShardingManager } = require('discord.js');
require('dotenv').config();

// eslint-disable-next-line no-undef
const manager = new ShardingManager('./bot.js', { token: process.env.BOTTOKEN });

manager.on('shardCreate', shard => {
	console.log(`Launched shard ${shard.id}`);

	// Listeing for the ready event on shard.
	shard.on('ready', () => {
		console.log(`[DEBUG/SHARD] Shard ${shard.id} connected to Discord's Gateway.`);
		// Sending the data to the shard.
		shard.send({ type: 'shardId', data: { shardId: shard.id } });
	});
});

manager.spawn();