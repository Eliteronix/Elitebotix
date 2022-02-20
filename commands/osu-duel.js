const { DBDiscordUsers, DBProcessQueue, DBOsuMultiScores, DBOsuBeatmaps } = require('../dbObjects');
const osu = require('node-osu');
const { getOsuBeatmap, getMatchesPlanned, logDatabaseQueries, getOsuUserServerMode, populateMsgFromInteraction, pause, saveOsuMultiScores, getMessageUserDisplayname, getIDFromPotentialOsuLink, getUserDuelStarRating, createLeaderboard } = require('../utils');
const { Permissions } = require('discord.js');
const { Op } = require('sequelize');
const { leaderboardEntriesPerPage } = require('../config.json');

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
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply('Please set up the game using the / command `/osu-duel`');
		}
		if (interaction) {
			if (interaction.options._subcommand === 'match') {
				await interaction.deferReply();
				//Get the star ratings for both users
				msg = await populateMsgFromInteraction(interaction);
				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (commandUser.userId === interaction.options._hoistedOptions[0].value) {
					return await interaction.editReply('You cannot play against yourself.');
				}

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.editReply('You don\'t have your osu! account connected and verified.\nPlease connect your account by using `/osu-link connect <username>`.');
				}

				let firstStarRating = await getUserDuelStarRating(commandUser.osuUserId);

				let secondStarRating = null;
				logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers');
				const discordUser = await DBDiscordUsers.findOne({
					where: {
						userId: interaction.options._hoistedOptions[0].value,
						osuVerified: true
					}
				});

				if (discordUser && discordUser.osuUserId) {
					secondStarRating = await getUserDuelStarRating(discordUser.osuUserId);
				} else {
					return await interaction.editReply(`<@${interaction.options._hoistedOptions[0].value}> doesn't have their osu! account connected and verified.\nPlease have them connect their account by using \`/osu-link connect <username>\`.`);
				}

				let averageStarRating = (firstStarRating + secondStarRating) / 2;

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
					}
				});

				for (let i = 0; i < player1Scores.length; i++) {
					player1Scores[i] = player1Scores[i].beatmapId;
				}

				const player2Scores = await DBOsuMultiScores.findAll({
					where: {
						osuUserId: discordUser.osuUserId,
						tourneyMatch: true,
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
										[Op.gte]: 150,
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

						if (parseFloat(beatmaps[index].starRating) < lowerBound || parseFloat(beatmaps[index].starRating) > upperBound) {
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
							if (modPools[mapIndex] === 'FreeMod') {
								await channel.sendMessage('Valid Mods: HD, HR | NM will be 0.5x of the score achieved.');
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
					if (modPools[mapIndex - 1] === 'FreeMod' && mapIndex - 1 < 6) {
						for (let i = 0; i < results.length; i++) {
							//Reduce the score by 0.5 if it was FreeMod and no mods / only nofail was picked
							if (!results[i].player.mods || results[i].player.mods.length === 0 || results[i].player.mods.length === 1 && results[i].player.mods[0].enumValue === 1) {
								results[i].score = results[i].score * 0.5;
							} else {
								let invalidModsPicked = false;
								for (let j = 0; j < results[i].player.mods.length; j++) {
									if (results[i].player.mods[j].enumValue !== 1 && results[i].player.mods[j].enumValue !== 8 && results[i].player.mods[j].enumValue !== 16) {
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
						await channel.sendMessage(`${results[0].player.user.username}: ${results[0].score} | ${results[1].player.user.username}: ${results[1].score}`);
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
						await channel.sendMessage('Everyone please ready up!');
						if (modPools[mapIndex] === 'FreeMod' && mapIndex < 6) {
							await channel.sendMessage('Valid Mods: HD, HR | NM will be 0.5x of the score achieved.');
						} else if (modPools[mapIndex] === 'FreeMod' && mapIndex === 6) {
							await channel.sendMessage('Valid Mods: HD, HR | NM will be just as achieved.');
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
			} else if (interaction.options._subcommand === 'starrating') {
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
						return await interaction.editReply({ content: `Could not find user \`${osuUser.name.replace(/`/g, '')}\`.`, ephemeral: true });
					}

					osuUser.id = user.id;
					osuUser.name = user.name;
				}

				const starRating = await getUserDuelStarRating(osuUser.id);

				return await interaction.editReply({ content: `The user \`${osuUser.name.replace(/`/g, '')}\` has a star rating evaluation of \`${Math.round(starRating * 100) / 100}*\`.`, ephemeral: true });
			} else if (interaction.options._subcommand === 'rating-leaderboard') {
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
								name: userDisplayName
							};

							dataset.value = `${Math.round(osuAccounts[i].osuDuelStarRating * 1000) / 1000}* | ${verified} ${osuAccounts[i].osuName}`;

							leaderboardData.push(dataset);
						}

						let totalPages = Math.floor(leaderboardData.length / leaderboardEntriesPerPage) + 1;

						let page;

						if (args[0] && !isNaN(args[0])) {
							page = parseInt(args[0]);
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