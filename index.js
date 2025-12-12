const { ShardingManager } = require('discord.js');
require('dotenv').config();

const http = require('http');
const url = require('url');
const client = require('prom-client');
const { DBProcessQueue } = require('./dbObjects');
const fs = require('fs');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
	app: 'elitebotix'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

const osuApiRequests = new client.Counter({
	name: 'osu_api_requests',
	help: 'osu! API requests',
});
register.registerMetric(osuApiRequests);

const osuWebRequests = new client.Counter({
	name: 'osu_web_requests',
	help: 'osu! web requests',
});
register.registerMetric(osuWebRequests);

const runningTournamentMatches = new client.Gauge({
	name: 'running_tournament_matches',
	help: 'Running tournament matches',
});
register.registerMetric(runningTournamentMatches);

const uniqueDiscordUsersInTheLastMinute = new client.Gauge({
	name: 'unique_discord_users_in_the_last_minute',
	help: 'Unique discord users in the last minute',
});
register.registerMetric(uniqueDiscordUsersInTheLastMinute);

const uniqueDiscordUsersInTheLastHour = new client.Gauge({
	name: 'unique_discord_users_in_the_last_hour',
	help: 'Unique discord users in the last hour',
});
register.registerMetric(uniqueDiscordUsersInTheLastHour);

const uniqueDiscordUsersInTheLastDay = new client.Gauge({
	name: 'unique_discord_users_in_the_last_day',
	help: 'Unique discord users in the last day',
});
register.registerMetric(uniqueDiscordUsersInTheLastDay);

const uniqueDiscordUsersInTheLastWeek = new client.Gauge({
	name: 'unique_discord_users_in_the_last_week',
	help: 'Unique discord users in the last week',
});
register.registerMetric(uniqueDiscordUsersInTheLastWeek);

const uniqueDiscordUsers = new client.Gauge({
	name: 'unique_discord_users',
	help: 'Unique discord users',
});
register.registerMetric(uniqueDiscordUsers);

const osuWebRequestsQueueLength = new client.Gauge({
	name: 'osu_web_requests_queue_length',
	help: 'osu! Web requests queue length',
});
register.registerMetric(osuWebRequestsQueueLength);

const osuTrackUsersQueueLength = new client.Gauge({
	name: 'osu_track_users_queue_length',
	help: 'osu! Track users queue length',
});
register.registerMetric(osuTrackUsersQueueLength);

const osuUpdateUsersQueueLength = new client.Gauge({
	name: 'osu_update_users_queue_length',
	help: 'osu! Update users queue length',
});
register.registerMetric(osuUpdateUsersQueueLength);

const totalCommandsUsed = new client.Counter({
	name: 'total_commands_used',
	help: 'Total commands used',
});
register.registerMetric(totalCommandsUsed);

const totalErrorCount = new client.Counter({
	name: 'total_errors_count',
	help: 'Total error count',
});
register.registerMetric(totalErrorCount);

const originalConsoleError = console.error;

console.error = function (...args) {
	totalErrorCount.inc();
	originalConsoleError.apply(console, args);
};


const databaseMetrics = [];

const commandSpecificMetrics = [];

//get all command files
// const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

//Add the commands from the command files to the client.commands collection
// for (const file of commandFiles) {
// 	const commandMetrics = new client.Counter({
// 		name: `command_${file.replace('.js', '').replaceAll('-', '_')}`,
// 		help: `Command ${file.replace('.js', '').replaceAll('-', '_')} used`,
// 	});
// 	register.registerMetric(commandMetrics);

// 	// set a new item in the Array
// 	commandSpecificMetrics.push({ command: file.replace('.js', '').replaceAll('-', '_'), counter: commandMetrics });
// }

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

let osuWebRequestQueue = [];

let manager = new ShardingManager('./bot.js', {
	token: process.env.BOTTOKEN,
	execArgv: ['--use_strict', '--unhandled-rejections=warn', '--max-old-space-size=4096'],
	totalShards: 'auto',
	timeout: 30000,
	respawn: false
});

if (process.env.SERVER === 'Dev') {
	manager = new ShardingManager('./bot.js', {
		token: process.env.BOTTOKEN,
		execArgv: ['--use_strict', '--unhandled-rejections=warn', '--max-old-space-size=4096'],
		totalShards: 1,
		timeout: 30000,
		respawn: false
	});
}

manager.on('Error', error => {
	console.error('index.js | manager error' + error);
});

manager.on('shardCreate', shard => {
	// eslint-disable-next-line no-console
	console.log(`Launched shard ${shard.id}`);

	if (shard.id === 0) {
		shard.process.spawnargs = [
			'clinic', 'flame', '--',
			'node', 'bot.js', shard.id, manager.totalShards
		];
	}

	// Listeing for the ready event on shard.
	shard.on('ready', () => {
		// console.log(`[DEBUG/SHARD] Shard ${shard.id} connected to Discord's Gateway.`);
		// Sending the data to the shard.
		shard.send({ type: 'shardId', data: { shardId: shard.id } })
			.catch(error => {
				if (error.message !== 'Channel closed') {
					console.error('index.js | shardId', error);
				}
			});

		// Send the total amount of shards to all shards.
		manager.shards.forEach(shard => {
			shard.send({ type: 'totalShards', data: { totalShards: manager.shards.size } })
				.catch(error => {
					if (error.message !== 'Channel closed') {
						console.error('index.js | totalShards', error);
					}
				});
		});

		shard.process.on('exit', (code, signal) => {
			// eslint-disable-next-line no-console
			console.log(`Shard ${shard.id} exited (code: ${code}, signal: ${signal})`);

			if (shard.process) return;  // Already respawning internally — not your case

			// if (shard.id > 0) {
			// eslint-disable-next-line no-console
			console.log(`Manually restarting shard ${shard.id}...`);
			shard.spawn(); // Safe restart, creates a new child process
			// }
		});
	});

	// shard.on('disconnect', (event) => {
	// 	console.warn(`Shard ${shard.id} disconnected with code ${event.code} and reason: ${event.reason}`);
	// });

	// shard.on('reconnect', () => {
	// 	console.log(`Shard ${shard.id} is reconnecting...`);
	// });

	// shard.on('error', (error) => {
	// 	console.error(`Shard ${shard.id} encountered an error:`, error);
	// });

	// shard.on('death', () => console.log(shard.id, 'death'));
	// shard.on('disconnect', () => console.log(shard.id, 'disconnect'));
	// shard.on('ready', () => console.log(shard.id, 'ready'));
	// shard.on('reconnecting', () => console.log(shard.id, 'reconnecting'));
	// shard.on('resume', () => console.log(shard.id, 'resume'));
	// shard.on('spawn', () => console.log(shard.id, 'spawn'));
	// shard.connection?.on('close', (code, reason) => {
	// 	console.warn(`Low-level close on shard ${shard.id}: Code ${code}, Reason ${reason}`);
	// });
});

manager.on('shardError', (error, shardId) => {
	console.error(`Shard ${shardId} encountered an error:`, error);
});

manager.on('shardDisconnect', (event, shardId) => {
	console.warn(`Shard ${shardId} disconnected with code ${event.code} and reason: ${event.reason}`);
});

manager.spawn()
	.then(shards => {
		shards.forEach(shard => {
			shard.on('message', message => {
				if (message === 'osu!API') {
					osuApiRequests.inc();
				} else if (typeof message === 'string' && message.startsWith('osu! website')) {
					let request = message.replace('osu! website ', '');

					osuWebRequestQueue.push({ string: request.split(' ')[0], link: request.split(' ')[1] });
				} else if (typeof message === 'string' && message.startsWith('DB')) {
					let database = message.replace('DB ', '');

					let databaseCounter = databaseMetrics.find(counter => counter.database === database);

					if (databaseCounter) {
						databaseCounter.counter.inc();
					} else {
						databaseMetrics.push({
							database: database,
							counter: new client.Gauge({
								name: `database_${database}`,
								help: `Database ${database} accessed`
							})
						});

						databaseMetrics[databaseMetrics.length - 1].counter.inc();

						register.registerMetric(databaseMetrics[databaseMetrics.length - 1].counter);
					}
				} else if (message === 'importMatch') {
					DBProcessQueue.count({
						where: {
							task: 'importMatch'
						}
					})
						.then(processQueueTasks => {
							runningTournamentMatches.set(processQueueTasks);
						})
						.catch(error => {
							console.error('index.js | importMatch' + error);
						});
				} else if (typeof message === 'string' && message.startsWith('discorduser')) {
					let discordUserId = message.split(' ')[1];

					let uniqueUsersData = {};

					if (fs.existsSync('./uniqueDiscordUsers.json')) {
						let rawData = fs.readFileSync('./uniqueDiscordUsers.json');
						uniqueUsersData = JSON.parse(rawData);
					}

					uniqueUsersData[discordUserId] = Date.now();

					// Update the file
					fs.writeFileSync('./uniqueDiscordUsers.json', JSON.stringify(uniqueUsersData));

					// Calculate unique users in different timeframes
					let now = Date.now();
					let oneMinuteAgo = now - 60000;
					let oneHourAgo = now - 3600000;
					let oneDayAgo = now - 86400000;
					let oneWeekAgo = now - 604800000;

					let countLastMinute = 0;
					let countLastHour = 0;
					let countLastDay = 0;
					let countLastWeek = 0;

					for (let userId in uniqueUsersData) {
						let lastActive = uniqueUsersData[userId];

						if (lastActive >= oneWeekAgo) {
							countLastWeek++;

							if (lastActive >= oneDayAgo) {
								countLastDay++;

								if (lastActive >= oneHourAgo) {
									countLastHour++;

									if (lastActive >= oneMinuteAgo) {
										countLastMinute++;
									}
								}
							}
						}
					}

					uniqueDiscordUsersInTheLastMinute.set(countLastMinute);
					uniqueDiscordUsersInTheLastHour.set(countLastHour);
					uniqueDiscordUsersInTheLastDay.set(countLastDay);
					uniqueDiscordUsersInTheLastWeek.set(countLastWeek);
					uniqueDiscordUsers.set(Object.keys(uniqueUsersData).length);
				} else if (typeof message === 'string' && message.startsWith('osuTrackQueue')) {
					osuTrackUsersQueueLength.set(Number(message.split(' ')[1]));
				} else if (typeof message === 'string' && message.startsWith('osuUpdateQueue')) {
					osuUpdateUsersQueueLength.set(Number(message.split(' ')[1]));
				} else if (typeof message === 'string' && message.startsWith('command')) {
					let command = message.replace('command ', '').replaceAll('-', '_');

					let commandCounter = commandSpecificMetrics.find(counter => counter.command === command);

					totalCommandsUsed.inc();

					if (commandCounter) {
						commandCounter.counter.inc();
					} else {
						commandSpecificMetrics.push({
							command: command,
							counter: new client.Gauge({
								name: `command_${command}`,
								help: `Command ${command} used`
							})
						});

						commandSpecificMetrics[commandSpecificMetrics.length - 1].counter.inc();

						register.registerMetric(commandSpecificMetrics[commandSpecificMetrics.length - 1].counter);
					}
				} else if (message === 'error') {
					totalErrorCount.inc();
				}
			});
		});
	})
	.catch(error => {
		console.error('index.js | shard spawn', error);
	});

processOsuWebRequests(client);

async function processOsuWebRequests(client) {
	osuWebRequestsQueueLength.set([...new Set(osuWebRequestQueue.map(item => item.string))].length);

	if (osuWebRequestQueue.length) {
		osuWebRequests.inc();

		let osuWebRequest = osuWebRequestQueue[0];

		manager.shards.forEach(shard => {
			shard.send({ type: 'osuWebRequest', data: osuWebRequest.string })
				.catch(error => {
					if (error.message !== 'Channel closed') {
						console.error('index.js | processOsuWebRequests osuWebRequest string', error);
					}
				});
		});

		manager.shards.forEach(shard => {
			shard.send({ type: 'osuWebRequest', data: osuWebRequest.link })
				.catch(error => {
					if (error.message !== 'Channel closed') {
						console.error('index.js | processOsuWebRequests osuWebRequest link', error);
					}
				});
		});

		osuWebRequestQueue = osuWebRequestQueue.filter(item => item.string !== osuWebRequest.string);

		if (osuWebRequest.link.endsWith('.jpg') ||
			osuWebRequest.link.startsWith('https://osu.ppy.sh/osu/') ||
			osuWebRequest.link.startsWith('https://s.ppy.sh/a/') ||
			osuWebRequest.link.startsWith('https://assets.ppy.sh/profile-badges/')) {
			osuWebRequestQueue = osuWebRequestQueue.filter(item => item.link !== osuWebRequest.link);
		}

		await new Promise(resolve => setTimeout(resolve, 5450));
	}

	setTimeout(() => {
		processOsuWebRequests(client);
	}, 50);
}

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled rejection, index.js:', reason, promise);
});