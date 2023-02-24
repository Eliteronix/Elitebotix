const { saveOsuMultiScores, logDatabaseQueries } = require('../utils');
const osu = require('node-osu');
const { DBOsuMultiScores, DBProcessQueue } = require('../dbObjects');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('importMatch');
		let args = processQueueEntry.additions.split(';');

		let matchId = args[0];

		// eslint-disable-next-line no-undef
		let APItoken = process.env.OSUTOKENSV1.split('-')[parseInt(matchId) % process.env.OSUTOKENSV1.split('-').length];

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(APItoken, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		// eslint-disable-next-line no-undef
		process.send('osu!API');
		await osuApi.getMatch({ mp: matchId })
			.then(async (match) => {
				let sixHoursAgo = new Date();
				sixHoursAgo.setUTCHours(sixHoursAgo.getUTCHours() - 6);
				if (match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
					//Match completed / 6 hours since start
					await saveOsuMultiScores(match);
					let now = new Date();
					let minutesBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60) % 60;
					let hoursBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60) % 24;
					let daysBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60 / 24);
					client.shard.broadcastEval(async (c, { message, matchID }) => {
						// Remove match from client
						while (c.duels.indexOf(matchID) > -1) {
							c.duels.splice(c.duels.indexOf(matchID), 1);
						}

						while (c.otherMatches.indexOf(matchID) > -1) {
							c.otherMatches.splice(c.otherMatches.indexOf(matchID), 1);
						}

						while (c.matchTracks.indexOf(matchID) > -1) {
							c.matchTracks.splice(c.matchTracks.indexOf(matchID), 1);
						}

						let channel;
						// eslint-disable-next-line no-undef
						if (process.env.SERVER === 'Live') {
							channel = await c.channels.cache.get('891314445559676928');
							// eslint-disable-next-line no-undef
						} else if (process.env.SERVER === 'QA') {
							channel = await c.channels.cache.get('892873577479692358');
						} else {
							channel = await c.channels.cache.get('1013789721014571090');
						}

						if (channel) {
							await channel.send(message);
						}

						if (c.update === 1 && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks.length === 0 && c.bingoMatches === 0) {

							// eslint-disable-next-line no-undef
							process.exit();
						}
					}, { context: { message: `<https://osu.ppy.sh/mp/${matchId}> ${daysBehindToday}d ${hoursBehindToday}h ${minutesBehindToday}m \`${match.name}\` done`, matchID: parseInt(matchId) } });

					await processQueueEntry.destroy();
					// eslint-disable-next-line no-undef
					return process.send('importMatch');
				}

				//Match has not been completed yet / 6 hours didn't pass
				await saveOsuMultiScores(match);

				logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores');
				let playedRound = DBOsuMultiScores.findOne({
					where: {
						matchId: matchId,
					}
				});

				if (playedRound) {
					let importTasks = await DBProcessQueue.count({
						where: {
							task: 'importMatch',
						},
					});

					let seconds = 180 + importTasks * 20;

					let date = new Date();
					date.setUTCSeconds(date.getUTCSeconds() + seconds);
					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					return await processQueueEntry.save();
				}

				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 1);
				processQueueEntry.date = date;
				processQueueEntry.beingExecuted = false;
				return await processQueueEntry.save();
			})
			.catch(async (error) => {
				console.error(error, `going same importMatch.js https://osu.ppy.sh/community/matches/${parseInt(matchId)}`);
				//Go same if error
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 5);
				processQueueEntry.date = date;
				processQueueEntry.beingExecuted = false;
				return await processQueueEntry.save();
			});
	},
};