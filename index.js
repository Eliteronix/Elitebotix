const { ShardingManager } = require('discord.js');
require('dotenv').config();

const http = require('http');
const url = require('url');
const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
	app: 'elitebotix'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

const amountOfApiRequestsInTheLast24Hours = new client.Gauge({
	name: 'osu_api_requests_in_the_last_24_hours',
	help: 'API requests in the last 24 hours',
});
register.registerMetric(amountOfApiRequestsInTheLast24Hours);

const timeBehindMatchCreation = new client.Gauge({
	name: 'time_behind_match_creation',
	help: 'The time behind match creation in seconds',
});
register.registerMetric(timeBehindMatchCreation);

// Define the HTTP server
const server = http.createServer(async (req, res) => {
	// Retrieve route from request object
	const route = url.parse(req.url).pathname;

	if (route === '/metrics') {
		// Return all metrics the Prometheus exposition format
		res.setHeader('Content-Type', register.contentType);
		res.end(await register.metrics());
	}
});

// Start the HTTP server which exposes the metrics on http://localhost:8080/metrics
server.listen(8080);

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

manager.spawn()
	.then(shards => {
		shards.forEach(shard => {
			shard.on('message', message => {
				if (message === 'osu!API') {
					amountOfApiRequestsInTheLast24Hours.inc();
					setTimeout(() => {
						amountOfApiRequestsInTheLast24Hours.dec();
					}, 86400000);
				} else if (typeof message === 'string' && message.startsWith('saveMultiMatches')) {
					const timeBehind = message.split(' ')[1];
					timeBehindMatchCreation.set(parseInt(timeBehind));
				}
			});
		});
	})
	.catch(console.error);