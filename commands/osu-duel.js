const { DBDiscordUsers, DBProcessQueue, DBOsuMultiScores, DBOsuBeatmaps } = require('../dbObjects');
const osu = require('node-osu');
const { getOsuBeatmap, getMatchesPlanned, logDatabaseQueries, getOsuUserServerMode, populateMsgFromInteraction, pause, saveOsuMultiScores, getMessageUserDisplayname, getIDFromPotentialOsuLink, getUserDuelStarRating, createLeaderboard, getOsuDuelLeague } = require('../utils');
const { Permissions } = require('discord.js');
const { Op } = require('sequelize');
const { leaderboardEntriesPerPage } = require('../config.json');
const Canvas = require('canvas');
const Discord = require('discord.js');

module.exports = {
	name: 'osu-duel',
	aliases: ['osu-quickmatch'],
	description: 'Lets you play a match which is being reffed by the bot',
	// usage: '[username] [username] ... (Use "_" instead of spaces; Use --b for bancho / --r for ripple; Use --s/--t/--c/--m for modes)',
	// permissions: Permissions.FLAGS.MANAGE_GUILD,
	// permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	// guildOnly: true,
	//args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply('Please use the / command `/osu-duel`');
		}
		if (interaction) {
			if (interaction.options._subcommand === 'match') {
				await interaction.deferReply();
				//Get the star ratings for both users
				msg = await populateMsgFromInteraction(interaction);
				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.editReply('You don\'t have your osu! account connected and verified.\nPlease connect your account by using `/osu-link connect <username>`.');
				}

				if (commandUser.userId === interaction.options._hoistedOptions[0].value) {
					return await interaction.editReply('You cannot play against yourself.');
				}

				let firstStarRating = 4;
				try {
					firstStarRating = await getUserDuelStarRating({ osuUserId: commandUser.osuUserId, client: interaction.client });
				} catch (e) {
					if (e !== 'No standard plays') {
						console.log(e);
					}
				}

				let secondStarRating = 4;
				logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers');
				const discordUser = await DBDiscordUsers.findOne({
					where: {
						userId: interaction.options._hoistedOptions[0].value,
						osuVerified: true
					}
				});

				if (discordUser && discordUser.osuUserId) {
					try {
						secondStarRating = await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
					} catch (e) {
						if (e !== 'No standard plays') {
							console.log(e);
						}
					}
				} else {
					return await interaction.editReply(`<@${interaction.options._hoistedOptions[0].value}> doesn't have their osu! account connected and verified.\nPlease have them connect their account by using \`/osu-link connect <username>\`.`);
				}

				let averageStarRating = (firstStarRating.total + secondStarRating.total) / 2;

				let lowerBound = averageStarRating - 0.125;
				let upperBound = averageStarRating + 0.125;

				let sentMessage = await interaction.editReply(`<@${discordUser.userId}>, you were challenged to a duel by <@${commandUser.userId}>.\nReact with ✅ to accept.\nReact with ❌ to decline.`);

				let pingMessage = await interaction.channel.send(`<@${discordUser.userId}>`);
				await sentMessage.react('✅');
				await sentMessage.react('❌');
				pingMessage.delete();
				//Await for the user to react with a checkmark
				const filter = (reaction, user) => {
					return ['✅', '❌'].includes(reaction.emoji.name) && user.id === discordUser.userId;
				};

				let responded = await sentMessage.awaitReactions({ filter, max: 1, time: 120000, errors: ['time'] })
					.then(collected => {
						const reaction = collected.first();

						if (reaction.emoji.name === '✅') {
							return true;
						} else {
							return false;
						}
					})
					.catch(() => {
						return false;
					});

				sentMessage.reactions.removeAll();

				if (!responded) {
					return await interaction.editReply(`<@${discordUser.userId}> declined or didn't respond in time.`);
				}

				await interaction.editReply('Duel has been accepted. Creating pool and lobby...');

				//Set up the mappools
				let dbMaps = [];
				let dbMapIds = [];

				// Set up the modpools
				let modPools = ['NM', 'HD', 'HR', 'DT', 'FM'];
				shuffle(modPools);
				modPools.push('NM', 'FM');

				const player1Scores = await DBOsuMultiScores.findAll({
					where: {
						osuUserId: commandUser.osuUserId,
						tourneyMatch: true,
						matchName: {
							[Op.notLike]: 'MOTD:%',
						},
						mode: 'Standard'
					}
				});

				for (let i = 0; i < player1Scores.length; i++) {
					player1Scores[i] = player1Scores[i].beatmapId;
				}

				const player2Scores = await DBOsuMultiScores.findAll({
					where: {
						osuUserId: discordUser.osuUserId,
						tourneyMatch: true,
						matchName: {
							[Op.notLike]: 'MOTD:%',
						},
						mode: 'Standard'
					}
				});

				for (let i = 0; i < player2Scores.length; i++) {
					player2Scores[i] = player2Scores[i].beatmapId;
				}

				//Get the map for each modpool; limited by drain time, star rating and both players either having played or not played it
				for (let i = 0; i < modPools.length; i++) {
					let dbBeatmap = null;
					let beatmaps = null;

					if (i === 6) {
						logDatabaseQueries(4, 'commands/osu-duel.js DBOsuBeatmaps TB');
						beatmaps = await DBOsuBeatmaps.findAll({
							where: {
								mode: 'Standard',
								approvalStatus: {
									[Op.not]: 'Not found',
								},
								[Op.or]: {
									noModMap: true,
									freeModMap: true,
								},
								drainLength: {
									[Op.and]: {
										[Op.gte]: 270,
										[Op.lte]: 360,
									}
								},
								starRating: {
									[Op.and]: {
										[Op.gte]: lowerBound,
										[Op.lte]: upperBound,
									}
								},
								beatmapId: {
									[Op.or]: {
										[Op.and]: {
											[Op.in]: player1Scores,
											[Op.in]: player2Scores,
										},
										[Op.and]: {
											[Op.notIn]: player1Scores,
											[Op.notIn]: player2Scores,
										},
									}
								},
								circleSize: {
									[Op.lte]: 5,
								},
								approachRate: {
									[Op.gte]: 8,
								},
							}
						});
					} else if (modPools[i] === 'NM') {
						logDatabaseQueries(4, 'commands/osu-duel.js DBOsuBeatmaps NM');
						beatmaps = await DBOsuBeatmaps.findAll({
							where: {
								mode: 'Standard',
								approvalStatus: {
									[Op.not]: 'Not found',
								},
								noModMap: true,
								drainLength: {
									[Op.and]: {
										[Op.gte]: 100,
										[Op.lte]: 270,
									}
								},
								starRating: {
									[Op.and]: {
										[Op.gte]: lowerBound,
										[Op.lte]: upperBound,
									}
								},
								beatmapId: {
									[Op.or]: {
										[Op.and]: {
											[Op.in]: player1Scores,
											[Op.in]: player2Scores,
										},
										[Op.and]: {
											[Op.notIn]: player1Scores,
											[Op.notIn]: player2Scores,
										},
									}
								},
							}
						});
					} else if (modPools[i] === 'HD') {
						logDatabaseQueries(4, 'commands/osu-duel.js DBOsuBeatmaps HD');
						beatmaps = await DBOsuBeatmaps.findAll({
							where: {
								mode: 'Standard',
								approvalStatus: {
									[Op.not]: 'Not found',
								},
								hiddenMap: true,
								drainLength: {
									[Op.and]: {
										[Op.gte]: 100,
										[Op.lte]: 270,
									}
								},
								starRating: {
									[Op.and]: {
										[Op.gte]: lowerBound,
										[Op.lte]: upperBound,
									}
								},
								beatmapId: {
									[Op.or]: {
										[Op.and]: {
											[Op.in]: player1Scores,
											[Op.in]: player2Scores,
										},
										[Op.and]: {
											[Op.notIn]: player1Scores,
											[Op.notIn]: player2Scores,
										},
									}
								},
							}
						});
					} else if (modPools[i] === 'HR') {
						logDatabaseQueries(4, 'commands/osu-duel.js DBOsuBeatmaps HR');
						beatmaps = await DBOsuBeatmaps.findAll({
							where: {
								mode: 'Standard',
								approvalStatus: {
									[Op.not]: 'Not found',
								},
								hardRockMap: true,
								drainLength: {
									[Op.and]: {
										[Op.gte]: 100,
										[Op.lte]: 270,
									}
								},
								starRating: {
									[Op.and]: {
										[Op.gte]: lowerBound,
										[Op.lte]: upperBound,
									}
								},
								beatmapId: {
									[Op.or]: {
										[Op.and]: {
											[Op.in]: player1Scores,
											[Op.in]: player2Scores,
										},
										[Op.and]: {
											[Op.notIn]: player1Scores,
											[Op.notIn]: player2Scores,
										},
									}
								},
							}
						});

					} else if (modPools[i] === 'DT') {
						logDatabaseQueries(4, 'commands/osu-duel.js DBOsuBeatmaps DT');
						beatmaps = await DBOsuBeatmaps.findAll({
							where: {
								mode: 'Standard',
								approvalStatus: {
									[Op.not]: 'Not found',
								},
								doubleTimeMap: true,
								drainLength: {
									[Op.and]: {
										[Op.gte]: 120,
										[Op.lte]: 405,
									}
								},
								starRating: {
									[Op.and]: {
										[Op.gte]: lowerBound,
										[Op.lte]: upperBound,
									}
								},
								beatmapId: {
									[Op.or]: {
										[Op.and]: {
											[Op.in]: player1Scores,
											[Op.in]: player2Scores,
										},
										[Op.and]: {
											[Op.notIn]: player1Scores,
											[Op.notIn]: player2Scores,
										},
									}
								},
							}
						});

					} else if (modPools[i] === 'FM') {
						logDatabaseQueries(4, 'commands/osu-duel.js DBOsuBeatmaps FM');
						beatmaps = await DBOsuBeatmaps.findAll({
							where: {
								mode: 'Standard',
								approvalStatus: {
									[Op.not]: 'Not found',
								},
								freeModMap: true,
								drainLength: {
									[Op.and]: {
										[Op.gte]: 100,
										[Op.lte]: 270,
									}
								},
								starRating: {
									[Op.and]: {
										[Op.gte]: lowerBound,
										[Op.lte]: upperBound,
									}
								},
								beatmapId: {
									[Op.or]: {
										[Op.and]: {
											[Op.in]: player1Scores,
											[Op.in]: player2Scores,
										},
										[Op.and]: {
											[Op.notIn]: player1Scores,
											[Op.notIn]: player2Scores,
										},
									}
								},
							}
						});
					}

					while (dbBeatmap === null) {
						const index = Math.floor(Math.random() * beatmaps.length);

						if (modPools[i] === 'HR') {
							beatmaps[index] = await getOsuBeatmap(beatmaps[index].beatmapId, 16);
						} else if (modPools[i] === 'DT') {
							beatmaps[index] = await getOsuBeatmap(beatmaps[index].beatmapId, 64);
						} else {
							beatmaps[index] = await getOsuBeatmap(beatmaps[index].beatmapId, 0);
						}

						if (!beatmaps[index]) {
							beatmaps.splice(index, 1);
							continue;
						}

						const mapScoreAmount = await DBOsuMultiScores.count({
							where: {
								beatmapId: beatmaps[index].beatmapId,
								matchName: {
									[Op.notLike]: 'MOTD:%',
								},
							}
						});

						// eslint-disable-next-line no-undef
						if (!beatmaps[index] || parseFloat(beatmaps[index].starRating) < lowerBound || parseFloat(beatmaps[index].starRating) > upperBound || mapScoreAmount < 25 && process.env.SERVER !== 'Dev') {
							beatmaps.splice(index, 1);
						} else if (!dbMapIds.includes(beatmaps[index].beatmapsetId)) {
							dbBeatmap = beatmaps[index];
							dbMapIds.push(beatmaps[index].beatmapsetId);
							dbMaps.push(beatmaps[index]);
						}

					}
				}

				modPools[6] = 'FreeMod';
				modPools[modPools.indexOf('FM')] = 'FreeMod';


				//Check if the game can be set up and set it up
				let startDate = new Date();
				let endDate = new Date();
				let gameLength = 0;
				//Add initial waiting time
				endDate.setUTCMinutes(endDate.getUTCMinutes() + 5);
				gameLength += 300;
				//Add maximum waiting time between maps
				endDate.setUTCMinutes(endDate.getUTCMinutes() + 2 * 7);
				gameLength += 120 * 7;
				//Add map times; 5 per map
				endDate.setUTCMinutes(endDate.getUTCMinutes() + 5 * 7);
				gameLength += 300 * 7;
				//Add leaving time
				endDate.setUTCMinutes(endDate.getUTCMinutes() + 1);
				gameLength += 60;
				let matchesPlanned = await getMatchesPlanned(startDate, endDate);

				if (matchesPlanned > 3) {
					return await interaction.editReply('The bot cannot host another match at the moment because there will already be 4 matches running. (Maximum limit is 4)');
				}

				let processQueueTask = await DBProcessQueue.create({ guildId: 'None', task: 'customMOTD', priority: 10, additions: gameLength, date: startDate });

				//Set up the lobby
				let bancho = additionalObjects[1];
				let channel = null;
				for (let i = 0; i < 5; i++) {
					try {
						try {
							await bancho.connect();
						} catch (error) {
							if (!error.message === 'Already connected/connecting') {
								throw (error);
							}
						}
						channel = await bancho.createLobby(`ETX: (${commandUser.osuName}) vs (${discordUser.osuName})`);
						break;
					} catch (error) {
						if (i === 4) {
							return await interaction.editReply('I am having issues creating the lobby and the match has been aborted.\nPlease try again later.');
						} else {
							await pause(10000);
						}
					}
				}

				const lobby = channel.lobby;

				const password = Math.random().toString(36).substring(8);

				await lobby.setPassword(password);
				await channel.sendMessage('!mp map 975342 0');
				await channel.sendMessage('!mp set 0 3 2');

				let lobbyStatus = 'Joining phase';
				let mapIndex = 0;

				await channel.sendMessage(`!mp invite #${commandUser.osuUserId}`);
				let user = await additionalObjects[0].users.fetch(commandUser.userId);
				await messageUserWithRetries(user, interaction, `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);

				await channel.sendMessage(`!mp invite #${discordUser.osuUserId}`);
				user = await additionalObjects[0].users.fetch(discordUser.userId);
				await messageUserWithRetries(user, interaction, `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);

				await interaction.editReply(`<@${commandUser.userId}> <@${discordUser.userId}> your match has been created. You have been invited ingame by \`Eliteronix\` and also got a DM as a backup.`);
				pingMessage = await interaction.channel.send(`<@${commandUser.userId}> <@${discordUser.userId}>`);
				pingMessage.delete();
				//Start the timer to close the lobby if not everyone joined by then
				await channel.sendMessage('!mp timer 300');

				let playerIds = [commandUser.osuUserId, discordUser.osuUserId];
				let dbPlayers = [commandUser, discordUser];
				let scores = [0, 0];

				//Add discord messages and also ingame invites for the timers
				channel.on('message', async (msg) => {
					if (msg.user.ircUsername === 'BanchoBot' && msg.message === 'Countdown finished') {
						//Banchobot countdown finished
						if (lobbyStatus === 'Joining phase') {
							//Not everyone joined and the lobby will be closed
							await channel.sendMessage('The lobby will be closed as not everyone joined.');
							pause(60000);
							await channel.sendMessage('!mp close');
							try {
								await processQueueTask.destroy();
							} catch (error) {
								//Nothing
							}
							return await channel.leave();
						} else if (lobbyStatus === 'Waiting for start') {
							await channel.sendMessage('!mp start 10');

							lobbyStatus === 'Map being played';
						}
					}
				});

				lobby.on('playerJoined', async (obj) => {
					if (!playerIds.includes(obj.player.user.id.toString())) {
						channel.sendMessage(`!mp kick #${obj.player.user.id}`);
					} else if (lobbyStatus === 'Joining phase') {
						let allPlayersJoined = true;
						for (let i = 0; i < dbPlayers.length && allPlayersJoined; i++) {
							if (!lobby.playersById[dbPlayers[i].osuUserId.toString()]) {
								allPlayersJoined = false;
							}
						}
						if (allPlayersJoined) {
							lobbyStatus = 'Waiting for start';

							while (lobby._beatmapId != dbMaps[mapIndex].beatmapId) {
								await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
								await pause(5000);
							}

							let noFail = 'NF';
							if (modPools[mapIndex] === 'FreeMod') {
								noFail = '';
							}

							await channel.sendMessage(`!mp mods ${modPools[mapIndex]} ${noFail}`);
							let mapInfo = await getOsuMapInfo(dbMaps[mapIndex]);
							await channel.sendMessage(mapInfo);
							if (modPools[mapIndex] === 'FreeMod') {
								await channel.sendMessage('Valid Mods: HD, HR, EZ (x1.7) | NM will be 0.5x of the score achieved.');
							}
							await channel.sendMessage('Everyone please ready up!');
							await channel.sendMessage('!mp timer 120');
							mapIndex++;
						}
					}
				});

				lobby.on('allPlayersReady', async () => {
					await lobby.updateSettings();
					let playersInLobby = 0;
					for (let i = 0; i < 16; i++) {
						if (lobby.slots[i]) {
							playersInLobby++;
						}
					}
					if (lobbyStatus === 'Waiting for start' && playersInLobby === dbPlayers.length) {
						await channel.sendMessage('!mp start 10');

						lobbyStatus === 'Map being played';
					}
				});

				lobby.on('matchFinished', async (results) => {
					if (modPools[mapIndex - 1] === 'FreeMod') {
						for (let i = 0; i < results.length; i++) {
							//Increase the score by 1.7 if EZ was played
							if (results[i].player.mods) {
								for (let j = 0; j < results[i].player.mods.length; j++) {
									if (results[i].player.mods[j].enumValue === 2) {
										console.log(results[i].score);
										results[i].score = results[i].score * 1.7;
										console.log(results[i].score);
									}
								}
							}
						}
					}
					if (modPools[mapIndex - 1] === 'FreeMod' && mapIndex - 1 < 6) {
						for (let i = 0; i < results.length; i++) {
							//Reduce the score by 0.5 if it was FreeMod and no mods / only nofail was picked
							if (!results[i].player.mods || results[i].player.mods.length === 0 || results[i].player.mods.length === 1 && results[i].player.mods[0].enumValue === 1) {
								results[i].score = results[i].score * 0.5;
							} else {
								let invalidModsPicked = false;
								for (let j = 0; j < results[i].player.mods.length; j++) {
									if (results[i].player.mods[j].enumValue !== 1 && results[i].player.mods[j].enumValue !== 2 && results[i].player.mods[j].enumValue !== 8 && results[i].player.mods[j].enumValue !== 16) {
										invalidModsPicked = true;
									}
								}

								if (invalidModsPicked) {
									results[i].score = results[i].score / 100;
								}
							}
						}
					}

					quicksort(results);

					if (results.length === 2) {
						await channel.sendMessage(`${results[0].player.user.username}: ${Math.round(results[0].score)} | ${results[1].player.user.username}: ${Math.round(results[1].score)}`);
					} else if (results.length === 1) {
						await channel.sendMessage(`${results[0].player.user.username} wins this round by default.`);
					} else {
						await channel.sendMessage('!mp close');
						// eslint-disable-next-line no-undef
						const osuApi = new osu.Api(process.env.OSUTOKENV1, {
							// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
							notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
							completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
							parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
						});

						osuApi.getMatch({ mp: lobby.id })
							.then(async (match) => {
								saveOsuMultiScores(match);
							})
							.catch(() => {
								//Nothing
							});

						try {
							await processQueueTask.destroy();
						} catch (error) {
							//Nothing
						}
						return await channel.leave();
					}

					//Increase the score of the player at the top of the list
					scores[playerIds.indexOf(results[0].player.user.id.toString())]++;
					await channel.sendMessage(`Score: ${dbPlayers[0].osuName} | ${scores[0]} - ${scores[1]} | ${dbPlayers[1].osuName}`);

					if (mapIndex < dbMaps.length && scores[0] < 4 && scores[1] < 4) {
						lobbyStatus = 'Waiting for start';

						while (lobby._beatmapId != dbMaps[mapIndex].beatmapId) {
							await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
							await pause(5000);
						}

						let noFail = 'NF';
						if (modPools[mapIndex] === 'FreeMod') {
							noFail = '';
						}

						await channel.sendMessage(`!mp mods ${modPools[mapIndex]} ${noFail}`);
						let mapInfo = await getOsuMapInfo(dbMaps[mapIndex]);
						await channel.sendMessage(mapInfo);
						await channel.sendMessage('Everyone please ready up!');
						if (modPools[mapIndex] === 'FreeMod' && mapIndex < 6) {
							await channel.sendMessage('Valid Mods: HD, HR, EZ (x1.7) | NM will be 0.5x of the score achieved.');
						} else if (modPools[mapIndex] === 'FreeMod' && mapIndex === 6) {
							await channel.sendMessage('Valid Mods: HD, HR, EZ (x1.7) | NM will be just as achieved.');
						}
						await channel.sendMessage('!mp timer 120');
						mapIndex++;
					} else {
						lobbyStatus = 'Lobby finished';

						if (scores[0] === 4) {
							await channel.sendMessage(`Congratulations ${dbPlayers[0].osuName} for winning the match!`);
						} else {
							await channel.sendMessage(`Congratulations ${dbPlayers[1].osuName} for winning the match!`);
						}
						await channel.sendMessage('Thank you for playing! The lobby will automatically close in one minute.');
						await pause(60000);
						await channel.sendMessage('!mp close');
						// eslint-disable-next-line no-undef
						const osuApi = new osu.Api(process.env.OSUTOKENV1, {
							// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
							notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
							completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
							parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
						});

						osuApi.getMatch({ mp: lobby.id })
							.then(async (match) => {
								saveOsuMultiScores(match);

								await pause(15000);

								let userDuelStarRating = await getUserDuelStarRating({ osuUserId: commandUser.osuUserId, client: interaction.client });
								let messages = ['Your SR has been updated!'];
								if (Math.round(commandUser.osuDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.total * 1000) / 1000) {
									messages.push(`SR: ${Math.round(commandUser.osuDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.total * 1000) / 1000}`);
								}
								if (Math.round(commandUser.osuNoModDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.noMod * 1000) / 1000) {
									messages.push(`NM: ${Math.round(commandUser.osuNoModDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.noMod * 1000) / 1000}`);
								}
								if (Math.round(commandUser.osuHiddenDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.hidden * 1000) / 1000) {
									messages.push(`HD: ${Math.round(commandUser.osuHiddenDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.hidden * 1000) / 1000}`);
								}
								if (Math.round(commandUser.osuHardRockDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.hardRock * 1000) / 1000) {
									messages.push(`HR: ${Math.round(commandUser.osuHardRockDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.hardRock * 1000) / 1000}`);
								}
								if (Math.round(commandUser.osuDoubleTimeDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.doubleTime * 1000) / 1000) {
									messages.push(`DT: ${Math.round(commandUser.osuDoubleTimeDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.doubleTime * 1000) / 1000}`);
								}
								if (Math.round(commandUser.osuFreeModDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.freeMod * 1000) / 1000) {
									messages.push(`FM: ${Math.round(commandUser.osuFreeModDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.freeMod * 1000) / 1000}`);
								}
								if (messages.length > 1) {
									const IRCUser = await bancho.getUser(commandUser.osuName);
									for (let i = 0; i < messages.length; i++) {
										await IRCUser.sendMessage(messages[i]);
									}
								}

								userDuelStarRating = await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
								messages = ['Your SR has been updated!'];
								if (Math.round(discordUser.osuDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.total * 1000) / 1000) {
									messages.push(`SR: ${Math.round(discordUser.osuDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.total * 1000) / 1000}`);
								}
								if (Math.round(discordUser.osuNoModDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.noMod * 1000) / 1000) {
									messages.push(`NM: ${Math.round(discordUser.osuNoModDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.noMod * 1000) / 1000}`);
								}
								if (Math.round(discordUser.osuHiddenDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.hidden * 1000) / 1000) {
									messages.push(`HD: ${Math.round(discordUser.osuHiddenDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.hidden * 1000) / 1000}`);
								}
								if (Math.round(discordUser.osuHardRockDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.hardRock * 1000) / 1000) {
									messages.push(`HR: ${Math.round(discordUser.osuHardRockDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.hardRock * 1000) / 1000}`);
								}
								if (Math.round(discordUser.osuDoubleTimeDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.doubleTime * 1000) / 1000) {
									messages.push(`DT: ${Math.round(discordUser.osuDoubleTimeDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.doubleTime * 1000) / 1000}`);
								}
								if (Math.round(discordUser.osuFreeModDuelStarRating * 1000) / 1000 !== Math.round(userDuelStarRating.freeMod * 1000) / 1000) {
									messages.push(`FM: ${Math.round(discordUser.osuFreeModDuelStarRating * 1000) / 1000} -> ${Math.round(userDuelStarRating.freeMod * 1000) / 1000}`);
								}
								if (messages.length > 1) {
									const IRCUser = await bancho.getUser(discordUser.osuName);
									for (let i = 0; i < messages.length; i++) {
										await IRCUser.sendMessage(messages[i]);
									}
								}
							})
							.catch(() => {
								//Nothing
							});

						try {
							await processQueueTask.destroy();
						} catch (error) {
							//Nothing
						}
						return await channel.leave();
					}
				});
			} else if (interaction.options._subcommand === 'ranking') {
				await interaction.deferReply();
				let osuUser = {
					id: null,
					name: null,
				};

				if (interaction.options._hoistedOptions[0]) {
					//Get the user by the argument given
					if (interaction.options._hoistedOptions[0].value.startsWith('<@') && interaction.options._hoistedOptions[0].value.endsWith('>')) {
						logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers');
						const discordUser = await DBDiscordUsers.findOne({
							where: { userId: interaction.options._hoistedOptions[0].value.replace('<@', '').replace('>', '').replace('!', '') },
						});

						if (discordUser && discordUser.osuUserId) {
							osuUser.id = discordUser.osuUserId;
							osuUser.name = discordUser.osuName;
						} else {
							return await interaction.editReply({ content: `\`${interaction.options._hoistedOptions[0].value.replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`/osu-link connect <username>\`.`, ephemeral: true });
						}
					} else {
						osuUser.id = getIDFromPotentialOsuLink(interaction.options._hoistedOptions[0].value);
					}
				} else {
					//Try to get the user by the message if no argument given
					msg = await populateMsgFromInteraction(interaction);
					const commandConfig = await getOsuUserServerMode(msg, []);
					const commandUser = commandConfig[0];

					if (commandUser && commandUser.osuUserId) {
						osuUser.id = commandUser.osuUserId;
						osuUser.name = commandUser.osuName;
					} else {
						const userDisplayName = await getMessageUserDisplayname(msg);
						osuUser.name = userDisplayName;
					}
				}

				if (!osuUser.name) {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					const user = await osuApi.getUser({ u: osuUser.id, m: 0 })
						.catch(err => {
							if (err.message !== 'Not found') {
								console.log(err);
							}
						});

					if (!user) {
						return await interaction.editReply({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\`.`, ephemeral: true });
					}

					osuUser.id = user.id;
					osuUser.name = user.name;
				}

				const now = new Date();

				let seasonEnd = new Date();
				seasonEnd.setUTCFullYear(2018);
				seasonEnd.setUTCMonth(11);
				seasonEnd.setUTCDate(30);
				seasonEnd.setUTCHours(23);
				seasonEnd.setUTCMinutes(59);
				seasonEnd.setUTCSeconds(59);
				seasonEnd.setUTCMilliseconds(999);

				let historicalUserDuelStarRatings = [];

				while (seasonEnd < now) {
					let historicalDataset = {
						seasonEnd: `${seasonEnd.getUTCMonth() + 1}/${seasonEnd.getUTCFullYear()}`,
						ratings: await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client, date: seasonEnd })
					};

					if (historicalUserDuelStarRatings.length === 0 && historicalDataset.ratings.total || historicalUserDuelStarRatings.length && historicalDataset.ratings.total && historicalDataset.ratings.total !== historicalUserDuelStarRatings[historicalUserDuelStarRatings.length - 1].ratings.total) {
						historicalUserDuelStarRatings.push(historicalDataset);
					}

					seasonEnd.setUTCMonth(seasonEnd.getUTCMonth() + 12);
				}

				historicalUserDuelStarRatings.reverse();

				const canvasWidth = 700;
				const canvasHeight = 575 + historicalUserDuelStarRatings.length * 250;

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Get context and load the image
				const ctx = canvas.getContext('2d');

				const background = await Canvas.loadImage('./other/osu-background.png');

				for (let i = 0; i < canvas.height / background.height; i++) {
					for (let j = 0; j < canvas.width / background.width; j++) {
						ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
					}
				}

				//Footer
				let today = new Date().toLocaleDateString();

				ctx.font = 'bold 15px comfortaa, sans-serif';
				ctx.fillStyle = '#ffffff';

				ctx.textAlign = 'left';
				ctx.fillText(`UserID: ${osuUser.id}`, 10, canvas.height - 10);

				ctx.textAlign = 'right';
				ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 10, canvas.height - 10);

				//Title
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'center';
				ctx.font = 'bold 30px comfortaa, sans-serif';
				ctx.fillText(`League Rankings for ${osuUser.name}`, 350, 40);

				//Set Duel Rating and League Rank
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'center';
				ctx.font = 'bold 25px comfortaa, sans-serif';
				//Current Total Rating
				ctx.fillText('Current Total Rating', 475, 100);
				let userDuelStarRating = null;
				for (let i = 0; i < 5 && !userDuelStarRating; i++) {
					try {
						userDuelStarRating = await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client });
					} catch (e) {
						if (i === 4) {
							if (e === 'No standard plays') {
								return interaction.editReply(`Could not find any standard plays for user \`${osuUser.name.replace(/`/g, '')}\`.\nPlease try again later.`);
							} else {
								return interaction.editReply('The API seems to be running into errors right now.\nPlease try again later.');
							}
						} else {
							await pause(15000);
						}
					}
				}

				let duelLeague = getOsuDuelLeague(userDuelStarRating.total);

				let leagueText = duelLeague.name;
				let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 400, 100, 150, 150);

				if (userDuelStarRating.noMod === null
					|| userDuelStarRating.hidden === null
					|| userDuelStarRating.hardRock === null
					|| userDuelStarRating.doubleTime === null
					|| userDuelStarRating.freeMod === null) {
					leagueText = 'Provisional: ' + leagueText;
				}

				ctx.fillText(leagueText, 475, 275);
				ctx.fillText(`(${Math.round(userDuelStarRating.total * 1000) / 1000}*)`, 475, 300);

				ctx.font = 'bold 18px comfortaa, sans-serif';

				//Current NoMod Rating
				ctx.fillText('NoMod', 100, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.noMod);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 50, 350, 100, 100);

				ctx.fillText(leagueText, 100, 475);
				if (userDuelStarRating.noMod !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.noMod * 1000) / 1000}*)`, 100, 500);
				}

				//Current Hidden Rating
				ctx.fillText('Hidden', 225, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.hidden);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 175, 350, 100, 100);

				ctx.fillText(leagueText, 225, 475);
				if (userDuelStarRating.hidden !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.hidden * 1000) / 1000}*)`, 225, 500);
				}

				//Current HardRock Rating
				ctx.fillText('HardRock', 350, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.hardRock);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 300, 350, 100, 100);

				ctx.fillText(leagueText, 350, 475);
				if (userDuelStarRating.hardRock !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.hardRock * 1000) / 1000}*)`, 350, 500);
				}

				//Current DoubleTime Rating
				ctx.fillText('DoubleTime', 475, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.doubleTime);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 425, 350, 100, 100);

				ctx.fillText(leagueText, 475, 475);
				if (userDuelStarRating.doubleTime !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.doubleTime * 1000) / 1000}*)`, 475, 500);
				}

				//Current FreeMod Rating
				ctx.fillText('FreeMod', 600, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.freeMod);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 550, 350, 100, 100);

				ctx.fillText(leagueText, 600, 475);
				if (userDuelStarRating.freeMod !== null) {
					ctx.fillText(`(${Math.round(userDuelStarRating.freeMod * 1000) / 1000}*)`, 600, 500);
				}

				for (let i = 0; i < historicalUserDuelStarRatings.length; i++) {
					ctx.beginPath();
					ctx.moveTo(20, 545 + i * 250);
					ctx.lineTo(680, 545 + i * 250);
					ctx.strokeStyle = 'white';
					ctx.stroke();

					//Set Duel Rating and League Rank
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'center';
					ctx.font = 'bold 20px comfortaa, sans-serif';
					//Season Total Rating
					ctx.fillText(`${historicalUserDuelStarRatings[i].seasonEnd} Total Rating`, 125, 575 + i * 250);
					let duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.total);

					let leagueText = duelLeague.name;
					let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 50, 575 + i * 250, 150, 150);

					if (historicalUserDuelStarRatings[i].ratings.noMod === null
						|| historicalUserDuelStarRatings[i].ratings.hidden === null
						|| historicalUserDuelStarRatings[i].ratings.hardRock === null
						|| historicalUserDuelStarRatings[i].ratings.doubleTime === null
						|| historicalUserDuelStarRatings[i].ratings.freeMod === null) {
						leagueText = 'Provisional: ' + leagueText;
					}

					ctx.fillText(leagueText, 125, 750 + i * 250, 150, 150);
					ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.total * 1000) / 1000}*)`, 125, 775 + i * 250, 150, 150);

					ctx.font = 'bold 15px comfortaa, sans-serif';

					//Season NoMod Rating
					ctx.fillText('NoMod', 287, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.noMod);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 250, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 287, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.noMod !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.noMod * 1000) / 1000}*)`, 287, 725 + i * 250);
					}

					//Season Hidden Rating
					ctx.fillText('Hidden', 377, 650 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.hidden);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 340, 650 + i * 250, 75, 75);

					ctx.fillText(leagueText, 377, 750 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.hidden !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.hidden * 1000) / 1000}*)`, 377, 775 + i * 250);
					}

					//Season HardRock Rating
					ctx.fillText('HardRock', 467, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.hardRock);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 430, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 467, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.hardRock !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.hardRock * 1000) / 1000}*)`, 467, 725 + i * 250);
					}

					//Season DoubleTime Rating
					ctx.fillText('DoubleTime', 557, 650 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.doubleTime);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 520, 650 + i * 250, 75, 75);

					ctx.fillText(leagueText, 557, 750 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.doubleTime !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.doubleTime * 1000) / 1000}*)`, 557, 775 + i * 250);
					}

					//Season FreeMod Rating
					ctx.fillText('FreeMod', 647, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.freeMod);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 610, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 647, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.freeMod !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.freeMod * 1000) / 1000}*)`, 647, 725 + i * 250);
					}
				}

				//Get a circle for inserting the player avatar
				ctx.beginPath();
				ctx.arc(180, 180, 80, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.clip();

				//Draw a shape onto the main canvas
				try {
					const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${osuUser.id}`);
					ctx.drawImage(avatar, 100, 100, 160, 160);
				} catch (error) {
					const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
					ctx.drawImage(avatar, 100, 100, 160, 160);
				}

				//Create as an attachment
				const leagueRankings = new Discord.MessageAttachment(canvas.toBuffer(), `osu-league-rankings-${osuUser.id}.png`);

				return await interaction.editReply({ content: 'The data is based on matches played using `/osu-duel match` and any other tournament matches.\nThe values are supposed to show a star rating where a player will get around 350k average score with Score v2.', files: [leagueRankings] });
			} else if (interaction.options._subcommand === 'rating-leaderboard') {
				if (!interaction.guild) {
					return interaction.reply('The leaderboard can currently only be used in servers.');
				}
				interaction.deferReply();

				interaction.guild.members.fetch()
					.then(async (guildMembers) => {
						const members = [];
						guildMembers.each(member => members.push(member));
						let osuAccounts = [];
						for (let i = 0; i < members.length; i++) {
							logDatabaseQueries(4, 'commands/osu-leaderboard.js DBDiscordUsers');
							const discordUser = await DBDiscordUsers.findOne({
								where: {
									userId: members[i].id,
									osuUserId: {
										[Op.not]: null,
									},
									osuDuelStarRating: {
										[Op.not]: null,
									}
								},
							});

							if (discordUser) {
								osuAccounts.push({
									userId: discordUser.userId,
									osuUserId: discordUser.osuUserId,
									osuName: discordUser.osuName,
									osuVerified: discordUser.osuVerified,
									osuDuelStarRating: parseFloat(discordUser.osuDuelStarRating),
								});
							}
						}

						quicksortDuelStarRating(osuAccounts);

						let leaderboardData = [];

						let messageToAuthor = '';

						for (let i = 0; i < osuAccounts.length; i++) {
							if (interaction.user.id === osuAccounts[i].userId) {
								messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
							}
							const member = await interaction.guild.members.fetch(osuAccounts[i].userId);

							let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

							if (member.nickname) {
								userDisplayName = `${member.nickname} / ${userDisplayName}`;
							}

							let verified = '⨯';

							if (osuAccounts[i].osuVerified) {
								verified = '✔';
							}

							let dataset = {
								name: userDisplayName,
								value: `${Math.round(osuAccounts[i].osuDuelStarRating * 1000) / 1000}* | ${verified} ${osuAccounts[i].osuName}`,
								color: getOsuDuelLeague(osuAccounts[i].osuDuelStarRating).color,
							};


							leaderboardData.push(dataset);
						}

						let totalPages = Math.floor(leaderboardData.length / leaderboardEntriesPerPage) + 1;

						let page;

						if (interaction.options._hoistedOptions && interaction.options._hoistedOptions[0] && interaction.options._hoistedOptions[0].value) {
							page = parseInt(interaction.options._hoistedOptions[0].value);
						}

						if (!page && leaderboardData.length > 300) {
							page = 1;
						}

						if (totalPages === 1) {
							page = null;
						}

						let filename = `osu-duelrating-leaderboard-${interaction.user.id}-${interaction.guild.name}.png`;

						if (page) {
							filename = `osu-duelrating-leaderboard-${interaction.user.id}-${interaction.guild.name}-page${page}.png`;
						}

						const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${interaction.guild.name}'s osu! Duel Star Rating leaderboard`, filename, page);

						//Send attachment
						await interaction.followUp({ content: `The leaderboard consists of all players that have their osu! account connected to the bot.${messageToAuthor}\nUse \`/osu-link connect <username>\` to connect your osu! account.\nData is being updated once a day or when \`/osu-duel starrating username:[username]\` is being used.`, files: [attachment] });
					})
					.catch(err => {
						console.log(err);
					});
			} else if (interaction.options._subcommand === 'data') {
				await interaction.deferReply({ ephemeral: true });
				let osuUser = {
					id: null,
					name: null,
				};

				if (interaction.options._hoistedOptions[0]) {
					//Get the user by the argument given
					if (interaction.options._hoistedOptions[0].value.startsWith('<@') && interaction.options._hoistedOptions[0].value.endsWith('>')) {
						logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers');
						const discordUser = await DBDiscordUsers.findOne({
							where: { userId: interaction.options._hoistedOptions[0].value.replace('<@', '').replace('>', '').replace('!', '') },
						});

						if (discordUser && discordUser.osuUserId) {
							osuUser.id = discordUser.osuUserId;
							osuUser.name = discordUser.osuName;
						} else {
							return await interaction.editReply({ content: `\`${interaction.options._hoistedOptions[0].value.replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`/osu-link connect <username>\`.`, ephemeral: true });
						}
					} else {
						osuUser.id = getIDFromPotentialOsuLink(interaction.options._hoistedOptions[0].value);
					}
				} else {
					//Try to get the user by the message if no argument given
					msg = await populateMsgFromInteraction(interaction);
					const commandConfig = await getOsuUserServerMode(msg, []);
					const commandUser = commandConfig[0];

					if (commandUser && commandUser.osuUserId) {
						osuUser.id = commandUser.osuUserId;
						osuUser.name = commandUser.osuName;
					} else {
						const userDisplayName = await getMessageUserDisplayname(msg);
						osuUser.name = userDisplayName;
					}
				}

				if (!osuUser.name) {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					const user = await osuApi.getUser({ u: osuUser.id, m: 0 })
						.catch(err => {
							if (err.message !== 'Not found') {
								console.log(err);
							}
						});

					if (!user) {
						return await interaction.editReply({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\`.`, ephemeral: true });
					}

					osuUser.id = user.id;
					osuUser.name = user.name;
				}

				let userDuelStarRating = null;
				for (let i = 0; i < 5 && !userDuelStarRating; i++) {
					try {
						userDuelStarRating = await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client });
					} catch (e) {
						if (i === 4) {
							if (e === 'No standard plays') {
								return interaction.editReply(`Could not find any standard plays for user \`${osuUser.name.replace(/`/g, '')}\`.\nPlease try again later.`);
							} else {
								return interaction.editReply('The API seems to be running into errors right now.\nPlease try again later.');
							}
						} else {
							await pause(15000);
						}
					}
				}

				//Create all the output files
				let files = [];

				let stepData = [
					userDuelStarRating.stepData.NM,
					userDuelStarRating.stepData.HD,
					userDuelStarRating.stepData.HR,
					userDuelStarRating.stepData.DT,
					userDuelStarRating.stepData.FM
				];

				for (let i = 0; i < stepData.length; i++) {
					quicksortStep(stepData[i]);

					for (let j = 0; j < stepData[i].length; j++) {
						stepData[i][j] = `${stepData[i][j].step.toFixed(1)}*: ${(Math.round(stepData[i][j].averageWeight * 1000) / 1000).toFixed(3)} weight`;
					}

					if (i === 0) {
						stepData[i] = 'NM Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 1) {
						stepData[i] = 'HD Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 2) {
						stepData[i] = 'HR Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 3) {
						stepData[i] = 'DT Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 4) {
						stepData[i] = 'FM Starrating Weights:\n' + stepData[i].join('\n');
					}
				}

				//Get the multiplayer matches
				let multiScores = [
					userDuelStarRating.scores.NM,
					userDuelStarRating.scores.HD,
					userDuelStarRating.scores.HR,
					userDuelStarRating.scores.DT,
					userDuelStarRating.scores.FM
				];

				let multiMatches = [];
				let multiMatchIds = [];

				for (let i = 0; i < multiScores.length; i++) {
					for (let j = 0; j < multiScores[i].length; j++) {
						if (!multiMatchIds.includes(multiScores[i][j].matchId)) {
							multiMatches.push({ matchId: multiScores[i][j].matchId, matchName: multiScores[i][j].matchName, matchStartDate: multiScores[i][j].matchStartDate });
							multiMatchIds.push(multiScores[i][j].matchId);
						}
					}
				}

				quicksortMatchId(multiMatches);

				for (let i = 0; i < multiMatches.length; i++) {
					multiMatches[i] = `${(multiMatches[i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${multiMatches[i].matchStartDate.getUTCFullYear()} - ${multiMatches[i].matchName} ----- https://osu.ppy.sh/community/matches/${multiMatches[i].matchId}`;
				}

				let scores = [
					userDuelStarRating.scores.NM,
					userDuelStarRating.scores.HD,
					userDuelStarRating.scores.HR,
					userDuelStarRating.scores.DT,
					userDuelStarRating.scores.FM
				];

				for (let i = 0; i < scores.length; i++) {
					quicksortScore(scores[i]);

					for (let j = 0; j < scores[i].length; j++) {
						scores[i][j] = `${(scores[i][j].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${scores[i][j].matchStartDate.getUTCFullYear()} - ${Math.round(scores[i][j].score)} points (${(Math.round(scores[i][j].weight * 1000) / 1000).toFixed(3)}): ${(Math.round(scores[i][j].starRating * 100) / 100).toFixed(2)}* | https://osu.ppy.sh/b/${scores[i][j].beatmapId}`;
					}

					if (i === 0) {
						scores[i] = 'NM Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 1) {
						scores[i] = 'HD Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 2) {
						scores[i] = 'HR Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 3) {
						scores[i] = 'DT Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 4) {
						scores[i] = 'FM Scores & Weights:\n' + scores[i].join('\n');
					}
				}

				// eslint-disable-next-line no-undef
				scores = new Discord.MessageAttachment(Buffer.from(scores.join('\n\n'), 'utf-8'), `osu-duel-scores-and-weights-${osuUser.id}.txt`);
				files.push(scores);

				// eslint-disable-next-line no-undef
				stepData = new Discord.MessageAttachment(Buffer.from(stepData.join('\n\n'), 'utf-8'), `osu-duel-star-rating-group-weights-${osuUser.id}.txt`);
				files.push(stepData);

				// eslint-disable-next-line no-undef
				multiMatches = new Discord.MessageAttachment(Buffer.from(multiMatches.join('\n'), 'utf-8'), `osu-duel-multimatches-${osuUser.id}.txt`);
				files.push(multiMatches);

				let explaination = [];
				explaination.push('**Disclaimer: Everything is heavily Work in Progress**');
				explaination.push('');
				explaination.push('**Hello!**');
				explaination.push('You will likely be overwhelmed by all the info that just popped up.');
				explaination.push('If you are just here to get a rough explaination of how the calculation works, here is a tldr:');
				explaination.push('');
				explaination.push('**TL;DR:**');
				explaination.push('The star rating is calculated based on your last 50 tournament score v2 scores for each modpool.');
				explaination.push('You can see the scores taken into account in the first file attached.');
				explaination.push('You can see the starratings and how they are evaluated in the second file. (The higher the weight the more effect the star rating has on the overall star rating)');
				explaination.push('You can see the matches where the scores are from in the third file.');
				explaination.push('');
				explaination.push('**In Depth Explaination:**');
				explaination.push('1. Step:');
				explaination.push('The bot grabs the last 50 tournament score v2 scores for each modpool. (Limited to unique ranked maps)');
				explaination.push('The limit exists to not evaluate the same maps twice, to limit the API calls to some extend and to get relatively recent data without losing accuracy due to limiting it to a timestamp.');
				explaination.push('');
				explaination.push('2. Step:');
				explaination.push('After doing some adaptions to counter mods effects on the score each score will be assigned a weight using a bell curve with the highest weight at 350k; dropping lower on both sides to not get too hard and not too easy maps.');
				explaination.push('You can find the weight graph here: <https://www.desmos.com/calculator/netnkpeupv>');
				explaination.push('');
				await interaction.editReply({ content: explaination.join('\n'), ephemeral: true });
				explaination = [];
				explaination.push('3. Step:');
				explaination.push('Each score and its weight will be put into a star rating step. (A 5.0 map will be put into the 4.8, 4.9, 5.0, 5.1 and 5.2 steps)');
				explaination.push('Each step will average the weights of their scores and will calculate a weighted star rating (e.g. 4.8 stars with an average weight of 0.5 will be a weighted star rating of 2.4)');
				explaination.push('The weighted star ratings of each step will now be summed up and divided by all the average weights of each step summed up.');
				explaination.push('This will result in the modpool star rating.');
				explaination.push('');
				explaination.push('4. Step:');
				explaination.push('The total star rating will be calculated relative to how many maps of each modpool were played in the last 100 score v2 tournament scores.');
				explaination.push('This will allow a player that mainly plays HD to have their HD modpool star rating have more impact on the total star rating than a player that mostly plays NM. This is being done because in a real match the HD player is more likely to play HD than the NM player and will therefore be more affected by their HD skill.');
				return await interaction.followUp({ content: explaination.join('\n'), files: files, ephemeral: true });
			}
		}
	},
};

async function messageUserWithRetries(user, interaction, content) {
	for (let i = 0; i < 3; i++) {
		try {
			await user.send(content)
				.then(() => {
					i = Infinity;
				})
				.catch(async (error) => {
					throw (error);
				});
		} catch (error) {
			if (error.message === 'Cannot send messages to this user' || error.message === 'Internal Server Error') {
				if (i === 2) {
					interaction.followUp(`[Duel] <@${user.id}>, it seems like I can't DM you in Discord. Please enable DMs so that I can keep you up to date with the match procedure!`);
				} else {
					await pause(2500);
				}
			} else {
				i = Infinity;
				console.log(error);
			}
		}
	}
}

function shuffle(array) {
	let currentIndex = array.length, randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseInt(list[j].score) >= parseInt(pivot.score)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}

function partitionDuelStarRating(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (list[j].osuDuelStarRating >= pivot.osuDuelStarRating) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortDuelStarRating(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionDuelStarRating(list, start, end);
		quicksortDuelStarRating(list, start, p - 1);
		quicksortDuelStarRating(list, p + 1, end);
	}
	return list;
}

function partitionStep(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (list[j].step < pivot.step) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortStep(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionStep(list, start, end);
		quicksortStep(list, start, p - 1);
		quicksortStep(list, p + 1, end);
	}
	return list;
}

function partitionScore(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (list[j].score < pivot.score) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortScore(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionScore(list, start, end);
		quicksortScore(list, start, p - 1);
		quicksortScore(list, p + 1, end);
	}
	return list;
}

function partitionMatchId(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (list[j].matchId > pivot.matchId) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortMatchId(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionMatchId(list, start, end);
		quicksortMatchId(list, start, p - 1);
		quicksortMatchId(list, p + 1, end);
	}
	return list;
}

async function getOsuMapInfo(dbBeatmap) {
	const mapScores = await DBOsuMultiScores.findAll({
		where: {
			beatmapId: dbBeatmap.beatmapId,
			tourneyMatch: true,
			matchName: {
				[Op.notLike]: 'MOTD:%',
			},
		}
	});

	let tournaments = [];

	for (let i = 0; i < mapScores.length; i++) {
		let acronym = mapScores[i].matchName.replace(/:.+/gm, '');

		if (tournaments.indexOf(acronym) === -1) {
			tournaments.push(acronym);
		}
	}

	return `https://osu.ppy.sh/b/${dbBeatmap.beatmapId} | https://beatconnect.io/b/${dbBeatmap.beatmapsetId} | Map played ${mapScores.length} times in: ${tournaments.join(', ')}`;
}