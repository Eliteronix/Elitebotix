const { DBDiscordUsers, DBProcessQueue, DBElitiriCupSignUp, DBElitiriCupSubmissions } = require('../dbObjects');
const { logDatabaseQueries, getUserDuelStarRating, getDerankStats, getAdditionalOsuInfo } = require('../utils.js');
const osu = require('node-osu');
const { currentElitiriCup, currentElitiriCupEndOfRegs, logBroadcastEval } = require('../config.json');
const { Op } = require('sequelize');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('updateOsuRank', processQueueEntry.additions);
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		const discordUserId = processQueueEntry.additions;

		logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBDiscordUsers 1');
		let discordUser = await DBDiscordUsers.findOne({
			where: { osuUserId: discordUserId }
		});

		// Try to find duplicate users
		logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBDiscordUsers duplicates');
		let duplicates = await DBDiscordUsers.findAll({
			where: {
				id: {
					[Op.ne]: discordUser.id
				},
				osuUserId: discordUser.osuUserId
			}
		});

		for (let i = 0; i < duplicates.length; i++) {
			if (duplicates[i].userId) {
				// eslint-disable-next-line no-console
				console.log('Deleting duplicate', discordUser.userId, discordUser.osuUserId, discordUser.osuName, discordUser.updatedAt);
				await discordUser.destroy();
				discordUser = duplicates[i];
			} else {
				// eslint-disable-next-line no-console
				console.log('Deleting duplicate', duplicates[i].userId, duplicates[i].osuUserId, duplicates[i].osuName, duplicates[i].updatedAt);
				await duplicates[i].destroy();
			}
		}

		discordUser.changed('updatedAt', true);

		try {
			if (discordUser.lastOsuPlayCountChange === null) {
				discordUser.nextOsuPPUpdate = new Date();
				discordUser.lastOsuPPChange = new Date();
				discordUser.lastOsuPlayCountChange = new Date();

				discordUser.nextTaikoPPUpdate = new Date();
				discordUser.lastTaikoPPChange = new Date();
				discordUser.lastTaikoPlayCountChange = new Date();

				discordUser.nextCatchPPUpdate = new Date();
				discordUser.lastCatchPPChange = new Date();
				discordUser.lastCatchPlayCountChange = new Date();

				discordUser.nextManiaPPUpdate = new Date();
				discordUser.lastManiaPPChange = new Date();
				discordUser.lastManiaPlayCountChange = new Date();
			}

			if (discordUser.nextOsuPPUpdate <= new Date()) {
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const osuUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 0 });

				discordUser.osuName = osuUser.name;
				discordUser.country = osuUser.country;
				discordUser.osuRank = osuUser.pp.rank;

				if (Number(discordUser.osuPP) !== Number(osuUser.pp.raw)) {
					discordUser.lastOsuPPChange = new Date();
					discordUser.oldOsuRank = osuUser.pp.rank;
					discordUser.osuPP = osuUser.pp.raw;
				}

				if (Number(discordUser.osuPlayCount) !== Number(osuUser.counts.plays)) {
					discordUser.lastOsuPlayCountChange = new Date();
					discordUser.osuPlayCount = osuUser.counts.plays;
					discordUser.nextOsuPPUpdate = new Date();
				} else {
					discordUser.nextOsuPPUpdate = new Date(new Date().getTime() + new Date().getTime() - Date.parse(discordUser.lastOsuPlayCountChange));
				}

				discordUser.osuRankedScore = osuUser.scores.ranked;
				discordUser.osuTotalScore = osuUser.scores.total;
			}

			if (discordUser.nextTaikoPPUpdate <= new Date()) {
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const taikoUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 1 });

				discordUser.osuName = taikoUser.name;
				discordUser.country = taikoUser.country;
				discordUser.taikoRank = taikoUser.pp.rank;

				if (Number(discordUser.taikoPP) !== Number(taikoUser.pp.raw)) {
					discordUser.lastTaikoPPChange = new Date();
					discordUser.taikoPP = taikoUser.pp.raw;
				}

				if (Number(discordUser.taikoPlayCount) !== Number(taikoUser.counts.plays)) {
					discordUser.lastTaikoPlayCountChange = new Date();
					discordUser.taikoPlayCount = taikoUser.counts.plays;
					discordUser.nextTaikoPPUpdate = new Date();
				} else {
					discordUser.nextTaikoPPUpdate = new Date(new Date().getTime() + new Date().getTime() - Date.parse(discordUser.lastTaikoPlayCountChange));
				}

				discordUser.taikoRankedScore = taikoUser.scores.ranked;
				discordUser.taikoTotalScore = taikoUser.scores.total;
			}

			if (discordUser.nextCatchPPUpdate <= new Date()) {
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const catchUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 2 });

				discordUser.osuName = catchUser.name;
				discordUser.country = catchUser.country;
				discordUser.catchRank = catchUser.pp.rank;

				if (Number(discordUser.catchPP) !== Number(catchUser.pp.raw)) {
					discordUser.lastCatchPPChange = new Date();
					discordUser.catchPP = catchUser.pp.raw;
				}

				if (Number(discordUser.catchPlayCount) !== Number(catchUser.counts.plays)) {
					discordUser.lastCatchPlayCountChange = new Date();
					discordUser.catchPlayCount = catchUser.counts.plays;
					discordUser.nextCatchPPUpdate = new Date();
				} else {
					discordUser.nextCatchPPUpdate = new Date(new Date().getTime() + new Date().getTime() - Date.parse(discordUser.lastCatchPlayCountChange));
				}

				discordUser.catchRankedScore = catchUser.scores.ranked;
				discordUser.catchTotalScore = catchUser.scores.total;
			}

			if (discordUser.nextManiaPPUpdate <= new Date()) {
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const maniaUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 3 });

				discordUser.osuName = maniaUser.name;
				discordUser.country = maniaUser.country;
				discordUser.maniaRank = maniaUser.pp.rank;

				if (Number(discordUser.maniaPP) !== Number(maniaUser.pp.raw)) {
					discordUser.lastManiaPPChange = new Date();
					discordUser.maniaPP = maniaUser.pp.raw;
				}

				if (Number(discordUser.maniaPlayCount) !== Number(maniaUser.counts.plays)) {
					discordUser.lastManiaPlayCountChange = new Date();
					discordUser.maniaPlayCount = maniaUser.counts.plays;
					discordUser.nextManiaPPUpdate = new Date();
				} else {
					discordUser.nextManiaPPUpdate = new Date(new Date().getTime() + new Date().getTime() - Date.parse(discordUser.lastManiaPlayCountChange));
				}

				discordUser.maniaRankedScore = maniaUser.scores.ranked;
				discordUser.maniaTotalScore = maniaUser.scores.total;
			}

			await discordUser.save();

			await getAdditionalOsuInfo(discordUser.osuUserId, client);

			try {
				await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: client });

				logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBDiscordUsers 2');
				discordUser = await DBDiscordUsers.findOne({
					where: { osuUserId: discordUserId }
				});

				let derankStats = await getDerankStats(discordUser);

				discordUser.osuDerankRank = derankStats.expectedPpRankOsu;
			} catch (e) {
				if (e.message === 'No standard plays') {
					discordUser.osuDuelStarRating = null;
					discordUser.lastDuelRatingUpdate = new Date();
				} else {
					console.error(e);
				}
			}

			discordUser.osuNotFoundFirstOccurence = null;
			await discordUser.save();
		} catch (error) {
			if (error.message === 'Not found') {
				let sendLogMessage = false;

				if (discordUser.osuName) {
					sendLogMessage = true;
				}

				let message = `Could not find osu! user \`${discordUser.osuName}\` (\`${discordUser.osuUserId}\` | https://osu.ppy.sh/users/${discordUser.osuUserId}) anymore (repeatedly)`;

				let now = new Date();
				let weekAgo = new Date();
				weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
				if (discordUser.osuNotFoundFirstOccurence === null) {
					message = `Could not find osu! user \`${discordUser.osuName}\` (\`${discordUser.osuUserId}\` | https://osu.ppy.sh/users/${discordUser.osuUserId}) anymore (first time)`;

					discordUser.osuNotFoundFirstOccurence = now;
					discordUser.save();
				} else if (discordUser.osuNotFoundFirstOccurence && weekAgo > discordUser.osuNotFoundFirstOccurence) {
					message = `Could not find osu! user \`${discordUser.osuName}\` (\`${discordUser.osuUserId}\` | https://osu.ppy.sh/users/${discordUser.osuUserId}) anymore (deleting user)`;
					const user = await client.users.fetch(discordUser.userId).catch(async () => {
						//Nothing
					});

					discordUser.osuUserId = null;
					discordUser.country = null;
					discordUser.osuVerificationCode = null;
					discordUser.osuVerified = null;
					discordUser.osuName = null;
					discordUser.osuBadges = 0;
					discordUser.osuPP = null;
					discordUser.osuDuelStarRating = null;
					discordUser.osuNoModDuelStarRating = null;
					discordUser.osuNoModDuelStarRatingLimited = null;
					discordUser.osuHiddenDuelStarRating = null;
					discordUser.osuHiddenDuelStarRatingLimited = null;
					discordUser.osuHardRockDuelStarRating = null;
					discordUser.osuHardRockDuelStarRatingLimited = null;
					discordUser.osuDoubleTimeDuelStarRating = null;
					discordUser.osuDoubleTimeDuelStarRatingLimited = null;
					discordUser.osuFreeModDuelStarRating = null;
					discordUser.osuFreeModDuelStarRatingLimited = null;
					discordUser.osuDuelProvisional = null;
					discordUser.osuDuelOutdated = null;
					discordUser.osuRank = null;
					discordUser.oldOsuRank = null;
					discordUser.osuDerankRank = null;
					discordUser.osuPlayCount = null;
					discordUser.osuRankedScore = null;
					discordUser.osuTotalScore = null;
					discordUser.taikoPP = null;
					discordUser.taikoRank = null;
					discordUser.taikoPlayCount = null;
					discordUser.taikoRankedScore = null;
					discordUser.taikoTotalScore = null;
					discordUser.catchPP = null;
					discordUser.catchRank = null;
					discordUser.catchPlayCount = null;
					discordUser.catchRankedScore = null;
					discordUser.catchTotalScore = null;
					discordUser.maniaPP = null;
					discordUser.maniaRank = null;
					discordUser.maniaPlayCount = null;
					discordUser.maniaRankedScore = null;
					discordUser.maniaTotalScore = null;
					discordUser.tournamentBannedReason = null;
					discordUser.tournamentBannedUntil = null;

					if (user) {
						try {
							await user.send('Your osu! account could not be found anymore for multiple days.\nIf you think this is an issue try linking it again or message Eliteronix#4208');
						} catch (error) {
							//Nothing
						}
					}

					//Remove from MOTD
					discordUser.osuMOTDRegistered = null;
					discordUser.osuMOTDMuted = null;
					discordUser.osuMOTDLastRoundPlayed = null;
					discordUser.osuMOTDerrorFirstOccurence = null;
					discordUser.osuMOTDmutedUntil = null;

					discordUser.osuNotFoundFirstOccurence = null;
					await discordUser.save();

					if (user) {
						try {
							await user.send('Your MOTD registration has been removed in the process.');
						} catch (error) {
							//Nothing
						}
					}

					logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBElitiriCupSignUp 1');
					const elitiriSignUp = await DBElitiriCupSignUp.findOne({
						where: { osuUserId: discordUser.osuUserId, tournamentName: currentElitiriCup }
					});

					if (elitiriSignUp) {
						logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBProcessQueue 1');
						const task = await DBProcessQueue.findOne({
							where: { guildId: 'None', task: 'refreshElitiriSignUp', additions: discordUser.osuUserId }
						});

						if (!task) {
							logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBProcessQueue create 1');
							DBProcessQueue.create({ guildId: 'None', task: 'refreshElitiriSignUp', priority: 3, additions: discordUser.osuUserId });
						}

						logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBElitiriCupSubmissions');
						const allSubmissions = await DBElitiriCupSubmissions.findAll({
							where: { osuUserId: elitiriSignUp.osuUserId, tournamentName: currentElitiriCup }
						});

						allSubmissions.forEach(submission => {
							submission.destroy();
						});

						await elitiriSignUp.destroy();

						if (user) {
							try {
								await user.send('Your Elitiri Cup registration has been removed in the process.');
							} catch (error) {
								//Nothing
							}
						}
					}
				}

				if (sendLogMessage) {
					if (logBroadcastEval) {
						// eslint-disable-next-line no-console
						console.log('Broadcasting processQueueTasks/updateOsuRank.js banned-users log to shards...');
					}

					client.shard.broadcastEval(async (c, { message }) => {
						let guildId = '727407178499096597';

						// eslint-disable-next-line no-undef
						if (process.env.SERVER === 'Dev') {
							guildId = '800641468321759242';
						}

						const guild = await c.guilds.cache.get(guildId);
						if (guild) {
							let channelId = '1061942415864385536';

							// eslint-disable-next-line no-undef
							if (process.env.SERVER === 'Dev') {
								channelId = '1061942304979566614';
							}

							const channel = await guild.channels.cache.get(channelId);

							if (channel) {
								let sentMessage = await channel.send(message);
								sentMessage.crosspost();
							}
						}
					}, { context: { message: message } });
				}

				await discordUser.save();

			} else {
				console.error(error);
			}
		}

		logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBElitiriCupSignUp 2');
		const ecs2021SignUp = await DBElitiriCupSignUp.findOne({
			where: { osuUserId: discordUser.osuUserId, tournamentName: 'Elitiri Cup Summer 2021' }
		});

		// eslint-disable-next-line no-undef
		if (ecs2021SignUp && process.env.SERVER === 'Live') {
			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting processQueueTasks/updateOsuRank.js elitiri summer 2021 roles to shards...');
			}

			client.shard.broadcastEval(async (c, { discordUserId, rankAchieved }) => {
				const guild = await c.guilds.cache.get('727407178499096597');
				if (guild) {
					try {
						// TODO: Fetch error handling
						const member = await guild.members.fetch({ user: [discordUserId], time: 300000 }).first();

						const ecs2021ParticipantRoleId = '875031092921532416';
						const ecs2021ParticipantRole = await guild.roles.fetch(ecs2021ParticipantRoleId);

						if (rankAchieved !== 'Forfeit') {
							try {
								if (!member.roles.cache.has(ecs2021ParticipantRole)) {
									//Assign role if not there yet
									await member.roles.add(ecs2021ParticipantRole);
								}
							} catch (e) {
								console.error(e);
							}
						} else {
							try {
								if (member.roles.cache.has(ecs2021ParticipantRole)) {
									//Remove role if not removed yet
									await member.roles.remove(ecs2021ParticipantRole);
								}
							} catch (e) {
								console.error(e);
							}
						}

						if (rankAchieved === 'Winner') {
							const ecs2021WinnerRoleId = '875031510288306267';
							const ecs2021WinnerRole = await guild.roles.fetch(ecs2021WinnerRoleId);

							try {
								if (!member.roles.cache.has(ecs2021WinnerRole)) {
									//Assign role if not there yet
									await member.roles.add(ecs2021WinnerRole);
								}
							} catch (e) {
								console.error(e);
							}
						}
					} catch (error) {
						//nothing
					}
				}
			}, { context: { discordUserId: discordUserId, rankAchieved: ecs2021SignUp.rankAchieved } });
		}

		logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBElitiriCupSignUp 3');
		const ecw2022SignUp = await DBElitiriCupSignUp.findOne({
			where: { osuUserId: discordUser.osuUserId, tournamentName: 'Elitiri Winter Cup 2022' }
		});

		// eslint-disable-next-line no-undef
		if (ecw2022SignUp && process.env.SERVER === 'Live') {
			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting processQueueTasks/updateOsuRank.js elitiri winter 2022 roles to shards...');
			}

			client.shard.broadcastEval(async (c, { discordUserId, rankAchieved }) => {
				const guild = await c.guilds.cache.get('727407178499096597');
				if (guild) {
					try {
						// TODO: Fetch error handling
						const member = await guild.members.fetch({ user: [discordUserId], time: 300000 }).first();

						const ecw2022ParticipantRoleId = '922203822313586748';
						const ecw2022ParticipantRole = await guild.roles.fetch(ecw2022ParticipantRoleId);

						if (rankAchieved !== 'Forfeit') {
							try {
								if (!member.roles.cache.has(ecw2022ParticipantRole)) {
									//Assign role if not there yet
									await member.roles.add(ecw2022ParticipantRole);
								}
							} catch (e) {
								console.error(e);
							}
						} else {
							try {
								if (member.roles.cache.has(ecw2022ParticipantRole)) {
									//Remove role if not removed yet
									await member.roles.remove(ecw2022ParticipantRole);
								}
							} catch (e) {
								console.error(e);
							}
						}

						if (rankAchieved === 'Winner') {
							const ecw2022WinnerRoleId = '922202798110691329';
							const ecw2022WinnerRole = await guild.roles.fetch(ecw2022WinnerRoleId);

							try {
								if (!member.roles.cache.has(ecw2022WinnerRole)) {
									//Assign role if not there yet
									await member.roles.add(ecw2022WinnerRole);
								}
							} catch (e) {
								console.error(e);
							}
						}
					} catch (error) {
						//nothing
					}
				}
			}, { context: { discordUserId: discordUserId, rankAchieved: ecw2022SignUp.rankAchieved } });
		}

		logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBElitiriCupSignUp 4');
		const elitiriSignUp = await DBElitiriCupSignUp.findOne({
			where: { osuUserId: discordUser.osuUserId, tournamentName: currentElitiriCup }
		});

		if (elitiriSignUp) {
			let now = new Date();
			let endOfRegs = new Date();
			endOfRegs.setUTCMilliseconds(999);
			endOfRegs.setUTCSeconds(59);
			endOfRegs.setUTCMinutes(59);
			endOfRegs.setUTCHours(23);
			endOfRegs.setUTCDate(currentElitiriCupEndOfRegs.day);
			endOfRegs.setUTCMonth(currentElitiriCupEndOfRegs.zeroIndexMonth); //Zero Indexed
			endOfRegs.setUTCFullYear(currentElitiriCupEndOfRegs.year);

			let bracketName = '';

			const user = await client.users.fetch(discordUser.userId);

			// eslint-disable-next-line no-undef
			if (elitiriSignUp.osuName !== discordUser.osuName && !elitiriSignUp.rankAchieved && process.env.SERVER === 'Live') {
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting processQueueTasks/updateOsuRank.js elitiri host name change message log to shards...');
				}

				client.shard.broadcastEval(async (c, { message }) => {
					const guild = await c.guilds.cache.get('727407178499096597');
					if (guild) {
						const channel = await guild.channels.cache.get('830534251757174824');
						channel.send(message);
					}
				}, { context: { message: `<@&851356668415311963> The player \`${elitiriSignUp.osuName}\` from \`${elitiriSignUp.bracketName}\` changed their osu! name to \`${discordUser.osuName}\`.` } });

			}

			elitiriSignUp.osuName = discordUser.osuName;

			if (!(now > endOfRegs)) {
				elitiriSignUp.osuBadges = discordUser.osuBadges;
				elitiriSignUp.osuPP = discordUser.osuPP;
				elitiriSignUp.osuRank = discordUser.osuRank;

				let BWSRank = Math.round(Math.pow(discordUser.osuRank, Math.pow(0.9937, Math.pow(discordUser.osuBadges, 2))));

				if (BWSRank > 999 && BWSRank < 10000) {
					bracketName = 'Top Bracket';
				} else if (BWSRank > 9999 && BWSRank < 50000) {
					bracketName = 'Middle Bracket';
				} else if (BWSRank > 49999 && BWSRank < 100000) {
					bracketName = 'Lower Bracket';
				} else if (BWSRank > 99999) {
					bracketName = 'Beginner Bracket';
				}

				if (bracketName === '') {
					await elitiriSignUp.destroy();
					const user = await client.users.fetch(discordUser.userId);
					try {
						user.send(`Your BWS Rank has dropped below 1000 (${BWSRank}) and you have therefore been removed from the signups for the \`${currentElitiriCup}\`.\nYou can re-register if you drop above 1000 again.`);
					} catch {
						//Nothing
					}
					return;
				}

				if (elitiriSignUp.bracketName !== bracketName) {
					logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBProcessQueue 2');
					const task = await DBProcessQueue.findOne({
						where: { guildId: 'None', task: 'elitiriCupSignUps', additions: elitiriSignUp.bracketName }
					});

					if (!task) {
						let date = new Date();
						date.setUTCMinutes(date.getUTCMinutes() + 1);
						logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBProcessQueue 2 create');
						DBProcessQueue.create({ guildId: 'None', task: 'elitiriCupSignUps', priority: 3, additions: elitiriSignUp.bracketName, date: date });
					}

					try {
						user.send(`Your bracket for the \`${currentElitiriCup}\` has been automatically changed to ${bracketName}. (Used to be ${elitiriSignUp.bracketName})`);
					} catch {
						//Nothing
					}
				}

				elitiriSignUp.bracketName = bracketName;
			}

			elitiriSignUp.discordTag = `${user.username}#${user.discriminator}`;

			await elitiriSignUp.save();

			logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBProcessQueue 3');
			const task = await DBProcessQueue.findOne({
				where: { guildId: 'None', task: 'elitiriCupSignUps', additions: elitiriSignUp.bracketName }
			});

			if (!task) {
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 1);
				logDatabaseQueries(2, 'processQueueTasks/updateOsuRank.js DBProcessQueue 3 create');
				DBProcessQueue.create({ guildId: 'None', task: 'elitiriCupSignUps', priority: 3, additions: elitiriSignUp.bracketName, date: date });
			}
		}
		processQueueEntry.destroy();
	},
};