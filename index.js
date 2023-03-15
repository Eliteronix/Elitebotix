const { ShardingManager } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

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

const soloScoresAccessInTheLastMinute = new client.Gauge({
	name: 'solo_scores_access_in_the_last_minute',
	help: 'Solo scores access in the last minute',
});
register.registerMetric(soloScoresAccessInTheLastMinute);

const runningTournamentMatches = new client.Gauge({
	name: 'running_tournament_matches',
	help: 'Running tournament matches',
});
register.registerMetric(runningTournamentMatches);

let uniqueDiscordUsersList = [];

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

let uniqueOsuUsersList = [];

const uniqueOsuUsersInTheLastMinute = new client.Gauge({
	name: 'unique_osu_users_in_the_last_minute',
	help: 'Unique osu users in the last minute',
});
register.registerMetric(uniqueOsuUsersInTheLastMinute);

const uniqueOsuUsersInTheLastHour = new client.Gauge({
	name: 'unique_osu_users_in_the_last_hour',
	help: 'Unique osu users in the last hour',
});
register.registerMetric(uniqueOsuUsersInTheLastHour);

const uniqueOsuUsersInTheLastDay = new client.Gauge({
	name: 'unique_osu_users_in_the_last_day',
	help: 'Unique osu users in the last day',
});
register.registerMetric(uniqueOsuUsersInTheLastDay);

const uniqueOsuUsersInTheLastWeek = new client.Gauge({
	name: 'unique_osu_users_in_the_last_week',
	help: 'Unique osu users in the last week',
});
register.registerMetric(uniqueOsuUsersInTheLastWeek);

const uniqueOsuUsers = new client.Gauge({
	name: 'unique_osu_users',
	help: 'Unique osu users',
});
register.registerMetric(uniqueOsuUsers);

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

const commandSpecificMetrics = [];

//get all command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

//Add the commands from the command files to the client.commands collection
for (const file of commandFiles) {
	const commandMetrics = new client.Counter({
		name: `command_${file.replace('.js', '').replaceAll('-', '_')}`,
		help: `Command ${file.replace('.js', '').replaceAll('-', '_')} used`,
	});
	register.registerMetric(commandMetrics);

	// set a new item in the Array
	commandSpecificMetrics.push({ command: file.replace('.js', '').replaceAll('-', '_'), counter: commandMetrics });
}

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
		totalShards: 1
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
				} else if (typeof message === 'string' && message.startsWith('osu! website')) {
					osuWebRequestQueue.push(message.replace('osu! website ', ''));
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
					} else if (message.includes('DBOsuSoloScores')) {
						soloScoresAccessInTheLastMinute.inc();
						setTimeout(() => {
							soloScoresAccessInTheLastMinute.dec();
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
				} else if (typeof message === 'string' && message.startsWith('discorduser')) {
					let discordUser = uniqueDiscordUsersList.find(user => user.id === message.split(' ')[1]);
					if (discordUser) {
						discordUser.lastRequest = Date.now();
					} else {
						uniqueDiscordUsersList.push({
							id: message.split(' ')[1],
							lastRequest: Date.now()
						});
					}
				} else if (typeof message === 'string' && message.startsWith('osuuser')) {
					let osuUser = uniqueOsuUsersList.find(user => user.id === message.split(' ')[1]);
					if (osuUser) {
						osuUser.lastRequest = Date.now();
					} else {
						uniqueOsuUsersList.push({
							id: message.split(' ')[1],
							lastRequest: Date.now()
						});
					}
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
					}
				}
			});
		});
	})
	.catch(console.error);

setInterval(() => {
	uniqueDiscordUsersInTheLastMinute.set(uniqueDiscordUsersList.filter(user => Date.now() - user.lastRequest < 60000).length);
	uniqueOsuUsersInTheLastMinute.set(uniqueOsuUsersList.filter(user => Date.now() - user.lastRequest < 60000).length);

	uniqueDiscordUsersInTheLastHour.set(uniqueDiscordUsersList.filter(user => Date.now() - user.lastRequest < 3600000).length);
	uniqueOsuUsersInTheLastHour.set(uniqueOsuUsersList.filter(user => Date.now() - user.lastRequest < 3600000).length);

	uniqueDiscordUsersInTheLastDay.set(uniqueDiscordUsersList.filter(user => Date.now() - user.lastRequest < 86400000).length);
	uniqueOsuUsersInTheLastDay.set(uniqueOsuUsersList.filter(user => Date.now() - user.lastRequest < 86400000).length);

	uniqueDiscordUsersInTheLastWeek.set(uniqueDiscordUsersList.filter(user => Date.now() - user.lastRequest < 604800000).length);
	uniqueOsuUsersInTheLastWeek.set(uniqueOsuUsersList.filter(user => Date.now() - user.lastRequest < 604800000).length);

	uniqueDiscordUsers.set(uniqueDiscordUsersList.length);
	uniqueOsuUsers.set(uniqueOsuUsersList.length);
}, 5000);

setInterval(() => {
	osuWebRequestsQueueLength.set([...new Set(osuWebRequestQueue)].length);

	if (osuWebRequestQueue.length) {
		amountOfOsuWebRequestsInTheLast24Hours.inc();
		setTimeout(() => {
			amountOfOsuWebRequestsInTheLast24Hours.dec();
		}, 86400000);

		amountOfApiOrOsuWebRequestsInTheLast24Hours.inc();
		setTimeout(() => {
			amountOfApiOrOsuWebRequestsInTheLast24Hours.dec();
		}, 86400000);

		manager.shards.forEach(shard => {
			shard.send({ type: 'osuWebRequest', data: osuWebRequestQueue[0] });
		});

		osuWebRequestQueue = osuWebRequestQueue.filter(item => item !== osuWebRequestQueue[0]);
	}
}, 1000);