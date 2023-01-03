const { ShardingManager } = require('discord.js');
require('dotenv').config();

let manager = new ShardingManager('./bot.js', {
	// eslint-disable-next-line no-undef
	token: process.env.BOTTOKEN,
	execArgv: ['--use_strict', '--unhandled-rejections=warn'],
	totalShards: 6
});

// eslint-disable-next-line no-undef
if (process.env.SERVER === 'Dev') {
	manager = new ShardingManager('./bot.js', {
		// eslint-disable-next-line no-undef
		token: process.env.BOTTOKEN,
		execArgv: ['--use_strict', '--unhandled-rejections=warn'],
		totalShards: 2
	});
}

manager.on('shardCreate', shard => {
	// eslint-disable-next-line no-console
	console.log(`Launched shard ${shard.id}`);

	// Listeing for the ready event on shard.
	shard.on('ready', () => {
		// console.log(`[DEBUG/SHARD] Shard ${shard.id} connected to Discord's Gateway.`);
		// Sending the data to the shard.
		shard.send({ type: 'shardId', data: { shardId: shard.id } });

		// Send the total amount of shards to all shards.
		manager.shards.forEach(shard => {
			shard.send({ type: 'totalShards', data: { totalShards: manager.shards.size } });
		});
	});
});

manager.spawn();