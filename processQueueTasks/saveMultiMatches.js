const osu = require('node-osu');
const { DBProcessQueue, DBOsuMultiMatches, DBOsuMultiGames, DBOsuMultiGameScores } = require('../dbObjects');
const { saveOsuMultiScores, logDatabaseQueries, awaitWebRequestPermission, updateCurrentMatchesChannel, logOsuAPICalls, sendMessageToLogChannel } = require('../utils');
const { Op } = require('sequelize');
const { logBroadcastEval } = require('../config.json');

//Archiving started around 40000000

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let date = new Date();
		date.setUTCMinutes(date.getUTCMinutes() + 5);
		processQueueEntry.date = date;
		processQueueEntry.beingExecuted = false;
		return await processQueueEntry.save();

		// console.log(client.shardId, 'saveMultiMatches');
		let args = processQueueEntry.additions.split(';');

		let matchID = args[0];

		let APItoken = process.env.OSUTOKENSV1.split('-')[parseInt(matchID) % process.env.OSUTOKENSV1.split('-').length];

		const osuApi = new osu.Api(APItoken, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		if (process.env.SERVER === 'Dev') {
			return await processIncompleteScores(osuApi, client, processQueueEntry, '964656429485154364', 5);
		}

		logOsuAPICalls('processQueueTasks/saveMultiMatches.js main');
		await osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				process.send('saveMultiMatches ' + Math.floor((Date.now() - Date.parse(match.raw_start)) / 1000));
				let sixHoursAgo = new Date();
				sixHoursAgo.setUTCHours(sixHoursAgo.getUTCHours() - 6);

				let fiveMinutesAgo = new Date();
				fiveMinutesAgo.setUTCMinutes(fiveMinutesAgo.getUTCMinutes() - 5);
				if (match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
					if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
						await saveOsuMultiScores(match, client);
						let now = new Date();
						let minutesBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60) % 60;
						let hoursBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60) % 24;
						let daysBehindToday = parseInt((now.getTime() - Date.parse(match.raw_start)) / 1000 / 60 / 60 / 24);

						if (logBroadcastEval) {
							// eslint-disable-next-line no-console
							console.log('Broadcasting processQueueTasks/saveMultiMatches.js current match to shards...');
						}

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

							if (c.update === 1 && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks.length === 0 && c.bingoMatches.length === 0 && c.hostCommands.length === 0) {

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
						await saveOsuMultiScores(match, client);
						let date = new Date();
						date.setUTCMinutes(date.getUTCMinutes() + 5);
						logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBProcessQueue create');
						await DBProcessQueue.create({ guildId: 'None', task: 'importMatch', additions: `${matchID};1;${Date.parse(match.raw_start)};${match.name.toLowerCase()}`, priority: 1, date: date });
						updateCurrentMatchesChannel(client);

						process.send('importMatch');
					}

					processQueueEntry.additions = `${parseInt(matchID) + 1}`;

					let now = new Date();
					processQueueEntry.date = now;
					processQueueEntry.beingExecuted = false;
					return await processQueueEntry.save();
				}

				return await processIncompleteScores(osuApi, client, processQueueEntry, '959499050246344754', 0);
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
						await awaitWebRequestPermission(`https://osu.ppy.sh/community/matches/${parseInt(matchID)}`, client);
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
						console.error(error, `API Key Index ${parseInt(matchID) % process.env.OSUTOKENSV1.split('-').length} going same saveMultiMatches.js https://osu.ppy.sh/community/matches/${parseInt(matchID)}`);
						//Go same if error
						let date = new Date();
						date.setUTCMinutes(date.getUTCMinutes() + 5);
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
	logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiGames incomplete scores');
	let incompleteMatchScore = await DBOsuMultiGames.findOne({
		attributes: ['id', 'matchId', 'updatedAt'],
		where: {
			tourneyMatch: true,
			warmup: null
		},
		order: [
			['updatedAt', 'ASC']
		]
	});

	if (incompleteMatchScore) {
		logOsuAPICalls('processQueueTasks/saveMultiMatches.js incompleteMatchScore');
		await osuApi.getMatch({ mp: incompleteMatchScore.matchId })
			.then(async (match) => {
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting processQueueTasks/saveMultiMatches.js incompleteMatchScore to shards...');
				}

				client.shard.broadcastEval(async (c, { channelId, message }) => {
					let channel = await c.channels.cache.get(channelId);
					if (channel) {
						await channel.send(message);
					}
				}, { context: { channelId: channelId, message: `<https://osu.ppy.sh/mp/${match.id}> | ${incompleteMatchScore.updatedAt.getUTCHours().toString().padStart(2, 0)}:${incompleteMatchScore.updatedAt.getUTCMinutes().toString().padStart(2, 0)} ${incompleteMatchScore.updatedAt.getUTCDate().toString().padStart(2, 0)}.${(incompleteMatchScore.updatedAt.getUTCMonth() + 1).toString().padStart(2, 0)}.${incompleteMatchScore.updatedAt.getUTCFullYear()} | \`${match.name}\`` } });

				incompleteMatchScore.changed('updatedAt', true);
				await incompleteMatchScore.save();

				await saveOsuMultiScores(match, client);
			})
			.catch(async (err) => {
				logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiGames incomplete scores backup');
				let incompleteGames = await DBOsuMultiGames.findAll({
					attributes: ['id', 'warmup', 'updatedAt'],
					where: {
						matchId: incompleteMatchScore.matchId
					}
				});

				logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiGameScores incomplete scores backup');
				let incompleteScores = await DBOsuMultiGameScores.findAll({
					attributes: ['id', 'maxCombo', 'pp', 'updatedAt'],
					where: {
						matchId: incompleteMatchScore.matchId
					}
				});

				if (err.message === 'Not found') {
					for (let i = 0; i < incompleteGames.length; i++) {
						incompleteGames[i].warmup = false;
						await incompleteGames[i].save();
					}

					for (let i = 0; i < incompleteScores.length; i++) {
						incompleteScores[i].maxCombo = 0;
						incompleteScores[i].pp = 0;
						await incompleteScores[i].save();
					}
				} else {
					for (let i = 0; i < incompleteGames.length; i++) {
						incompleteGames[i].changed('updatedAt', true);
						await incompleteGames[i].save();
					}

					for (let i = 0; i < incompleteScores.length; i++) {
						incompleteScores[i].changed('updatedAt', true);
						await incompleteScores[i].save();
					}
				}
			});
	}

	if (!incompleteMatchScore) {
		let logVerificationProcess = false;

		// Verify matches instead
		logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiMatches verify matches');
		let incompleteMatch = await DBOsuMultiMatches.findOne({
			attributes: ['matchId'],
			where: {
				tourneyMatch: true,
				verifiedAt: null,
				verifiedBy: null,
				matchName: {
					[Op.startsWith]: 'o!mm'
				},
				matchEndDate: {
					[Op.not]: null,
				},
			},
			order: [
				['matchId', 'ASC']
			]
		});

		if (incompleteMatch) {
			// Fetch the match and check if the match was created by MaidBot
			logOsuAPICalls('processQueueTasks/saveMultiMatches.js maidbot match check');
			await osuApi.getMatch({ mp: incompleteMatch.matchId })
				.then(async (match) => {
					try {
						await awaitWebRequestPermission(`https://osu.ppy.sh/community/matches/${match.id}`, client);
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

									if (json.events[0].detail.type === 'match-created') {
										if (json.events[0].user_id === 16173747) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update maidbot match');
											await DBOsuMultiMatches.update({
												tourneyMatch: true,
												verifiedAt: new Date(),
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match created by MaidBot',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update maidbot match');
											await DBOsuMultiGames.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update maidbot match');
											await DBOsuMultiGameScores.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match created by MaidBot`);
											}

											await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Match created by MaidBot\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
										} else {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update maidbot match');
											await DBOsuMultiMatches.update({
												tourneyMatch: false,
												verifiedAt: new Date(),
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match not created by MaidBot',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update maidbot match');
											await DBOsuMultiGames.update({
												tourneyMatch: false,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update maidbot match');
											await DBOsuMultiGameScores.update({
												tourneyMatch: false,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified as fake - Match not created by MaidBot`);
											}

											await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`ini\n[Changed]\`\`\`\`\`\`diff\n- Valid: False\nComment: Match not created by MaidBot\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
										}
									} else {
										logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update not determinable maidbot match');
										await DBOsuMultiMatches.update({
											verifiedBy: 31050083, // Elitebotix
											verificationComment: 'Not determinable if match was created by MaidBot',
										}, {
											where: {
												matchId: match.id,
											},
										});

										if (logVerificationProcess) {
											// eslint-disable-next-line no-console
											console.log(`Match ${match.id} not verified - Not determinable if match was created by MaidBot`);
										}
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
						logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update fake maidbot match');
						await DBOsuMultiMatches.update({
							tourneyMatch: false,
							verifiedAt: new Date(),
							verifiedBy: 31050083, // Elitebotix
							verificationComment: 'o!mm not found - Fake because MaidBot uses !mp make to create matches',
						}, {
							where: {
								matchId: incompleteMatch.matchId,
							},
						});

						logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update fake maidbot match');
						await DBOsuMultiGames.update({
							tourneyMatch: false,
						}, {
							where: {
								matchId: incompleteMatch.matchId,
							},
						});

						logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update fake maidbot match');
						await DBOsuMultiGameScores.update({
							tourneyMatch: false,
						}, {
							where: {
								matchId: incompleteMatch.matchId,
							},
						});

						if (logVerificationProcess) {
							// eslint-disable-next-line no-console
							console.log(`Match ${incompleteMatch.matchId} verified as fake - o!mm not found - Fake because MaidBot uses !mp make to create matches`);
						}

						await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`ini\n[Changed]\`\`\`\`\`\`diff\n- Valid: False\nComment: o!mm not found - Fake because MaidBot uses !mp make to create matches\`\`\`https://osu.ppy.sh/mp/${incompleteMatch.matchId} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
					} else {
						// Go same if error
						secondsToWait = secondsToWait + 60;
					}
				});
		} else {
			// Verify matches instead
			logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiMatches verify matches');
			incompleteMatch = await DBOsuMultiMatches.findOne({
				attributes: ['matchId'],
				where: {
					tourneyMatch: true,
					verifiedAt: null,
					verifiedBy: null,
					matchName: {
						[Op.startsWith]: 'ROMAI'
					},
					matchEndDate: {
						[Op.not]: null,
					},
				},
				order: [
					['matchId', 'ASC']
				]
			});

			if (incompleteMatch) {
				// Fetch the match and check if the match was created by DarkerSniper
				logOsuAPICalls('processQueueTasks/saveMultiMatches.js DarkerSniper match check');
				await osuApi.getMatch({ mp: incompleteMatch.matchId })
					.then(async (match) => {
						try {
							await awaitWebRequestPermission(`https://osu.ppy.sh/community/matches/${match.id}`, client);
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

										if (json.events[0].detail.type === 'match-created') {
											if (json.events[0].user_id === 13448067) {
												logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update DarkerSniper match');
												await DBOsuMultiMatches.update({
													tourneyMatch: true,
													verifiedAt: new Date(),
													verifiedBy: 31050083, // Elitebotix
													verificationComment: 'Match created by DarkerSniper',
													referee: json.events[0].user_id,
												}, {
													where: {
														matchId: match.id,
													},
												});

												logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update DarkerSniper match');
												await DBOsuMultiGames.update({
													tourneyMatch: true,
												}, {
													where: {
														matchId: match.id,
													},
												});

												logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update DarkerSniper match');
												await DBOsuMultiGameScores.update({
													tourneyMatch: true,
												}, {
													where: {
														matchId: match.id,
													},
												});

												if (logVerificationProcess) {
													// eslint-disable-next-line no-console
													console.log(`Match ${match.id} verified - Match created by DarkerSniper`);
												}

												await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Match created by DarkerSniper\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
											} else {
												logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update DarkerSniper match');
												await DBOsuMultiMatches.update({
													tourneyMatch: false,
													verifiedAt: new Date(),
													verifiedBy: 31050083, // Elitebotix
													verificationComment: 'Match not created by DarkerSniper',
													referee: json.events[0].user_id,
												}, {
													where: {
														matchId: match.id,
													},
												});

												logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update DarkerSniper match');
												await DBOsuMultiGames.update({
													tourneyMatch: false,
												}, {
													where: {
														matchId: match.id,
													},
												});

												logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update DarkerSniper match');
												await DBOsuMultiGameScores.update({
													tourneyMatch: false,
												}, {
													where: {
														matchId: match.id,
													},
												});

												if (logVerificationProcess) {
													// eslint-disable-next-line no-console
													console.log(`Match ${match.id} verified as fake - Match not created by DarkerSniper`);
												}

												await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`ini\n[Changed]\`\`\`\`\`\`diff\n- Valid: False\nComment: Match not created by DarkerSniper\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
											}
										} else {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update not determinable DarkerSniper match');
											await DBOsuMultiMatches.update({
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Not determinable if match was created by DarkerSniper',
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} not verified - Not determinable if match was created by DarkerSniper`);
											}
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
							logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update fake DarkerSniper match');
							await DBOsuMultiMatches.update({
								tourneyMatch: false,
								verifiedAt: new Date(),
								verifiedBy: 31050083, // Elitebotix
								verificationComment: 'ROMAI not found - Fake because DarkerSniper uses !mp make to create matches',
							}, {
								where: {
									matchId: incompleteMatch.matchId,
								},
							});

							logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update fake DarkerSniper match');
							await DBOsuMultiGames.update({
								tourneyMatch: false,
							}, {
								where: {
									matchId: incompleteMatch.matchId,
								},
							});

							logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update fake DarkerSniper match');
							await DBOsuMultiGameScores.update({
								tourneyMatch: false,
							}, {
								where: {
									matchId: incompleteMatch.matchId,
								},
							});

							if (logVerificationProcess) {
								// eslint-disable-next-line no-console
								console.log(`Match ${incompleteMatch.matchId} verified as fake - ROMAI not found - Fake because DarkerSniper uses !mp make to create matches`);
							}

							await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`ini\n[Changed]\`\`\`\`\`\`diff\n- Valid: False\nComment: ROMAI not found - Fake because DarkerSniper uses !mp make to create matches\`\`\`https://osu.ppy.sh/mp/${incompleteMatch.matchId} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
						} else {
							// Go same if error
							secondsToWait = secondsToWait + 60;
						}
					});
			} else {
				// Get all matchLogs that contain "Looking for a map..." and are not verified
				const fs = require('fs');
				if (!fs.existsSync(`${process.env.ELITEBOTIXBANCHOROOTPATH}/matchLogs`)) {
					fs.mkdirSync(`${process.env.ELITEBOTIXBANCHOROOTPATH}/matchLogs`);
				}
				let matchLogFiles = fs.readdirSync(`${process.env.ELITEBOTIXBANCHOROOTPATH}/matchLogs`);
				let matchLogsToVerify = [];

				for (let i = 0; i < matchLogFiles.length; i++) {
					let matchLog = fs.readFileSync(`${process.env.ELITEBOTIXBANCHOROOTPATH}/matchLogs/${matchLogFiles[i]}`, 'utf8');

					if (matchLog.includes('[Eliteronix]: Looking for a map...') || matchLog.includes('[Elitebotix]: Looking for a map...')) {
						matchLogsToVerify.push(matchLogFiles[i].replace('.txt', ''));
					}
				}

				logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches');
				let matchesToVerify = await DBOsuMultiMatches.findAll({
					attributes: ['matchId'],
					where: {
						verifiedAt: null,
						matchId: {
							[Op.in]: matchLogsToVerify,
						},
						matchEndDate: {
							[Op.not]: null,
						},
					},
					group: ['matchId'],
				});

				matchesToVerify = matchesToVerify.map(match => match.matchId);

				if (matchesToVerify.length) {
					// If there is a match to verify
					logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Elitebotix duel match');
					await DBOsuMultiMatches.update({
						tourneyMatch: true,
						verifiedAt: new Date(),
						verifiedBy: 31050083, // Elitebotix
						verificationComment: 'Elitebotix Duel Match',
						referee: 31050083, // Elitebotix
					}, {
						where: {
							matchId: {
								[Op.in]: matchesToVerify,
							},
						},
					});

					logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update Elitebotix duel match');
					await DBOsuMultiGames.update({
						tourneyMatch: true,
					}, {
						where: {
							matchId: {
								[Op.in]: matchesToVerify,
							},
						},
					});

					logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update Elitebotix duel match');
					await DBOsuMultiGameScores.update({
						tourneyMatch: true,
					}, {
						where: {
							matchId: {
								[Op.in]: matchesToVerify,
							},
						},
					});

					for (let i = 0; i < matchesToVerify.length; i++) {
						if (logVerificationProcess) {
							// eslint-disable-next-line no-console
							console.log(`Match ${matchesToVerify[i]} verified - Elitebotix Duel Match`);
						}

						await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Elitebotix Duel Match\`\`\`https://osu.ppy.sh/mp/${matchesToVerify[i]} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
					}
				} else {
					const result = await verifyAnyMatch(osuApi, client, logVerificationProcess);

					//await addMissingRefereeInfo(osuApi, client);

					if (result === true) {
						secondsToWait = secondsToWait + 60;
					}
				}
			}
		}
	}

	let date = new Date();
	date.setUTCSeconds(date.getUTCSeconds() + secondsToWait);
	processQueueEntry.date = date;
	processQueueEntry.beingExecuted = false;
	return await processQueueEntry.save();
}

async function verifyAnyMatch(osuApi, client, logVerificationProcess) {
	logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches find match to verify');
	let matchToVerify = await DBOsuMultiMatches.findOne({
		attributes: ['matchId', 'matchName', 'matchStartDate'],
		where: {
			tourneyMatch: true,
			verifiedBy: null,
			matchEndDate: {
				[Op.not]: null,
			},
			matchId: {
				[Op.in]: client.knownSuspiciousMatches,
			}
		},
		order: [
			['matchId', 'ASC']
		]
	});

	if (!matchToVerify) {
		logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches find match to verify referee backup');
		matchToVerify = await DBOsuMultiMatches.findOne({
			attributes: ['matchId', 'matchName', 'matchStartDate'],
			where: {
				tourneyMatch: true,
				verifiedBy: null,
				referee: null,
			},
			order: [
				['matchId', 'ASC']
			]
		});
	}

	if (!matchToVerify) {
		logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches find match to verify backup');
		matchToVerify = await DBOsuMultiMatches.findOne({
			attributes: ['matchId', 'matchName', 'matchStartDate'],
			where: {
				tourneyMatch: true,
				verifiedBy: null,
				matchEndDate: {
					[Op.not]: null,
				},
			},
			order: [
				['updatedAt', 'ASC']
			]
		});
	}

	if (!matchToVerify) {
		if (logVerificationProcess) {
			// eslint-disable-next-line no-console
			console.log('No match to verify');
		}

		return;
		//return await addMissingRefereeInfo(osuApi, client);
	}

	if (matchToVerify.matchName.startsWith('ETX') || matchToVerify.matchName.startsWith('o!mm') || matchToVerify.matchName.startsWith('ROMAI')) {
		logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches Last step of verification - ETX, o!mm or ROMAI not verifyable');
		await DBOsuMultiMatches.update({
			verifiedBy: 31050083, // Elitebotix
			verificationComment: 'Last step of verification - ETX, o!mm or ROMAI not verifyable',
		}, {
			where: {
				matchId: matchToVerify.matchId,
			},
		});

		if (logVerificationProcess) {
			// eslint-disable-next-line no-console
			console.log(`Match ${matchToVerify.matchId} verified - Last step of verification - ETX, o!mm or ROMAI not verifyable`);
		}
		return;
	}

	process.send('osu! API');
	return await osuApi.getMatch({ mp: matchToVerify.matchId })
		.then(async (match) => {
			try {
				await awaitWebRequestPermission(`https://osu.ppy.sh/community/matches/${match.id}`, client);
				return await fetch(`https://osu.ppy.sh/community/matches/${match.id}`)
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

							while (json.first_event_id !== json.events[0].id) {
								let firstIdInJSON = json.events[0].id;

								await awaitWebRequestPermission(`https://osu.ppy.sh/community/matches/${match.id}?before=${json.events[0].id}&limit=100`, client);
								let earlierEvents = await fetch(`https://osu.ppy.sh/community/matches/${match.id}?before=${json.events[0].id}&limit=100`)
									.then(async (res) => {
										let htmlCode = await res.text();
										htmlCode = htmlCode.replace(/&quot;/gm, '"');
										const matchRunningRegex = /{"match".+,"current_game_id":\d+}/gm;
										const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
										const matchesRunning = matchRunningRegex.exec(htmlCode);
										const matchesPaused = matchPausedRegex.exec(htmlCode);

										if (matchesRunning && matchesRunning[0]) {
											regexMatch = matchesRunning[0];
										}

										if (matchesPaused && matchesPaused[0]) {
											regexMatch = matchesPaused[0];
										}

										let json = JSON.parse(regexMatch);

										return json.events;
									});

								json.events = earlierEvents.concat(json.events);

								if (json.events[0].id === firstIdInJSON) {
									break;
								}
							}

							if (json.events[0].detail.type === 'match-created') {
								logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores Find a score by the match creator');
								let scores = await DBOsuMultiGameScores.findAll({
									attributes: ['score'],
									where: {
										matchId: match.id,
										osuUserId: json.events[0].user_id,
										score: {
											[Op.gte]: 10000,
										},
									},
								});

								if (scores.length) {
									logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches Match creator played a round - Not determined if valid');
									await DBOsuMultiMatches.update({
										verifiedBy: 31050083, // Elitebotix
										verificationComment: 'Match creator played a round - Not determined if valid',
										referee: json.events[0].user_id,
									}, {
										where: {
											matchId: match.id,
										},
									});

									if (logVerificationProcess) {
										// eslint-disable-next-line no-console
										console.log(`Match ${matchToVerify.matchId} unverified - Match creator played a round - Not determined if valid`);
									}
								} else {
									logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores Match creator did not play a round - Not determined if valid');
									let matchToVerifyScores = await DBOsuMultiGameScores.findAll({
										attributes: ['osuUserId', 'beatmapId'],
										where: {
											matchId: match.id,
										},
									});

									let mapsPlayed = [];
									let players = [];

									for (let i = 0; i < matchToVerifyScores.length; i++) {
										let score = matchToVerifyScores[i];

										let map = mapsPlayed.find((map) => map.beatmapId === score.beatmapId);

										if (!map) {
											mapsPlayed.push({ beatmapId: score.beatmapId, amount: 0 });
										}

										if (!players.includes(score.osuUserId)) {
											players.push(score.osuUserId);
										}
									}

									let acronym = matchToVerify.matchName.replace(/:.*/gm, '');

									let weeksBeforeMatch = new Date(matchToVerify.matchStartDate);
									weeksBeforeMatch.setDate(weeksBeforeMatch.getDate() - 56);

									let weeksAfterMatch = new Date(matchToVerify.matchStartDate);
									weeksAfterMatch.setDate(weeksAfterMatch.getDate() + 56);

									logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches Match creator did not play a round');
									let relatedMatches = await DBOsuMultiMatches.findAll({
										attributes: ['matchId', 'matchName', 'verifiedAt', 'verifiedBy'],
										where: {
											matchStartDate: {
												[Op.between]: [weeksBeforeMatch, weeksAfterMatch],
											},
											matchName: {
												[Op.like]: `${acronym}:%`,
											},
										},
									});

									logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames Match creator did not play a round');
									let relatedGames = await DBOsuMultiGames.findAll({
										attributes: ['gameId'],
										where: {
											matchId: {
												[Op.in]: relatedMatches.map((match) => match.matchId),
											},
											warmup: false,
										},
									});

									logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores Match creator did not play a round');
									let relatedScores = await DBOsuMultiGameScores.findAll({
										attributes: ['matchId', 'osuUserId', 'beatmapId'],
										where: {
											gameId: {
												[Op.in]: relatedGames.map((game) => game.gameId),
											},
											[Op.or]: [
												{
													beatmapId: {
														[Op.in]: mapsPlayed.map((map) => map.beatmapId),
													},
												},
												{
													osuUserId: {
														[Op.in]: players,
													},
												},
											],
										},
									});

									let playersInTheOriginalLobby = [...new Set(matchToVerifyScores.map((score) => score.osuUserId))];

									let otherPlayersOutsideOfTheLobbyThatPlayedTheSameMaps = [];
									let otherMatchesWithTheSamePlayers = [];

									for (let i = 0; i < relatedScores.length; i++) {
										let score = relatedScores[i];

										if (score.matchId === match.id) {
											continue;
										}

										let map = mapsPlayed.find((map) => map.beatmapId === score.beatmapId);

										if (map) {
											if (!otherPlayersOutsideOfTheLobbyThatPlayedTheSameMaps.includes(score.osuUserId)) {
												otherPlayersOutsideOfTheLobbyThatPlayedTheSameMaps.push(score.osuUserId);
											}

											map.amount++;
										}

										if (players.includes(score.osuUserId)) {
											let otherMatch = otherMatchesWithTheSamePlayers.find((match) => match.matchId === score.matchId);

											if (!otherMatch) {
												let relatedMatch = relatedMatches.find((match) => match.matchId === score.matchId);

												otherMatchesWithTheSamePlayers.push({ matchId: score.matchId, matchName: relatedMatch.matchName, verifiedAt: relatedMatch.verifiedAt, verifiedBy: relatedMatch.verifiedBy });
											}
										}
									}

									// let playersThatAreOnlyInOtherMatches = otherPlayersOutsideOfTheLobbyThatPlayedTheSameMaps.filter((player) => !playersInTheOriginalLobby.includes(player));

									let qualsMatchOfTheSamePlayers = otherMatchesWithTheSamePlayers.find((match) => match.matchName.toLowerCase().includes('(qualifiers)') || match.matchName.toLowerCase().includes('(qualifier)') || match.matchName.toLowerCase().includes('(quals)') || match.matchName.toLowerCase().includes('(kwalifikacje)'));

									if (matchToVerify.matchName.toLowerCase().includes('(qualifiers)') || matchToVerify.matchName.toLowerCase().includes('(qualifier)') || matchToVerify.matchName.toLowerCase().includes('(quals)') || matchToVerify.matchName.toLowerCase().includes('(kwalifikacje)') || matchToVerify.matchName.toLowerCase().includes('(tryouts)')) {
										if (mapsPlayed.every((map) => map.amount >= 20)) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Qualifiers all maps played more than 20 times');
											await DBOsuMultiMatches.update({
												tourneyMatch: true,
												verifiedAt: new Date(),
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Qualifiers - All maps played more than 20 times outside of the lobby',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update Qualifiers all maps played more than 20 times');
											await DBOsuMultiGames.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update Qualifiers all maps played more than 20 times');
											await DBOsuMultiGameScores.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Qualifiers - All maps played more than 20 times outside of the lobby`);
											}

											await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Qualifiers - All maps played more than 20 times outside of the lobby\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
										} else {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Qualifiers not all maps played more than 20 times');
											await DBOsuMultiMatches.update({
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Qualifiers - Not all maps played more than 20 times outside of the lobby',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Qualifiers - Not all maps played more than 20 times outside of the lobby`);
											}
										}
									} else if (otherMatchesWithTheSamePlayers.length && playersInTheOriginalLobby.length > 1) {
										if (qualsMatchOfTheSamePlayers && qualsMatchOfTheSamePlayers.verifiedAt) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified');
											await DBOsuMultiMatches.update({
												tourneyMatch: true,
												verifiedAt: new Date(),
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified');
											await DBOsuMultiGames.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified');
											await DBOsuMultiGameScores.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified`);
											}

											await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
										} else if (qualsMatchOfTheSamePlayers && qualsMatchOfTheSamePlayers.verifiedBy) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that could not be verified');
											await DBOsuMultiMatches.update({
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that could not be verified',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that could not be verified`);
											}
										} else if (qualsMatchOfTheSamePlayers) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was not yet verified');
											await DBOsuMultiMatches.update({
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was not yet verified',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was not yet verified`);
											}
										} else if (otherMatchesWithTheSamePlayers.length > 2 && mapsPlayed.some(map => map.amount > 20)) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym');
											await DBOsuMultiMatches.update({
												tourneyMatch: true,
												verifiedAt: new Date(),
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym');
											await DBOsuMultiGames.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym');
											await DBOsuMultiGameScores.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym`);
											}

											await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
										} else if (otherMatchesWithTheSamePlayers.length > 4 && mapsPlayed.some(map => map.amount > 15)) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym');
											await DBOsuMultiMatches.update({
												tourneyMatch: true,
												verifiedAt: new Date(),
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym');
											await DBOsuMultiGames.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym');
											await DBOsuMultiGameScores.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym`);
											}

											await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
										} else if (otherMatchesWithTheSamePlayers.length > 6 && mapsPlayed.some(map => map.amount > 10)) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym');
											await DBOsuMultiMatches.update({
												tourneyMatch: true,
												verifiedAt: new Date(),
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym');
											await DBOsuMultiGames.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym');
											await DBOsuMultiGameScores.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym`);
											}

											await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
										} else if (otherMatchesWithTheSamePlayers.length > 8 && mapsPlayed.some(map => map.amount > 5)) {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym');
											await DBOsuMultiMatches.update({
												tourneyMatch: true,
												verifiedAt: new Date(),
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGames update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym');
											await DBOsuMultiGames.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiGameScores update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym');
											await DBOsuMultiGameScores.update({
												tourneyMatch: true,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym`);
											}

											await sendMessageToLogChannel(client, process.env.VERIFICATIONLOG, `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`);
										} else {
											logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update No quals match of the same players - not verifyable');
											await DBOsuMultiMatches.update({
												verifiedBy: 31050083, // Elitebotix
												verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - not verifyable',
												referee: json.events[0].user_id,
											}, {
												where: {
													matchId: match.id,
												},
											});

											if (logVerificationProcess) {
												// eslint-disable-next-line no-console
												console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - not verifyable`);
											}
										}
									} else {
										logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches verification status not determinable');
										await DBOsuMultiMatches.update({
											verifiedBy: 31050083, // Elitebotix
											verificationComment: 'Match reffed by someone else - Verification status not determinable',
											referee: json.events[0].user_id,
										}, {
											where: {
												matchId: match.id,
											},
										});

										if (logVerificationProcess) {
											// eslint-disable-next-line no-console
											console.log(`Match ${match.id} verified - Match reffed by someone else - Verification status not determinable`);
										}
									}
								}
							} else {
								logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update not determinable maidbot match');
								await DBOsuMultiMatches.update({
									verifiedBy: 31050083, // Elitebotix
									verificationComment: 'Not determinable who created the match',
								}, {
									where: {
										matchId: match.id,
									},
								});

								if (logVerificationProcess) {
									// eslint-disable-next-line no-console
									console.log(`Match ${match.id} verified - Not determinable who created the match`);
								}
							}
						}
					});
			} catch (e) {
				if (!e.message.endsWith('reason: Client network socket disconnected before secure TLS connection was established')
					&& !e.message.endsWith('reason: read ECONNRESET')) {
					console.error(e);
				}
				// Go same if error
				//Increase seconds to wait
				return true;
			}
		})
		.catch(async (err) => {
			if (err.message === 'Not found') {
				//If its not found anymore it should be fake because it must be created in a different way
				logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update fake maidbot match');
				await DBOsuMultiMatches.update({
					verifiedBy: 31050083, // Elitebotix
					verificationComment: 'match not found - can\'t be determined if fake or not',
					referee: -1,
				}, {
					where: {
						matchId: matchToVerify.matchId,
					},
				});

				if (logVerificationProcess) {
					// eslint-disable-next-line no-console
					console.log(`Match ${matchToVerify.matchId} verified - match not found - can't be determined if fake or not`);
				}
			} else {
				// Go same if error
				//Increase seconds to wait
				return true;
			}
		});
}

async function addMissingRefereeInfo(osuApi, client) {
	logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches refereeInfoMissing');
	let refereeInfoMissing = await DBOsuMultiMatches.findOne({
		attributes: ['matchId'],
		where: {
			tourneyMatch: true,
			verifiedBy: {
				[Op.not]: null,
			},
			referee: null,
		},
		order: [
			['matchId', 'ASC'],
		],
	});

	if (!refereeInfoMissing) {
		client.shard.broadcastEval(async (c, { message }) => {
			let channel;
			if (process.env.SERVER === 'Live') {
				channel = await c.channels.cache.get('1212871483152400385');
			} else {
				channel = await c.channels.cache.get('1212871419998904420');
			}

			if (channel) {
				await channel.send(message);
			}
		}, { context: { message: 'No match to get referee info for' } });

		//Increase seconds to wait
		return true;
	}

	logOsuAPICalls('processQueueTasks/saveMultiMatches.js refereeInfoMissing');
	return await osuApi.getMatch({ mp: refereeInfoMissing.matchId })
		.then(async (match) => {
			try {
				await awaitWebRequestPermission(`https://osu.ppy.sh/community/matches/${match.id}`, client);
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

							while (json.first_event_id !== json.events[0].id) {
								await awaitWebRequestPermission(`https://osu.ppy.sh/community/matches/${match.id}?before=${json.events[0].id}&limit=100`, client);
								let earlierEvents = await fetch(`https://osu.ppy.sh/community/matches/${match.id}?before=${json.events[0].id}&limit=100`)
									.then(async (res) => {
										let htmlCode = await res.text();
										htmlCode = htmlCode.replace(/&quot;/gm, '"');

										const matchRunningRegex = /{"match".+,"current_game_id":\d+}/gm;
										const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
										const matchesRunning = matchRunningRegex.exec(htmlCode);
										const matchesPaused = matchPausedRegex.exec(htmlCode);

										if (matchesRunning && matchesRunning[0]) {
											regexMatch = matchesRunning[0];
										}

										if (matchesPaused && matchesPaused[0]) {
											regexMatch = matchesPaused[0];
										}

										let json = JSON.parse(regexMatch);

										regexMatch = null;

										return json.events;
									});

								json.events = earlierEvents.concat(json.events);
							}

							if (json.events[0].detail.type === 'match-created') {
								// Don't ask me how but for some reason the user_id can be null?????
								if (json.events[0].user_id) {
									logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update referee');
									await DBOsuMultiMatches.update({
										referee: json.events[0].user_id,
									}, {
										where: {
											matchId: match.id,
										},
									});

									client.shard.broadcastEval(async (c, { message }) => {
										let channel;
										if (process.env.SERVER === 'Live') {
											channel = await c.channels.cache.get('1212871483152400385');
										} else {
											channel = await c.channels.cache.get('1212871419998904420');
										}

										if (channel) {
											await channel.send(message);
										}
									}, { context: { message: `Match https://osu.ppy.sh/community/matches/${refereeInfoMissing.matchId} reffed by https://osu.ppy.sh/users/${json.events[0].user_id}` } });
								} else {
									logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update referee is null');
									await DBOsuMultiMatches.update({
										referee: -1,
									}, {
										where: {
											matchId: refereeInfoMissing.matchId,
										},
									});

									client.shard.broadcastEval(async (c, { message }) => {
										let channel;
										if (process.env.SERVER === 'Live') {
											channel = await c.channels.cache.get('1212871483152400385');
										} else {
											channel = await c.channels.cache.get('1212871419998904420');
										}

										if (channel) {
											await channel.send(message);
										}
									}, { context: { message: `Referee is null https://osu.ppy.sh/community/matches/${refereeInfoMissing.matchId}` } });
								}
							} else {
								logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update unavailable match start referee 2');
								await DBOsuMultiMatches.update({
									referee: -1,
								}, {
									where: {
										matchId: refereeInfoMissing.matchId,
									},
								});

								client.shard.broadcastEval(async (c, { message }) => {
									let channel;
									if (process.env.SERVER === 'Live') {
										channel = await c.channels.cache.get('1212871483152400385');
									} else {
										channel = await c.channels.cache.get('1212871419998904420');
									}

									if (channel) {
										await channel.send(message);
									}
								}, { context: { message: `Match start https://osu.ppy.sh/community/matches/${refereeInfoMissing.matchId} unavailable` } });
							}
						}
					});
			} catch (e) {
				if (!e.message.endsWith('reason: Client network socket disconnected before secure TLS connection was established')
					&& !e.message.endsWith('reason: read ECONNRESET')) {
					console.error(e);
				}
				// Go same if error
				//Increase seconds to wait
				return true;
			}
		})
		.catch(async (err) => {
			if (err.message === 'Not found') {
				logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiMatches update unavailable match referee 2');
				await DBOsuMultiMatches.update({
					referee: -1,
				}, {
					where: {
						matchId: refereeInfoMissing.matchId,
					},
				});

				client.shard.broadcastEval(async (c, { message }) => {
					let channel;
					if (process.env.SERVER === 'Live') {
						channel = await c.channels.cache.get('1212871483152400385');
					} else {
						channel = await c.channels.cache.get('1212871419998904420');
					}

					if (channel) {
						await channel.send(message);
					}
				}, { context: { message: `Match https://osu.ppy.sh/community/matches/${refereeInfoMissing.matchId} unavailable` } });

				return false;
			} else {
				// Go same if error
				//Increase seconds to wait
				return true;
			}
		});
}