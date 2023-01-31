const osu = require('node-osu');
const { DBOsuMultiScores, DBProcessQueue } = require('../dbObjects');
const { saveOsuMultiScores, logDatabaseQueries } = require('../utils');
const { Op } = require('sequelize');

//Archiving started around 40000000

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('saveMultiMatches');
		let args = processQueueEntry.additions.split(';');

		let matchID = args[0];

		// eslint-disable-next-line no-undef
		let APItoken = process.env.OSUTOKENSV1.split('-')[parseInt(matchID) % process.env.OSUTOKENSV1.split('-').length];

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(APItoken, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Live' && matchID === '90305374') {
			matchID = '90305375';
		}

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'QA' && matchID === '56267496') {
			// eslint-disable-next-line no-undef, no-console
			console.log(`Manually deleted task for saving Multi Matches for ${matchID} ${process.env.SERVER}`);
			return await processQueueEntry.destroy();
		}

		// eslint-disable-next-line no-undef
		if (process.env.SERVER === 'Dev') {
			return await processIncompleteScores(osuApi, client, processQueueEntry, '964656429485154364', 10);
		}

		await osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				let sixHoursAgo = new Date();
				sixHoursAgo.setUTCHours(sixHoursAgo.getUTCHours() - 6);

				let fiveMinutesAgo = new Date();
				fiveMinutesAgo.setUTCMinutes(fiveMinutesAgo.getUTCMinutes() - 5);
				if (match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
					if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
						await saveOsuMultiScores(match);
						let now = new Date();
						let minutesBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60) % 60;
						let hoursBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60) % 24;
						let daysBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60 / 24);
						client.shard.broadcastEval(async (c, { message, matchID }) => {
							// Remove all instances of the match from client
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
						}, { context: { message: `<https://osu.ppy.sh/mp/${matchID}> ${daysBehindToday}d ${hoursBehindToday}h ${minutesBehindToday}m \`${match.name}\` done`, matchID: parseInt(matchID) } });
					}
					//Go next if match found and ended / too long going already
					processQueueEntry.additions = `${parseInt(matchID) + 1}`;

					let date = new Date();
					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					return await processQueueEntry.save();
				} else if (Date.parse(match.raw_start) < fiveMinutesAgo) {
					if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
						await saveOsuMultiScores(match);
						let date = new Date();
						date.setUTCMinutes(date.getUTCMinutes() + 5);
						DBProcessQueue.create({ guildId: 'None', task: 'importMatch', additions: `${matchID}`, priority: 1, date: date });
					}

					processQueueEntry.additions = `${parseInt(matchID) + 1}`;

					let now = new Date();
					processQueueEntry.date = now;
					processQueueEntry.beingExecuted = false;
					return await processQueueEntry.save();
				}

				return await processIncompleteScores(osuApi, client, processQueueEntry, '959499050246344754', 5);
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					//Go next if match not found
					processQueueEntry.additions = `${parseInt(matchID) + 1}`;
					let date = new Date();
					processQueueEntry.date = date;
					processQueueEntry.beingExecuted = false;
					return await processQueueEntry.save();
				} else {
					try {
						// Check using node fetch
						const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
						let response = await fetch(`https://osu.ppy.sh/community/matches/${parseInt(matchID)}`);
						let htmlCode = await response.text();
						let isolatedContent = htmlCode.replace(/[\s\S]+<script id="json-events" type="application\/json">/gm, '').replace(/<\/script>[\s\S]+/gm, '');
						let json = JSON.parse(isolatedContent);
						if (Date.parse(json.events[json.events.length - 1].timestamp) - Date.parse(json.match.start_time) > 86400000) {
							//Go next if over 24 hours long game
							processQueueEntry.additions = `${parseInt(matchID) + 1}`;
							let date = new Date();
							processQueueEntry.date = date;
							processQueueEntry.beingExecuted = false;
							return await processQueueEntry.save();
						} else {
							//Go same if under 24 hours long game
							let date = new Date();
							date.setUTCMinutes(date.getUTCMinutes() + 1);
							processQueueEntry.date = date;
							processQueueEntry.beingExecuted = false;
							return await processQueueEntry.save();
						}
					} catch (error) {
						console.error(error, `going same saveMultiMatches.js https://osu.ppy.sh/community/matches/${parseInt(matchID)}`);
						//Go same if error
						let date = new Date();
						date.setUTCMinutes(date.getUTCMinutes() + 1);
						processQueueEntry.date = date;
						processQueueEntry.beingExecuted = false;
						return await processQueueEntry.save();
					}
				}
			});
	},
};

async function processIncompleteScores(osuApi, client, processQueueEntry, channelId, secondsToWait) {
	//Go same if match found and not ended / too long going already
	//Reimport an old match to clean up the database
	logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores incomplete scores');
	let incompleteMatchScore = await DBOsuMultiScores.findOne({
		where: {
			tourneyMatch: true,
			[Op.or]: [
				{
					warmup: null
				},
			],
		},
		order: [
			['updatedAt', 'ASC']
		]
	});

	if (incompleteMatchScore) {
		await osuApi.getMatch({ mp: incompleteMatchScore.matchId })
			.then(async (match) => {
				client.shard.broadcastEval(async (c, { channelId, message }) => {
					let channel = await c.channels.cache.get(channelId);
					if (channel) {
						await channel.send(message);
					}
				}, { context: { channelId: channelId, message: `<https://osu.ppy.sh/mp/${match.id}> | ${incompleteMatchScore.updatedAt.getUTCHours().toString().padStart(2, 0)}:${incompleteMatchScore.updatedAt.getUTCMinutes().toString().padStart(2, 0)} ${incompleteMatchScore.updatedAt.getUTCDate().toString().padStart(2, 0)}.${(incompleteMatchScore.updatedAt.getUTCMonth() + 1).toString().padStart(2, 0)}.${incompleteMatchScore.updatedAt.getUTCFullYear()} | \`${match.name}\`` } });

				incompleteMatchScore.changed('updatedAt', true);
				await incompleteMatchScore.save();

				await saveOsuMultiScores(match);
			})
			.catch(async (err) => {
				logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores incomplete scores backup');
				let incompleteScores = await DBOsuMultiScores.findAll({
					where: {
						matchId: incompleteMatchScore.matchId
					}
				});
				if (err.message === 'Not found') {
					for (let i = 0; i < incompleteScores.length; i++) {
						incompleteScores[i].warmup = false;
						incompleteScores[i].maxCombo = 0;
						incompleteScores[i].pp = 0;
						await incompleteScores[i].save();
					}
				} else {
					for (let i = 0; i < incompleteScores.length; i++) {
						incompleteScores[i].changed('updatedAt', true);
						await incompleteScores[i].save();
					}
				}
			});
	} else {
		// Verify matches instead
		logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores verify matches');
		let incompleteMatch = await DBOsuMultiScores.findOne({
			where: {
				tourneyMatch: true,
				warmup: false,
				verifiedAt: null,
				verifiedBy: null,
				matchName: {
					[Op.startsWith]: 'o!mm'
				},
			},
			order: [
				['updatedAt', 'ASC']
			]
		});

		if (incompleteMatch) {
			// Fetch the match and check if the match was created by MaidBot
			await osuApi.getMatch({ mp: incompleteMatch.matchId })
				.then(async (match) => {
					try {
						await fetch(`https://osu.ppy.sh/community/matches/${match.id}`)
							.then(async (res) => {
								let htmlCode = await res.text();
								htmlCode = htmlCode.replace(/&quot;/gm, '"');
								const matchRunningRegex = /{"match".+,"current_game_id":\d+}/gm;
								const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
								const matchesRunning = matchRunningRegex.exec(htmlCode);
								const matchesPaused = matchPausedRegex.exec(htmlCode);

								let regexMatch = null;
								if (matchesRunning && matchesRunning[0]) {
									regexMatch = matchesRunning[0];
								}

								if (matchesPaused && matchesPaused[0]) {
									regexMatch = matchesPaused[0];
								}

								if (regexMatch) {
									let json = JSON.parse(regexMatch);

									if (json.events[0].user_id === 16173747 && json.events[0].detail.type === 'match-created') {
										await DBOsuMultiScores.update({
											tourneyMatch: true,
											verifiedAt: new Date(),
											verifiedBy: 31050083, // Elitebotix
											verificationComment: 'Match created by MaidBot',
										}, {
											where: {
												matchId: match.id,
											},
										});

										let guildId = '727407178499096597';
										let channelId = '1068905937219362826';

										// eslint-disable-next-line no-undef
										if (process.env.SERVER === 'Dev') {
											guildId = '800641468321759242';
											channelId = '1070013925334204516';
										}

										client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
											let guild = await c.guilds.cache.get(guildId);

											if (!guild) {
												return;
											}

											let channel = await guild.channels.cache.get(channelId);

											if (!channel) {
												return;
											}

											await channel.send(message);
										}, {
											context: {
												guildId: guildId,
												channelId: channelId,
												message: `Valid: True | Comment: Match created by MaidBot | https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
											}
										});
									} else {
										await DBOsuMultiScores.update({
											verifiedBy: 31050083, // Elitebotix
											verificationComment: 'Not determinable if match was created by MaidBot',
										}, {
											where: {
												matchId: match.id,
											},
										});
									}
								}
							});
					} catch (e) {
						if (!e.message.endsWith('reason: Client network socket disconnected before secure TLS connection was established')
							&& !e.message.endsWith('reason: read ECONNRESET')) {
							console.error(e);
						}
						// Go same if error
						secondsToWait = secondsToWait + 60;
					}
				})
				.catch(async (err) => {
					if (err.message === 'Not found') {
						//If its not found anymore it should be fake because it must be created in a different way
						await DBOsuMultiScores.update({
							tourneyMatch: false,
							verifiedAt: new Date(),
							verifiedBy: 31050083, // Elitebotix
							verificationComment: 'o!mm not found - Fake because MaidBot uses !mp make to create matches',
						}, {
							where: {
								matchId: incompleteMatch.matchId,
							},
						});

						let guildId = '727407178499096597';
						let channelId = '1068905937219362826';

						// eslint-disable-next-line no-undef
						if (process.env.SERVER === 'Dev') {
							guildId = '800641468321759242';
							channelId = '1070013925334204516';
						}

						client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
							let guild = await c.guilds.cache.get(guildId);

							if (!guild) {
								return;
							}

							let channel = await guild.channels.cache.get(channelId);

							if (!channel) {
								return;
							}

							await channel.send(message);
						}, {
							context: {
								guildId: guildId,
								channelId: channelId,
								message: `**Changed**: - Valid: False | Comment: o!mm not found - Fake because MaidBot uses !mp make to create matches | https://osu.ppy.sh/mp/${incompleteMatch.matchId} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
							}
						});
					} else {
						// Go same if error
						secondsToWait = secondsToWait + 60;
					}
				});
		} else {
			secondsToWait = secondsToWait + 60;
		}
	}

	let date = new Date();
	date.setUTCSeconds(date.getUTCSeconds() + secondsToWait);
	processQueueEntry.date = date;
	processQueueEntry.beingExecuted = false;
	return await processQueueEntry.save();
}