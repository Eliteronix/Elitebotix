const { saveOsuMultiScores, updateCurrentMatchesChannel, logOsuAPICalls } = require('../utils');
const osu = require('node-osu');
const { DBProcessQueue, DBOsuMultiMatches } = require('../dbObjects');
const { logBroadcastEval } = require('../config.json');
const { Op } = require('sequelize');

module.exports = {
	async execute(client, processQueueEntry) {
		// console.log('importMatch');
		let args = processQueueEntry.additions.split(';');

		let matchId = args[0];

		let importMatchTasks = await DBProcessQueue.count({
			where: {
				id: {
					[Op.lt]: processQueueEntry.id,
				},
				task: 'importMatch',
				additions: {
					[Op.like]: `${matchId};%`,
				}
			},
		});

		if (importMatchTasks > 0) {
			await processQueueEntry.destroy();
			updateCurrentMatchesChannel(client);
			return process.send('importMatch');
		}

		let APItoken = process.env.OSUTOKENSV1.split('-')[parseInt(matchId) % process.env.OSUTOKENSV1.split('-').length];

		const osuApi = new osu.Api(APItoken, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		logOsuAPICalls('processQueueTasks/importMatch.js');
		await osuApi.getMatch({ mp: matchId })
			.then(async (match) => {
				let sixHoursAgo = new Date();
				sixHoursAgo.setUTCHours(sixHoursAgo.getUTCHours() - 6);
				if (match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
					//Match completed / 6 hours since start
					await saveOsuMultiScores(match, client);
					let now = new Date();
					let minutesBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60) % 60;
					let hoursBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60) % 24;
					let daysBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60 / 24);

					if (logBroadcastEval) {
						// eslint-disable-next-line no-console
						console.log('Broadcasting processQueueTasks/importMatch.js to shards...');
					}

					client.shard.broadcastEval(async (c, { message, matchID }) => {
						// Remove match from client
						while (c.matchTracks.indexOf(matchID) > -1) {
							c.matchTracks.splice(c.matchTracks.indexOf(matchID), 1);
						}

						let channel;
						if (process.env.SERVER === 'Live') {
							channel = await c.channels.cache.get('891314445559676928');
						} else if (process.env.SERVER === 'QA') {
							channel = await c.channels.cache.get('892873577479692358');
						} else {
							channel = await c.channels.cache.get('1013789721014571090');
						}

						if (channel) {
							await channel.send(message);
						}

						if (c.update === 1 && c.matchTracks.length === 0 && c.bingoMatches.length === 0 && c.hostCommands.length === 0) {

							process.exit();
						}
					}, { context: { message: `<https://osu.ppy.sh/mp/${matchId}> ${daysBehindToday}d ${hoursBehindToday}h ${minutesBehindToday}m \`${match.name}\` done`, matchID: parseInt(matchId) } });

					await processQueueEntry.destroy();
					updateCurrentMatchesChannel(client);

					return process.send('importMatch');
				}

				//Match has not been completed yet / 6 hours didn't pass
				await saveOsuMultiScores(match, client);

				let playedRounds = DBOsuMultiMatches.count({
					where: {
						matchId: matchId,
					}
				});

				let tourneyMatch = 0;
				if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
					tourneyMatch = 1;
				}

				if (playedRounds) {
					let importTasks = await DBProcessQueue.count({
						where: {
							task: 'importMatch',
						},
					});

					let seconds = 180 + importTasks * 20;

					let players = [];

					for (let i = 0; i < match.games.length; i++) {
						for (let j = 0; j < match.games[i].scores.length; j++) {
							if (players.indexOf(match.games[i].scores[j].userId) === -1) {
								players.push(match.games[i].scores[j].userId);
							}
						}
					}

					if (players.length === 0) {
						console.log(`No players found for match ${matchId} (${match.name})`);
						console.log(playedRounds);
					}

					processQueueEntry.additions = `${matchId};${tourneyMatch};${Date.parse(match.raw_start)};${match.name};${players.join(',')}`;

					if (!args[4] || args[4] !== players.join(',')) {
						updateCurrentMatchesChannel(client);
					}

					let date = new Date();
					date.setUTCSeconds(date.getUTCSeconds() + seconds);
					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					return await processQueueEntry.save();
				}

				processQueueEntry.additions = `${matchId};${tourneyMatch};${Date.parse(match.raw_start)};${match.name}`;

				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 1);
				processQueueEntry.date = date;
				processQueueEntry.beingExecuted = false;
				return await processQueueEntry.save();
			})
			.catch(async (error) => {
				console.error(error, `[${client.shardId}] API Key Index ${parseInt(matchId) % process.env.OSUTOKENSV1.split('-').length} going same importMatch.js https://osu.ppy.sh/community/matches/${parseInt(matchId)}`);
				//Go same if error
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 5);
				processQueueEntry.date = date;
				processQueueEntry.beingExecuted = false;
				return await processQueueEntry.save();
			});
	},
};