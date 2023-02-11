const { ShardingManager } = require('discord.js');
require('dotenv').config();

const http = require('http');
const url = require('url');
const client = require('prom-client');
const { DBProcessQueue } = require('./dbObjects');

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

const amountOfOsuWebRequestsInTheLast24Hours = new client.Gauge({
	name: 'osu_web_requests_in_the_last_24_hours',
	help: 'Osu web requests in the last 24 hours',
});
register.registerMetric(amountOfOsuWebRequestsInTheLast24Hours);

const amountOfApiOrOsuWebRequestsInTheLast24Hours = new client.Gauge({
	name: 'osu_api_or_web_requests_in_the_last_24_hours',
	help: 'Osu api or web requests in the last 24 hours',
});
register.registerMetric(amountOfApiOrOsuWebRequestsInTheLast24Hours);

const timeBehindMatchCreation = new client.Gauge({
	name: 'time_behind_match_creation',
	help: 'The time behind match creation in seconds',
});
register.registerMetric(timeBehindMatchCreation);

const beatmapsAccessInTheLastMinute = new client.Gauge({
	name: 'beatmaps_access_in_the_last_minute',
	help: 'Beatmaps access in the last minute',
});
register.registerMetric(beatmapsAccessInTheLastMinute);

const discordUsersAccessInTheLastMinute = new client.Gauge({
	name: 'discord_users_access_in_the_last_minute',
	help: 'Discord users access in the last minute',
});
register.registerMetric(discordUsersAccessInTheLastMinute);

const elitiriDataAccessInTheLastMinute = new client.Gauge({
	name: 'elitiri_data_access_in_the_last_minute',
	help: 'Elitiri data access in the last minute',
});
register.registerMetric(elitiriDataAccessInTheLastMinute);

const guildsAccessInTheLastMinute = new client.Gauge({
	name: 'guilds_access_in_the_last_minute',
	help: 'Guilds access in the last minute',
});
register.registerMetric(guildsAccessInTheLastMinute);

const multiScoresAccessInTheLastMinute = new client.Gauge({
	name: 'multi_scores_access_in_the_last_minute',
	help: 'Multi scores access in the last minute',
});
register.registerMetric(multiScoresAccessInTheLastMinute);

const osuDataAccessInTheLastMinute = new client.Gauge({
	name: 'osu_data_access_in_the_last_minute',
	help: 'Osu data access in the last minute',
});
register.registerMetric(osuDataAccessInTheLastMinute);

const processQueueAccessInTheLastMinute = new client.Gauge({
	name: 'process_queue_access_in_the_last_minute',
	help: 'Process queue access in the last minute',
});
register.registerMetric(processQueueAccessInTheLastMinute);

const serverActivityAccessInTheLastMinute = new client.Gauge({
	name: 'server_activity_access_in_the_last_minute',
	help: 'Server activity access in the last minute',
});
register.registerMetric(serverActivityAccessInTheLastMinute);

const runningTournamentMatches = new client.Gauge({
	name: 'running_tournament_matches',
	help: 'Running tournament matches',
});
register.registerMetric(runningTournamentMatches);

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

					amountOfApiOrOsuWebRequestsInTheLast24Hours.inc();
					setTimeout(() => {
						amountOfApiOrOsuWebRequestsInTheLast24Hours.dec();
					}, 86400000);
				} else if (message === 'osu! website') {
					amountOfOsuWebRequestsInTheLast24Hours.inc();
					setTimeout(() => {
						amountOfOsuWebRequestsInTheLast24Hours.dec();
					}, 86400000);

					amountOfApiOrOsuWebRequestsInTheLast24Hours.inc();
					setTimeout(() => {
						amountOfApiOrOsuWebRequestsInTheLast24Hours.dec();
					}, 86400000);
				} else if (typeof message === 'string' && message.startsWith('saveMultiMatches')) {
					const timeBehind = message.split(' ')[1];
					timeBehindMatchCreation.set(parseInt(timeBehind));
				} else if (typeof message === 'string' && message.startsWith('traceDatabaseQueries:')) {
					if (message.includes('DBOsuBeatmaps')) {
						beatmapsAccessInTheLastMinute.inc();
						setTimeout(() => {
							beatmapsAccessInTheLastMinute.dec();
						}, 60000);
					} else if (message.includes('DBDiscordUsers')) {
						discordUsersAccessInTheLastMinute.inc();
						setTimeout(() => {
							discordUsersAccessInTheLastMinute.dec();
						}, 60000);
					} else if (message.includes('DBElitiriCupSignUp')
						|| message.includes('DBElitiriCupStaff')
						|| message.includes('DBElitiriCupSubmissions')
						|| message.includes('DBElitiriCupLobbies')) {
						elitiriDataAccessInTheLastMinute.inc();
						setTimeout(() => {
							elitiriDataAccessInTheLastMinute.dec();
						}, 60000);
					} else if (message.includes('DBGuilds')
						|| message.includes('DBReactionRoles')
						|| message.includes('DBReactionRolesHeader')
						|| message.includes('DBAutoRoles')
						|| message.includes('DBTemporaryVoices')
						|| message.includes('DBActivityRoles')
						|| message.includes('DBStarboardMessages')
						|| message.includes('DBTickets')
						|| message.includes('DBBirthdayGuilds')
						|| message.includes('DBOsuGuildTrackers')) {
						guildsAccessInTheLastMinute.inc();
						setTimeout(() => {
							guildsAccessInTheLastMinute.dec();
						}, 60000);
					} else if (message.includes('DBOsuMultiScores')) {
						multiScoresAccessInTheLastMinute.inc();
						setTimeout(() => {
							multiScoresAccessInTheLastMinute.dec();
						}, 60000);
					} else if (message.includes('DBMOTDPoints')
						|| message.includes('DBOsuTourneyFollows')
						|| message.includes('DBDuelRatingHistory')
						|| message.includes('DBOsuForumPosts')
						|| message.includes('DBOsuTrackingUsers')) {
						osuDataAccessInTheLastMinute.inc();
						setTimeout(() => {
							osuDataAccessInTheLastMinute.dec();
						}, 60000);
					} else if (message.includes('DBProcessQueue')) {
						processQueueAccessInTheLastMinute.inc();
						setTimeout(() => {
							processQueueAccessInTheLastMinute.dec();
						}, 60000);
					} else if (message.includes('DBServerUserActivity')) {
						serverActivityAccessInTheLastMinute.inc();
						setTimeout(() => {
							serverActivityAccessInTheLastMinute.dec();
						}, 60000);
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
						.catch(console.error);
				}
			});
		});
	})
	.catch(console.error);