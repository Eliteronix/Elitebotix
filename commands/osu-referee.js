const { DBDiscordUsers, DBProcessQueue, DBOsuMultiScores, DBOsuBeatmaps } = require('../dbObjects');
const osu = require('node-osu');
const { getIDFromPotentialOsuLink, getOsuBeatmap, updateOsuDetailsforUser, getMatchesPlanned, logDatabaseQueries, getScoreModpool, getOsuUserServerMode, populateMsgFromInteraction, pause, saveOsuMultiScores } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-referee',
	aliases: ['osu-host'],
	description: 'Lets you schedule a match which is being reffed by the bot',
	// usage: '[username] [username] ... (Use "_" instead of spaces; Use --b for bancho / --r for ripple; Use --s/--t/--c/--m for modes)',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply('Please set up the game using the / command `/osu-referee`');
		}
		if (interaction) {
			await interaction.reply('Information is being processed');
			if (interaction.options._subcommand === 'duel') {
				//Get the star ratings for both users
				msg = await populateMsgFromInteraction(interaction);
				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (commandUser.userId === interaction.options._hoistedOptions[0].value) {
					return await interaction.followUp('You cannot play against yourself.');
				}

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.followUp('You don\'t have your osu! account connected and verified.\nPlease connect your account by using `/osu-link connect <username>`.');
				}

				let firstStarRating = await getUserDuelStarRating(commandUser.osuUserId);

				let secondStarRating = null;
				logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers');
				const discordUser = await DBDiscordUsers.findOne({
					where: { userId: interaction.options._hoistedOptions[0].value, osuVerified: true }
				});

				if (discordUser && discordUser.osuUserId) {
					secondStarRating = await getUserDuelStarRating(discordUser.osuUserId);
				} else {
					return await interaction.followUp(`<@${interaction.options._hoistedOptions[0].value}> doesn't have their osu! account connected and verified.\nPlease have them connect their account by using \`/osu-link connect <username>\`.`);
				}

				let averageStarRating = (firstStarRating + secondStarRating) / 2;
				console.log(firstStarRating, secondStarRating);

				let lowerBound = averageStarRating - 0.25;
				let upperBound = averageStarRating + 0.25;

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
					return interaction.followUp('The bot cannot host another match at the moment because there will already be 4 matches running. (Maximum limit is 4)');
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
						let changeThisInTheEnd;
						channel = await bancho.createLobby(`ETX- (${commandUser.osuName}) vs (${discordUser.osuName})`);
						break;
					} catch (error) {
						if (i === 4) {
							return await interaction.followUp('I am having issues creating the lobby and the match has been aborted.\nPlease try again later.');
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
				let dbMaps = [];
				let dbMapIds = [];

				// Used like so
				let modPools = ['NM', 'HD', 'HR', 'DT', 'FM'];
				shuffle(modPools);
				modPools.push('NM', 'FM');

				//Get the amount of Maps in the DB
				let amountOfMapsInDB = -1;
				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				while (amountOfMapsInDB === -1) {
					const mostRecentBeatmap = await osuApi.getBeatmaps({ limit: 1 });

					const dbBeatmap = await getOsuBeatmap(mostRecentBeatmap[0].id, 0);

					if (dbBeatmap) {
						amountOfMapsInDB = dbBeatmap.id;
					}
				}

				//Get the map for each modpool
				for (let i = 0; i < modPools.length; i++) {
					let dbBeatmap = null;

					while (dbBeatmap === null) {
						const index = Math.floor(Math.random() * amountOfMapsInDB);

						logDatabaseQueries(4, 'commands/osu-referee.js DBOsuBeatmaps');
						dbBeatmap = await DBOsuBeatmaps.findOne({
							where: { id: index }
						});

						let correctModPool = false;
						if (dbBeatmap) {
							const mapScores = await DBOsuMultiScores.findAll({
								where: { beatmapId: dbBeatmap.beatmapId, tourneyMatch: true }
							});

							for (let j = 0; j < mapScores.length; j++) {
								if (modPools[i] === getScoreModpool(mapScores[j]) && mapScores[j].matchName && !mapScores[j].matchName.startsWith('MOTD')) {
									correctModPool = true;
									break;
								}
							}
						}

						//No need to check for tourney map because its done by correctModPool boolean already
						if (dbBeatmap && dbBeatmap.mode === 'Standard' && parseFloat(dbBeatmap.starRating) >= lowerBound && parseFloat(dbBeatmap.starRating) <= upperBound && correctModPool && !dbMapIds.includes(dbBeatmap.id)) {
							if (i < 6 && dbBeatmap.drainLength > 100 && dbBeatmap.drainLength < 270 || i === 6 && dbBeatmap.drainLength >= 270 && dbBeatmap.drainLength < 360) {
								dbMaps.push(dbBeatmap);
							} else {
								dbBeatmap = null;
							}
						} else {
							dbBeatmap = null;
						}
					}
				}

				modPools[6] = 'FreeMod';
				modPools[modPools.indexOf('FM')] = 'FreeMod';

				await channel.sendMessage(`!mp invite #${commandUser.osuUserId}`);
				let user = await additionalObjects[0].users.fetch(commandUser.userId);
				await messageUserWithRetries(user, interaction, `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);

				await channel.sendMessage(`!mp invite #${discordUser.osuUserId}`);
				user = await additionalObjects[0].users.fetch(discordUser.userId);
				await messageUserWithRetries(user, interaction, `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);

				interaction.followUp(`<@${commandUser.userId}> <@${discordUser.userId}> your match has been created. You have been invited ingame by \`Eliteronix\` and also got a DM as a backup.`);
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
							if (results[i].player.mods.length === 0 || results[i].player.mods.length === 1 && results[i].player.mods[0].enumValue === 1) {
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
			} else if (interaction.options._subcommand === 'soloqualifiers') {
				let date = new Date();
				date.setUTCSeconds(0);
				let dbMaps = [];
				let dbPlayers = [];
				let useNoFail = false;
				let channel = null;
				let matchname = '';
				let mappoolReadable = '';
				let scoreMode = 0;
				let matchLength = 600 + 60 + 180; //Set to forfeit time by default + 1 end minute + 3 extra minutes backup
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'date') {
						date.setUTCDate(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'month') {
						date.setUTCMonth(interaction.options._hoistedOptions[i].value - 1);
					} else if (interaction.options._hoistedOptions[i].name === 'year') {
						date.setUTCFullYear(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'hour') {
						date.setUTCHours(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'minute') {
						date.setUTCMinutes(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'mappool') {
						let maps = interaction.options._hoistedOptions[i].value.split(',');
						mappoolReadable = interaction.options._hoistedOptions[i].value;

						for (let j = 0; j < maps.length; j++) {
							if (!maps[j].match(/[a-zA-Z][a-zA-Z]\d+/gm)) {
								return interaction.followUp(`${maps[j]} is not a valid map`);
							}
							let modBits;

							if (maps[j].toLowerCase().startsWith('nm')) {
								modBits = 0;
							} else if (maps[j].toLowerCase().startsWith('hd')) {
								modBits = 8;
							} else if (maps[j].toLowerCase().startsWith('hr')) {
								modBits = 16;
							} else if (maps[j].toLowerCase().startsWith('dt')) {
								modBits = 64;
							} else {
								return interaction.followUp(`${maps[j].substring(0, 2)} is not a valid mod.`);
							}

							let dbBeatmap = await getOsuBeatmap(maps[j].substring(2), modBits);

							if (dbBeatmap) {
								dbMaps.push(dbBeatmap.id);
								matchLength += 120 + parseInt(dbBeatmap.totalLength);
							} else {
								return interaction.followUp(`The beatmap \`${maps[j].substring(2)}\` could not be found.`);
							}
						}
					} else if (interaction.options._hoistedOptions[i].name === 'players') {
						// eslint-disable-next-line no-undef
						const osuApi = new osu.Api(process.env.OSUTOKENV1, {
							// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
							notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
							completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
							parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
						});
						let players = interaction.options._hoistedOptions[i].value.split(',');

						for (let j = 0; j < players.length; j++) {
							const response = await osuApi.getUser({ u: getIDFromPotentialOsuLink(players[j]), m: 0 })
								.then(async (user) => {
									updateOsuDetailsforUser(user, 0);

									logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 1');
									const dbDiscordUser = await DBDiscordUsers.findOne({
										where: { osuUserId: user.id }
									});

									if (dbDiscordUser) {
										dbPlayers.push(dbDiscordUser.id);
									} else {
										return interaction.followUp(`${user.name}\` doesn't have their account connected. Please tell them to connect their account using \`/osu-link connect\`. (Use \`_\` instead of spaces)`);
									}
								})
								.catch(err => {
									if (err.message === 'Not found') {
										return interaction.followUp(`Could not find user \`${getIDFromPotentialOsuLink(players[j]).replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
									} else {
										return interaction.followUp(`The bot ran into an error processing the user ${getIDFromPotentialOsuLink(players[j])}. Please try again.`);
									}
								});

							if (response) {
								return;
							}
						}
					} else if (interaction.options._hoistedOptions[i].name === 'usenofail' && interaction.options._hoistedOptions[i].value) {
						useNoFail = true;
					} else if (interaction.options._hoistedOptions[i].name === 'channel') {
						channel = await interaction.guild.channels.fetch(interaction.options._hoistedOptions[i].value);
						if (channel.type !== 'GUILD_TEXT') {
							return interaction.followUp(`<#${channel.id}> is not a valid text channel.`);
						}
					} else if (interaction.options._hoistedOptions[i].name === 'matchname') {
						matchname = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'score') {
						scoreMode = interaction.options._hoistedOptions[i].value;
					}
				}

				let now = new Date();
				if (now > date) {
					return interaction.followUp('You are trying to schedule a match in the past which is not allowed.');
				} else if (now.setUTCDate(now.getUTCDate() + 14) < date) {
					return interaction.followUp('You are trying to schedule a match more than 2 weeks in the future which is not allowed.');
				}

				//Calculate if there are going to be other matches running during that time
				let endDate = new Date();
				endDate.setUTCFullYear(date.getUTCFullYear());
				endDate.setUTCMonth(date.getUTCMonth());
				endDate.setUTCDate(date.getUTCDate());
				endDate.setUTCHours(date.getUTCHours());
				endDate.setUTCMinutes(date.getUTCMinutes());
				endDate.setUTCSeconds(0);
				endDate.setUTCSeconds(matchLength);

				let matchesPlanned = await getMatchesPlanned(date, endDate);

				if (matchesPlanned > 3) {
					return interaction.followUp('The bot cannot host another match at the specified time because there will already be 4 matches running. (Maximum limit is 4)');
				}

				date.setUTCMinutes(date.getUTCMinutes() - 15);

				DBProcessQueue.create({ guildId: interaction.guildId, task: 'tourneyMatchNotification', priority: 10, additions: `${interaction.user.id};${channel.id};${dbMaps.join(',')};${dbPlayers.join(',')};${useNoFail};${matchname};${mappoolReadable};${scoreMode}`, date: date });
				return interaction.followUp('The match has been scheduled. The players will be informed as soon as it happens. To look at your scheduled matches please use `/osu-referee scheduled`');
			} else if (interaction.options._subcommand === 'scheduled') {
				let scheduledMatches = [];
				//Get all scheduled matches that still need to notify
				logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 1');
				const tourneyMatchNotifications = await DBProcessQueue.findAll({
					where: { task: 'tourneyMatchNotification' }
				});

				for (let i = 0; i < tourneyMatchNotifications.length; i++) {
					//Get the match data from the additions field
					let additions = tourneyMatchNotifications[i].additions.split(';');
					//Check if the executing user is the 0 index of the additions
					if (additions[0] === interaction.user.id) {
						//Get the player IDs from the additions on index 3
						let players = additions[3].split(',');
						//Translate the player IDs to osu! usernames
						let dbPlayerNames = [];
						for (let j = 0; j < players.length; j++) {
							logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 2');
							const dbDiscordUser = await DBDiscordUsers.findOne({
								where: { id: players[j] }
							});
							dbPlayerNames.push(dbDiscordUser.osuName);
						}

						//Get the match date from the date the task is scheduled to
						const matchDate = tourneyMatchNotifications[i].date;
						//Increase the matchDate by 15 minutes to get the date the match actually starts (Because notifications happen 15 minutes earlier)
						matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 15);

						scheduledMatches.push(`\`\`\`Scheduled:\nInternal ID: ${tourneyMatchNotifications[i].id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${dbPlayerNames.join(', ')}\nMappool: ${additions[6]}\`\`\``);
					}
				}

				logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 2');
				const tourneyMatchReferees = await DBProcessQueue.findAll({
					where: { task: 'tourneyMatchReferee' }
				});

				for (let i = 0; i < tourneyMatchReferees.length; i++) {
					let additions = tourneyMatchReferees[i].additions.split(';');
					if (additions[0] === interaction.user.id) {
						let players = additions[3].split(',');
						let dbPlayerNames = [];
						for (let j = 0; j < players.length; j++) {
							logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 3');
							const dbDiscordUser = await DBDiscordUsers.findOne({
								where: { id: players[j] }
							});
							dbPlayerNames.push(dbDiscordUser.osuName);
						}

						const matchDate = tourneyMatchReferees[i].date;
						matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 10);

						scheduledMatches.push(`\`\`\`Scheduled (Already pinged):\nInternal ID: ${tourneyMatchReferees[i].id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${dbPlayerNames.join(', ')}\nMappool: ${additions[6]}\`\`\``);
					}
				}

				if (!scheduledMatches.length) {
					scheduledMatches = 'No matches scheduled.';
				} else {
					scheduledMatches = scheduledMatches.join('\n');
				}

				return interaction.followUp(`Your scheduled matches:\n${scheduledMatches}`);
			} else if (interaction.options._subcommand === 'remove') {
				const internalId = interaction.options._hoistedOptions[0].value;
				logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 3');
				const processQueueTask = await DBProcessQueue.findOne({
					where: { id: internalId }
				});

				if (processQueueTask && (processQueueTask.task === 'tourneyMatchNotification' || processQueueTask.task === 'tourneyMatchReferee')) {
					let additions = processQueueTask.additions.split(';');
					if (additions[0] === interaction.user.id) {
						let players = additions[3].split(',');
						let dbPlayerNames = [];
						for (let j = 0; j < players.length; j++) {
							logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 4');
							const dbDiscordUser = await DBDiscordUsers.findOne({
								where: { id: players[j] }
							});
							dbPlayerNames.push(dbDiscordUser.osuName);
						}

						const matchDate = processQueueTask.date;
						if (processQueueTask.task === 'tourneyMatchNotification') {
							matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 15);
						} else if (processQueueTask.task === 'tourneyMatchReferee') {
							matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 10);
						}

						interaction.followUp(`The following match has been removed and is no longer scheduled to happen:\n\`\`\`Internal ID: ${processQueueTask.id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${dbPlayerNames.join(', ')}\nMappool: ${additions[6]}\`\`\``);

						return processQueueTask.destroy();
					}
				}

				return interaction.followUp('I couldn\'t find a scheduled match created by you with that internal ID.\nTo see what ID you need to put please use `/osu-referee scheduled`');
			}
		}
	},
};

async function getUserDuelStarRating(osuUserId) {
	//Try to get it from tournament data if available
	const userScores = await DBOsuMultiScores.findAll({
		where: { osuUserId: osuUserId }
	});

	const userMapIds = [];
	for (let i = 0; i < userScores.length; i++) {
		if (parseInt(userScores[i].score) > 200000 && parseInt(userScores[i].score) < 750000 && getScoreModpool(userScores[i]) === 'NM' && userScores[i].scoringType === 'Score v2') {
			if (userMapIds.indexOf(userScores[i].beatmapId === -1)) {
				userMapIds.push(userScores[i].beatmapId);
			}
		}
	}

	let starRating = 0;
	for (let i = 0; i < userMapIds.length; i++) {
		const dbBeatmap = await getOsuBeatmap(userMapIds[i], 0);

		if (dbBeatmap) {
			starRating += parseFloat(dbBeatmap.starRating);
		} else {
			userMapIds.splice(i, 1);
			i--;
		}
	}

	if (userMapIds.length) {
		return starRating / userMapIds.length;
	}

	//Get it from the top plays if no tournament data is available

	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	const topScores = await osuApi.getUserBest({ u: osuUserId, m: 0, limit: 100 })
		.catch(err => {
			if (err.message === 'Not found') {
				throw new Error('No standard plays');
			} else {
				console.log(err);
			}
		});

	let stars = [];
	for (let i = 0; i < topScores.length; i++) {
		//Add difficulty ratings
		const dbBeatmap = await getOsuBeatmap(topScores[i].beatmapId, topScores[i].raw_mods);
		if (dbBeatmap && dbBeatmap.starRating && parseFloat(dbBeatmap.starRating) > 0) {
			stars.push(dbBeatmap.starRating);
		}
	}

	let averageStars = 0;
	for (let i = 0; i < stars.length; i++) {
		averageStars += parseFloat(stars[i]);
	}
	return (averageStars / stars.length) - 0.25;
}

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
					interaction.followUp(`<@${user.id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
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