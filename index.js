const { ShardingManager } = require('discord.js');
require('dotenv').config();

// eslint-disable-next-line no-undef
const manager = new ShardingManager('./bot.js', { token: process.env.BOTTOKEN });

manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));

manager.spawn();