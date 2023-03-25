const osu = require('node-osu');
const { DBOsuMultiScores, DBProcessQueue } = require('../dbObjects');
const { saveOsuMultiScores, logDatabaseQueries, awaitWebRequestPermission, updateCurrentMatchesChannel } = require('../utils');
const { Op } = require('sequelize');
const { logBroadcastEval } = require('../config.json');

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
			return await processIncompleteScores(osuApi, client, processQueueEntry, '964656429485154364', 0);
		}

		// eslint-disable-next-line no-undef
		process.send('osu!API');
		await osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				// eslint-disable-next-line no-undef
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

							if (c.update === 1 && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks.length === 0 && c.bingoMatches.length === 0 && c.hostCommands.length === 0) {

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
						await saveOsuMultiScores(match, client);
						let date = new Date();
						date.setUTCMinutes(date.getUTCMinutes() + 5);
						logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBProcessQueue create');
						await DBProcessQueue.create({ guildId: 'None', task: 'importMatch', additions: `${matchID};1;${Date.parse(match.raw_start)};${match.name.toLowerCase()}`, priority: 1, date: date });
						updateCurrentMatchesChannel(client);

						// eslint-disable-next-line no-undef
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
						await awaitWebRequestPermission();
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
	logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores incomplete scores');
	let incompleteMatchScore = await DBOsuMultiScores.findOne({
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
		// eslint-disable-next-line no-undef
		process.send('osu!API');
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
				logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores incomplete scores backup');
				let incompleteScores = await DBOsuMultiScores.findAll({
					attributes: ['id', 'warmup', 'maxCombo', 'pp', 'updatedAt'],
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
	}
	// else
	if (true) {
		let logVerificationProcess = false;

		// Verify matches instead
		logDatabaseQueries(2, 'saveOsuMultiScores.js DBOsuMultiScores verify matches');
		let incompleteMatch = await DBOsuMultiScores.findOne({
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
				['updatedAt', 'ASC']
			]
		});

		if (incompleteMatch) {
			// Fetch the match and check if the match was created by MaidBot
			// eslint-disable-next-line no-undef
			process.send('osu!API');
			await osuApi.getMatch({ mp: incompleteMatch.matchId })
				.then(async (match) => {
					try {
						await awaitWebRequestPermission();
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
										logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update maidbot match');
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

										if (logVerificationProcess) {
											// eslint-disable-next-line no-console
											console.log(`Match ${match.id} verified - Match created by MaidBot`);
										}

										let guildId = '727407178499096597';
										let channelId = '1068905937219362826';

										// eslint-disable-next-line no-undef
										if (process.env.SERVER === 'Dev') {
											guildId = '800641468321759242';
											channelId = '1070013925334204516';
										}

										if (logBroadcastEval) {
											// eslint-disable-next-line no-console
											console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n+ Valid: True\nComment: Match created by MaidBot to shards...');
										}

										client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
											let guild = await c.guilds.cache.get(guildId);

											if (!guild || guild.shardId !== c.shardId) {
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
												message: `\`\`\`diff\n+ Valid: True\nComment: Match created by MaidBot\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
											}
										});
									} else {
										logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update not determinable maidbot match');
										await DBOsuMultiScores.update({
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
						logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update fake maidbot match');
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

						if (logVerificationProcess) {
							// eslint-disable-next-line no-console
							console.log(`Match ${incompleteMatch.matchId} verified as fake - o!mm not found - Fake because MaidBot uses !mp make to create matches`);
						}

						let guildId = '727407178499096597';
						let channelId = '1068905937219362826';

						// eslint-disable-next-line no-undef
						if (process.env.SERVER === 'Dev') {
							guildId = '800641468321759242';
							channelId = '1070013925334204516';
						}

						if (logBroadcastEval) {
							// eslint-disable-next-line no-console
							console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n- Valid: False\nComment: o!mm not found - Fake because MaidBot uses !mp make to create matches to shards...');
						}

						client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
							let guild = await c.guilds.cache.get(guildId);

							if (!guild || guild.shardId !== c.shardId) {
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
								message: `\`\`\`ini\n[Changed]\`\`\`\`\`\`diff\n- Valid: False\nComment: o!mm not found - Fake because MaidBot uses !mp make to create matches\`\`\`https://osu.ppy.sh/mp/${incompleteMatch.matchId} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
							}
						});
					} else {
						// Go same if error
						secondsToWait = secondsToWait + 60;
					}
				});
		} else {
			// Get all matchLogs that contain "Looking for new map..." and are not verified
			const fs = require('fs');

			let matchLogFiles = fs.readdirSync('./matchLogs');
			let matchLogsToVerify = [];
			for (let i = 0; i < matchLogFiles.length; i++) {
				let matchLog = fs.readFileSync(`./matchLogs/${matchLogFiles[i]}`, 'utf8');

				if (matchLog.includes('[Eliteronix]: Looking for new map...') || matchLog.includes('[Elitebotix]: Looking for new map...')) {
					matchLogsToVerify.push(matchLogFiles[i].replace('.txt', ''));
				}
			}

			logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores');
			let matchToVerify = await DBOsuMultiScores.findOne({
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
			});

			if (matchToVerify) {
				// If there is a match to verify
				logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Elitebotix duel match');
				await DBOsuMultiScores.update({
					tourneyMatch: true,
					verifiedAt: new Date(),
					verifiedBy: 31050083, // Elitebotix
					verificationComment: 'Elitebotix Duel Match',
				}, {
					where: {
						matchId: matchToVerify.matchId,
					},
				});

				if (logVerificationProcess) {
					// eslint-disable-next-line no-console
					console.log(`Match ${matchToVerify.matchId} verified - Elitebotix Duel Match`);
				}

				let guildId = '727407178499096597';
				let channelId = '1068905937219362826';

				// eslint-disable-next-line no-undef
				if (process.env.SERVER === 'Dev') {
					guildId = '800641468321759242';
					channelId = '1070013925334204516';
				}

				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n+ Valid: True\nComment: Elitebotix Duel Match to shards...');
				}

				client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
					let guild = await c.guilds.cache.get(guildId);

					if (!guild || guild.shardId !== c.shardId) {
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
						message: `\`\`\`diff\n+ Valid: True\nComment: Elitebotix Duel Match\`\`\`https://osu.ppy.sh/mp/${matchToVerify.matchId} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
					}
				});
			} else {
				logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores find match to verify');
				let matchToVerify = await DBOsuMultiScores.findOne({
					attributes: ['matchId', 'matchName', 'osuUserId'],
					where: {
						tourneyMatch: true,
						verifiedBy: null,
						matchEndDate: {
							[Op.not]: null,
						},
					},
				});

				if (matchToVerify && (matchToVerify.matchName.startsWith('ETX') || matchToVerify.matchName.startsWith('o!mm'))) {
					logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores Last step of verification - ETX or o!mm not verifyable');
					await DBOsuMultiScores.update({
						verifiedBy: 31050083, // Elitebotix
						verificationComment: 'Last step of verification - ETX or o!mm not verifyable',
					}, {
						where: {
							matchId: matchToVerify.matchId,
						},
					});

					if (logVerificationProcess) {
						// eslint-disable-next-line no-console
						console.log(`Match ${matchToVerify.matchId} verified - Last step of verification - ETX or o!mm not verifyable`);
					}
				} else if (matchToVerify) {
					// eslint-disable-next-line no-undef
					process.send('osu! API');
					await osuApi.getMatch({ mp: matchToVerify.matchId })
						.then(async (match) => {
							try {
								await awaitWebRequestPermission();
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
												await awaitWebRequestPermission();
												let earlierEvents = await fetch(`https://osu.ppy.sh/community/matches/${match.id}?before=${json.events[0].id}&limit=100`)
													.then(async (res) => {
														let htmlCode = await res.text();
														htmlCode = htmlCode.replace(/&quot;/gm, '"');
														const matchPausedRegex = /{"match".+,"current_game_id":null}/gm;
														const matchesPaused = matchPausedRegex.exec(htmlCode);

														if (matchesPaused && matchesPaused[0]) {
															regexMatch = matchesPaused[0];
														}

														let json = JSON.parse(regexMatch);

														return json.events;
													});

												json.events = earlierEvents.concat(json.events);
											}

											if (json.events[0].detail.type === 'match-created') {
												logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores Find a score by the match creator');
												let scores = await DBOsuMultiScores.findAll({
													attributes: ['score'],
													where: {
														matchId: match.id,
														osuUserId: json.events[0].user_id,
													},
												});

												scores = scores.filter((score) => parseInt(score.score) > 0);

												if (scores.length) {
													logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores Match creator played a round - Not determined if valid');
													await DBOsuMultiScores.update({
														verifiedBy: 31050083, // Elitebotix
														verificationComment: 'Match creator played a round - Not determined if valid',
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
													logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores Match creator did not play a round - Not determined if valid');
													let matchToVerify = await DBOsuMultiScores.findAll({
														attributes: ['matchId', 'matchName', 'osuUserId', 'beatmapId', 'matchStartDate'],
														where: {
															matchId: match.id,
														},
													});

													let mapsPlayed = [];
													let players = [];

													for (let i = 0; i < matchToVerify.length; i++) {
														let score = matchToVerify[i];

														let map = mapsPlayed.find((map) => map.beatmapId === score.beatmapId);

														if (!map) {
															mapsPlayed.push({ beatmapId: score.beatmapId, amount: 0 });
														}

														if (!players.includes(score.osuUserId)) {
															players.push(score.osuUserId);
														}
													}

													let acronym = matchToVerify[0].matchName.replace(/:.*/gm, '');

													let weeksBeforeMatch = new Date(matchToVerify[0].matchStartDate);
													weeksBeforeMatch.setDate(weeksBeforeMatch.getDate() - 56);

													let weeksAfterMatch = new Date(matchToVerify[0].matchStartDate);
													weeksAfterMatch.setDate(weeksAfterMatch.getDate() + 56);

													logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores Match creator did not play a round');
													let relatedScores = await DBOsuMultiScores.findAll({
														attributes: ['matchId', 'matchName', 'osuUserId', 'beatmapId', 'verifiedAt', 'verifiedBy'],
														where: {
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
															matchStartDate: {
																[Op.between]: [weeksBeforeMatch, weeksAfterMatch],
															},
															matchName: {
																[Op.like]: `${acronym}:%`,
															},
															warmup: false,
														},
													});

													let playersInTheOriginalLobby = [...new Set(matchToVerify.map((score) => score.osuUserId))];

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
																otherMatchesWithTheSamePlayers.push({ matchId: score.matchId, matchName: score.matchName, verifiedAt: score.verifiedAt, verifiedBy: score.verifiedBy });
															}
														}
													}

													// let playersThatAreOnlyInOtherMatches = otherPlayersOutsideOfTheLobbyThatPlayedTheSameMaps.filter((player) => !playersInTheOriginalLobby.includes(player));

													let qualsMatchOfTheSamePlayers = otherMatchesWithTheSamePlayers.find((match) => match.matchName.includes('(Qualifiers)') || match.matchName.includes('(Quals)'));

													if (matchToVerify[0].matchName.includes('(Qualifiers)') || matchToVerify[0].matchName.includes('(Quals)') || matchToVerify[0].matchName.includes('(Tryouts)')) {
														if (mapsPlayed.every((map) => map.amount >= 20)) {
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Qualifiers all maps played more than 20 times');
															await DBOsuMultiScores.update({
																tourneyMatch: true,
																verifiedAt: new Date(),
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Qualifiers - All maps played more than 20 times outside of the lobby',
															}, {
																where: {
																	matchId: match.id,
																},
															});

															if (logVerificationProcess) {
																// eslint-disable-next-line no-console
																console.log(`Match ${match.id} verified - Match reffed by someone else - Qualifiers - All maps played more than 20 times outside of the lobby`);
															}

															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was not yet verified');
															await DBOsuMultiScores.update({
																verifiedBy: null,
															}, {
																where: {
																	matchId: {
																		[Op.in]: otherMatchesWithTheSamePlayers.map((match) => match.matchId),
																	},
																	verifiedAt: null,
																	verifiedBy: 31050083, // Elitebotix
																	verificationComment: 'Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was not yet verified',
																},
															});

															if (logVerificationProcess) {
																// eslint-disable-next-line no-console
																console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was not yet verified`);
															}

															let guildId = '727407178499096597';
															let channelId = '1068905937219362826';

															// eslint-disable-next-line no-undef
															if (process.env.SERVER === 'Dev') {
																guildId = '800641468321759242';
																channelId = '1070013925334204516';
															}

															if (logBroadcastEval) {
																// eslint-disable-next-line no-console
																console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n+ Valid: True\nComment: Match reffed by someone else - Qualifiers - All maps played more than 20 times outside of the lobby to shards...');
															}

															client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
																let guild = await c.guilds.cache.get(guildId);

																if (!guild || guild.shardId !== c.shardId) {
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
																	message: `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Qualifiers - All maps played more than 20 times outside of the lobby\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
																}
															});
														} else {
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Qualifiers not all maps played more than 20 times');
															await DBOsuMultiScores.update({
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Qualifiers - Not all maps played more than 20 times outside of the lobby',
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
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified');
															await DBOsuMultiScores.update({
																tourneyMatch: true,
																verifiedAt: new Date(),
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified',
															}, {
																where: {
																	matchId: match.id,
																},
															});

															if (logVerificationProcess) {
																// eslint-disable-next-line no-console
																console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified`);
															}

															let guildId = '727407178499096597';
															let channelId = '1068905937219362826';

															// eslint-disable-next-line no-undef
															if (process.env.SERVER === 'Dev') {
																guildId = '800641468321759242';
																channelId = '1070013925334204516';
															}

															if (logBroadcastEval) {
																// eslint-disable-next-line no-console
																console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified to shards...');
															}

															client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
																let guild = await c.guilds.cache.get(guildId);

																if (!guild || guild.shardId !== c.shardId) {
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
																	message: `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was verified\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
																}
															});
														} else if (qualsMatchOfTheSamePlayers && qualsMatchOfTheSamePlayers.verifiedBy) {
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that could not be verified');
															await DBOsuMultiScores.update({
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that could not be verified',
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
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was not yet verified');
															await DBOsuMultiScores.update({
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Not Qualifiers - The same players played in a Qualifiers match that was not yet verified',
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
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym');
															await DBOsuMultiScores.update({
																tourneyMatch: true,
																verifiedAt: new Date(),
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym',
															}, {
																where: {
																	matchId: match.id,
																},
															});

															if (logVerificationProcess) {
																// eslint-disable-next-line no-console
																console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym`);
															}

															let guildId = '727407178499096597';
															let channelId = '1068905937219362826';

															// eslint-disable-next-line no-undef
															if (process.env.SERVER === 'Dev') {
																guildId = '800641468321759242';
																channelId = '1070013925334204516';
															}

															if (logBroadcastEval) {
																// eslint-disable-next-line no-console
																console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym to shards...');
															}

															client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
																let guild = await c.guilds.cache.get(guildId);

																if (!guild || guild.shardId !== c.shardId) {
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
																	message: `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 2 matches by the same players - some maps played more than 20 times in other matches of the same acronym\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
																}
															});
														} else if (otherMatchesWithTheSamePlayers.length > 4 && mapsPlayed.some(map => map.amount > 15)) {
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym');
															await DBOsuMultiScores.update({
																tourneyMatch: true,
																verifiedAt: new Date(),
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym',
															}, {
																where: {
																	matchId: match.id,
																},
															});

															if (logVerificationProcess) {
																// eslint-disable-next-line no-console
																console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym`);
															}

															let guildId = '727407178499096597';
															let channelId = '1068905937219362826';

															// eslint-disable-next-line no-undef
															if (process.env.SERVER === 'Dev') {
																guildId = '800641468321759242';
																channelId = '1070013925334204516';
															}

															if (logBroadcastEval) {
																// eslint-disable-next-line no-console
																console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym to shards...');
															}

															client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
																let guild = await c.guilds.cache.get(guildId);

																if (!guild || guild.shardId !== c.shardId) {
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
																	message: `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 4 matches by the same players - some maps played more than 15 times in other matches of the same acronym\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
																}
															});
														} else if (otherMatchesWithTheSamePlayers.length > 6 && mapsPlayed.some(map => map.amount > 10)) {
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym');
															await DBOsuMultiScores.update({
																tourneyMatch: true,
																verifiedAt: new Date(),
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym',
															}, {
																where: {
																	matchId: match.id,
																},
															});

															if (logVerificationProcess) {
																// eslint-disable-next-line no-console
																console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym`);
															}

															let guildId = '727407178499096597';
															let channelId = '1068905937219362826';

															// eslint-disable-next-line no-undef
															if (process.env.SERVER === 'Dev') {
																guildId = '800641468321759242';
																channelId = '1070013925334204516';
															}

															if (logBroadcastEval) {
																// eslint-disable-next-line no-console
																console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym to shards...');
															}

															client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
																let guild = await c.guilds.cache.get(guildId);

																if (!guild || guild.shardId !== c.shardId) {
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
																	message: `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 6 matches by the same players - some maps played more than 10 times in other matches of the same acronym\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
																}
															});
														} else if (otherMatchesWithTheSamePlayers.length > 8 && mapsPlayed.some(map => map.amount > 5)) {
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym');
															await DBOsuMultiScores.update({
																tourneyMatch: true,
																verifiedAt: new Date(),
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym',
															}, {
																where: {
																	matchId: match.id,
																},
															});

															if (logVerificationProcess) {
																// eslint-disable-next-line no-console
																console.log(`Match ${match.id} verified - Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym`);
															}

															let guildId = '727407178499096597';
															let channelId = '1068905937219362826';

															// eslint-disable-next-line no-undef
															if (process.env.SERVER === 'Dev') {
																guildId = '800641468321759242';
																channelId = '1070013925334204516';
															}

															if (logBroadcastEval) {
																// eslint-disable-next-line no-console
																console.log('Broadcasting processQueueTasks/saveMultiMatches.js diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym to shards...');
															}

															client.shard.broadcastEval(async (c, { guildId, channelId, message }) => {
																let guild = await c.guilds.cache.get(guildId);

																if (!guild || guild.shardId !== c.shardId) {
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
																	message: `\`\`\`diff\n+ Valid: True\nComment: Match reffed by someone else - Not Qualifiers - No quals match of the same players - more than 8 matches by the same players - some maps played more than 5 times in other matches of the same acronym\`\`\`https://osu.ppy.sh/mp/${match.id} was verified by ${client.user.username}#${client.user.discriminator} (<@${client.user.id}> | <https://osu.ppy.sh/users/31050083>)`
																}
															});
														} else {
															logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update No quals match of the same players - not verifyable');
															await DBOsuMultiScores.update({
																verifiedBy: 31050083, // Elitebotix
																verificationComment: 'Match reffed by someone else - Not Qualifiers - No quals match of the same players - not verifyable',
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
														logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores verification status not determinable');
														await DBOsuMultiScores.update({
															verifiedBy: 31050083, // Elitebotix
															verificationComment: 'Match reffed by someone else - Verification status not determinable',
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
												logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update not determinable maidbot match');
												await DBOsuMultiScores.update({
													verifiedBy: 31050083, // Elitebotix
													verificationComment: 'Not determinable if match was created by MaidBot',
												}, {
													where: {
														matchId: match.id,
													},
												});

												if (logVerificationProcess) {
													// eslint-disable-next-line no-console
													console.log(`Match ${match.id} verified - Not determinable if match was created by MaidBot`);
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
								logDatabaseQueries(2, 'processQueueTasks/saveMultiMatches.js DBOsuMultiScores update fake maidbot match');
								await DBOsuMultiScores.update({
									verifiedBy: 31050083, // Elitebotix
									verificationComment: 'match not found - can\'t be determined if fake or not',
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
								secondsToWait = secondsToWait + 60;
							}
						});
				} else {
					secondsToWait = secondsToWait + 60;

					if (logVerificationProcess) {
						// eslint-disable-next-line no-console
						console.log(`No match to verify - waiting ${secondsToWait} seconds`);
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