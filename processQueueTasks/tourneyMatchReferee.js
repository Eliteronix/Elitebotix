const { DBDiscordUsers, DBOsuBeatmaps, DBProcessQueue } = require('../dbObjects');
const { pause, saveOsuMultiScores, logDatabaseQueries, logMatchCreation, addMatchMessage } = require('../utils');
const osu = require('node-osu');
const Discord = require('discord.js');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('tourneyMatchReferee');
		let args = processQueueEntry.additions.split(';');

		let channel;

		for (let i = 0; i < 5; i++) {
			try {
				try {
					await bancho.connect();
				} catch (error) {
					if (!error.message === 'Already connected/connecting') {
						throw (error);
					}
				}
				channel = await bancho.createLobby(args[5]);
				client.otherMatches.push(parseInt(channel.lobby.id));

				logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBProcessQueue create');
				DBProcessQueue.create({ guildId: 'None', task: 'importMatch', additions: `${channel.lobby.id}`, priority: 1, date: new Date() });

				processQueueEntry.destroy();
				break;
			} catch (error) {
				if (i === 4) {
					processQueueEntry.destroy();

					let players = args[3].replaceAll('|', ',').split(',');
					let dbPlayers = [];
					for (let j = 0; j < players.length; j++) {
						logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 1');
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayers.push(dbDiscordUser);
					}

					// Sort players by id desc
					dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

					players = args[3];
					for (let j = 0; j < dbPlayers.length; j++) {
						players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
					}
					let user = await client.users.fetch(args[0]);
					user.send(`I am having issues creating the lobby and the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${players}\nMappool: ${args[6]}`);
					client.shard.broadcastEval(async (c, { channelId, message }) => {
						let channel = await c.channels.cache.get(channelId);
						if (channel) {
							channel.send(message);
						}
					}, { context: { channelId: args[1], message: `I am having issues creating the lobby and the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${players}\nMappool: ${args[6]}` } });
					return;
				} else {
					await pause(10000);
				}
			}
		}

		let teams = args[3].split('|');
		let playerIds = [];
		let discordIds = [];
		for (let i = 0; i < teams.length; i++) {
			teams[i] = teams[i].split(',');
			for (let j = 0; j < teams[i].length; j++) {
				logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 2');
				const dbDiscordUser = await DBDiscordUsers.findOne({
					where: { id: teams[i][j] }
				});

				playerIds.push(dbDiscordUser.osuUserId);
				discordIds.push(dbDiscordUser.userId);

				const user = await client.users.fetch(dbDiscordUser.userId);
				dbDiscordUser.user = user;

				teams[i][j] = dbDiscordUser;
			}
		}

		channel.on('message', async (msg) => {
			// eslint-disable-next-line no-undef
			process.send(`osuuser ${msg.user.id}}`);

			addMatchMessage(lobby.id, matchMessages, msg.user.ircUsername, msg.message);
		});

		const lobby = channel.lobby;
		logMatchCreation(client, lobby.name, lobby.id);

		const password = Math.random().toString(36).substring(8);

		let matchMessages = [];
		await lobby.setPassword(password);
		await channel.sendMessage('!mp addref Eliteronix');
		await channel.sendMessage('!mp map 975342 0');
		await channel.sendMessage(`!mp set 0 ${args[7]} ${playerIds.length}`);
		let lobbyStatus = 'Joining phase';
		let mapIndex = 0;
		let maps = args[2].split(',');
		let mappoolReadable = args[6].split(',');
		let dbMaps = [];

		for (let i = 0; i < maps.length; i++) {
			logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBOsuBeatmaps');
			const dbOsuBeatmap = await DBOsuBeatmaps.findOne({
				where: { id: maps[i] }
			});

			if (mappoolReadable[i].toUpperCase().includes('FM')) {
				dbOsuBeatmap.freeMod = true;
			}

			dbMaps.push(dbOsuBeatmap);
		}

		//Send the MP to the scheduler
		try {
			let players = args[3].replaceAll('|', ',').split(',');
			let dbPlayers = [];
			for (let j = 0; j < players.length; j++) {
				logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 3');
				const dbDiscordUser = await DBDiscordUsers.findOne({
					where: { id: players[j] }
				});
				dbPlayers.push(dbDiscordUser);
			}

			// Sort players by id desc
			dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

			players = args[3];
			for (let j = 0; j < dbPlayers.length; j++) {
				players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
			}

			let user = await client.users.fetch(args[0]);
			user.send(`The scheduled Qualifier match has started. <https://osu.ppy.sh/mp/${lobby.id}>\nMatch: \`${args[5]}\`\nScheduled players: ${players}\nMappool: ${args[6]}`);
		} catch (e) {
			//Nothing
		}

		for (let i = 0; i < teams.length; i++) {
			for (let j = 0; j < teams[i].length; j++) {
				await channel.sendMessage(`!mp invite #${teams[i][j].osuUserId}`);
				await messageUserWithRetries(client, teams[i][j].user, args[1], `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
			}
		}

		client.shard.broadcastEval(async (c, { channelId, message }) => {
			let channel = await c.channels.cache.get(channelId);
			if (channel) {
				console.log(`[Shard ${c.shard.ids[0]}] Sending message to ${channelId} [${message}]`);
				channel.send(message);
			}
			// eslint-disable-next-line no-undef
		}, { context: { channelId: args[1], message: `<@${discordIds.join('>, <@')}> your match has been created. You have been invited ingame by \`${process.env.OSUNAME}\` and also got a DM as a backup.` } });

		//Add timers to 10 minutes after the match and also during the scheduled time send another message
		let matchStartingTime = new Date();
		matchStartingTime.setUTCFullYear(processQueueEntry.date.getUTCFullYear());
		matchStartingTime.setUTCMonth(processQueueEntry.date.getUTCMonth());
		matchStartingTime.setUTCDate(processQueueEntry.date.getUTCDate());
		matchStartingTime.setUTCHours(processQueueEntry.date.getUTCHours());
		matchStartingTime.setUTCMinutes(processQueueEntry.date.getUTCMinutes());
		matchStartingTime.setUTCSeconds(processQueueEntry.date.getUTCSeconds());
		matchStartingTime.setUTCMinutes(processQueueEntry.date.getUTCMinutes() + 10);
		let secondRoundOfInvitesSent = false;

		let forfeitTimer = new Date();
		forfeitTimer.setUTCFullYear(processQueueEntry.date.getUTCFullYear());
		forfeitTimer.setUTCMonth(processQueueEntry.date.getUTCMonth());
		forfeitTimer.setUTCDate(processQueueEntry.date.getUTCDate());
		forfeitTimer.setUTCHours(processQueueEntry.date.getUTCHours());
		forfeitTimer.setUTCMinutes(processQueueEntry.date.getUTCMinutes());
		forfeitTimer.setUTCSeconds(processQueueEntry.date.getUTCSeconds());
		forfeitTimer.setUTCMinutes(processQueueEntry.date.getUTCMinutes() + 20);
		let currentTime = new Date();
		let secondsUntilForfeit = Math.round((forfeitTimer - currentTime) / 1000) + 30;
		await channel.sendMessage(`!mp timer ${secondsUntilForfeit}`);
		let noFail = 0;
		if (args[4] === 'true') {
			noFail = 1;
		}

		let teamsThatDontSeemToForfeit = [];

		//Add discord messages and also ingame invites for the timers
		channel.on('message', async (msg) => {
			let now = new Date();
			if (msg.user.ircUsername === 'BanchoBot' && msg.message === 'Countdown finished') {
				//Banchobot countdown finished
				if (lobbyStatus === 'Joining phase') {
					await lobby.updateSettings();
					let allPlayersReady = true;
					for (let i = 0; i < 16; i++) {
						let player = lobby.slots[i];
						if (player && player.state !== require('bancho.js').BanchoLobbyPlayerStates.Ready) {
							allPlayersReady = false;
						}
					}

					if (allPlayersReady) {
						await channel.sendMessage('!mp start 10');

						lobbyStatus === 'Map being played';
					} else {
						lobbyStatus = 'Waiting for start';

						await channel.sendMessage('Everyone please ready up!');
						await channel.sendMessage('!mp timer 120');
					}
				} else if (lobbyStatus === 'Waiting for start') {
					await channel.sendMessage('!mp start 10');

					lobbyStatus === 'Map being played';
				}
			} else if (forfeitTimer < now && lobbyStatus === 'Joining phase') {
				let noPlayers = true;
				for (let i = 0; i < 16; i++) {
					if (lobby.slots[i] !== null) {
						noPlayers = false;
					}
				}

				if (noPlayers) {
					lobbyStatus = 'Aborted';
					await channel.sendMessage('!mp close');

					let players = args[3].replaceAll('|', ',').split(',');
					let dbPlayers = [];
					for (let j = 0; j < players.length; j++) {
						logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 4');
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayers.push(dbDiscordUser);
					}

					// Sort players by id desc
					dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

					players = args[3];
					for (let j = 0; j < dbPlayers.length; j++) {
						players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
					}

					let user = await client.users.fetch(args[0]);
					user.send(`The scheduled Qualifier has been aborted because no one showed up. <https://osu.ppy.sh/mp/${lobby.id}>\nMatch: \`${args[5]}\`\nScheduled players: ${players}\nMappool: ${args[6]}`);
					return await channel.leave();
				}

				lobbyStatus = 'Waiting for start';

				let tries = 0;
				while (lobby._beatmapId != dbMaps[mapIndex].beatmapId && tries < 25) {
					await channel.sendMessage('!mp abort');
					await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
					await pause(5000);
					await lobby.updateSettings();
					tries++;
				}
				//Check mods and set them if needed
				let modBits = 0;
				if (lobby.mods) {
					for (let i = 0; i < lobby.mods.length; i++) {
						modBits += lobby.mods[i].enumValue;
					}
				}
				while (parseInt(dbMaps[mapIndex].mods) + noFail !== modBits) {
					await channel.sendMessage(`!mp mods ${parseInt(dbMaps[mapIndex].mods) + noFail}`);
					await pause(5000);
					modBits = 0;
					if (lobby.mods) {
						for (let i = 0; i < lobby.mods.length; i++) {
							modBits += lobby.mods[i].enumValue;
						}
					}
				}

				if (dbMaps[mapIndex].freeMod) {
					await channel.sendMessage(`!mp mods ${parseInt(dbMaps[mapIndex].mods) + noFail} freemod`);
					await channel.sendMessage(args[8]);
				}

				await channel.sendMessage('Everyone please ready up!');
				await channel.sendMessage('!mp timer 120');
			} else if (matchStartingTime < now && !secondRoundOfInvitesSent && lobbyStatus === 'Joining phase') {
				secondRoundOfInvitesSent = true;
				await lobby.updateSettings();
				for (let i = 0; i < teams.length; i++) {
					//Check if there are enough players in the lobby from the team
					let playersInLobby = 0;
					for (let j = 0; j < teams[i].length; j++) {
						if (lobby.playersById[teams[i][j].osuUserId.toString()]) {
							playersInLobby++;
						}
					}

					//If not enough players in the lobby invite the missing players
					if (playersInLobby < parseInt(args[9])) {
						for (let j = 0; j < teams[i].length; j++) {
							if (!lobby.playersById[teams[i][j].osuUserId.toString()]) {
								await channel.sendMessage(`!mp invite #${teams[i][j].osuUserId}`);
								await messageUserWithRetries(client, teams[i][j].user, args[1], `Your match is about to start. Please join as soon as possible. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);

								client.shard.broadcastEval(async (c, { channelId, message }) => {
									const channel = c.channels.cache.get(channelId);
									if (channel) {
										await channel.send(message);
									}
								}, { context: { channelId: args[1], message: `<@${teams[i][j].userId}> The lobby is about to start. I've sent you another invite.` } });
							}
						}
					}
				}
			}
		});

		lobby.on('playerJoined', async (obj) => {
			// eslint-disable-next-line no-undef
			process.send(`osuuser ${obj.player.user.id}}`);

			if (!playerIds.includes(obj.player.user.id.toString())) {
				channel.sendMessage(`!mp kick #${obj.player.user.id}`);
			} else if (lobbyStatus === 'Joining phase') {
				await lobby.updateSettings();
				let allTeamsJoined = true;
				for (let i = 0; i < teams.length && allTeamsJoined; i++) {
					let playersInLobby = 0;
					for (let j = 0; j < teams[i].length; j++) {
						if (lobby.playersById[teams[i][j].osuUserId.toString()]) {
							playersInLobby++;
						}
					}

					if (playersInLobby < parseInt(args[9])) {
						allTeamsJoined = false;
					}
				}

				if (allTeamsJoined) {
					lobbyStatus = 'Waiting for start';

					let tries = 0;
					while (lobby._beatmapId != dbMaps[mapIndex].beatmapId && tries < 25) {
						await channel.sendMessage('!mp abort');
						await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
						await pause(5000);
						tries++;
					}
					//Check mods and set them if needed
					let modBits = 0;
					if (lobby.mods) {
						for (let i = 0; i < lobby.mods.length; i++) {
							modBits += lobby.mods[i].enumValue;
						}
					}
					while (parseInt(dbMaps[mapIndex].mods) + noFail !== modBits) {
						await channel.sendMessage(`!mp mods ${parseInt(dbMaps[mapIndex].mods) + noFail}`);
						await pause(5000);
						modBits = 0;
						if (lobby.mods) {
							for (let i = 0; i < lobby.mods.length; i++) {
								modBits += lobby.mods[i].enumValue;
							}
						}
					}

					if (dbMaps[mapIndex].freeMod) {
						await channel.sendMessage(`!mp mods ${parseInt(dbMaps[mapIndex].mods) + noFail} freemod`);
						await channel.sendMessage(args[8]);
					}

					await channel.sendMessage('Everyone please ready up!');
					await channel.sendMessage('!mp timer 120');
				}
			}

			//Add all players that belong into the lobby and have joined once already here
			for (let i = 0; i < teams.length; i++) {
				let playersInLobby = 0;
				for (let j = 0; j < teams[i].length; j++) {
					if (lobby.playersById[teams[i][j].osuUserId.toString()]) {
						playersInLobby++;
					}
				}

				if (playersInLobby >= parseInt(args[9])) {
					if (!teamsThatDontSeemToForfeit.includes(teams[i].join(','))) {
						teamsThatDontSeemToForfeit.push(teams[i].join(','));
					}
				}
			}
		});

		lobby.on('allPlayersReady', async () => {
			await lobby.updateSettings();
			let teamsInLobby = 0;
			for (let i = 0; i < teams.length; i++) {
				let playersInLobby = 0;
				for (let j = 0; j < teams[i].length; j++) {
					if (lobby.playersById[teams[i][j].osuUserId.toString()]) {
						playersInLobby++;
					}
				}

				if (playersInLobby >= parseInt(args[9])) {
					teamsInLobby++;
				}
			}

			//Check that all players are in the lobby that previously joined
			if (lobbyStatus === 'Waiting for start' && teamsInLobby >= teamsThatDontSeemToForfeit.length) {
				await channel.sendMessage('!mp start 10');

				lobbyStatus === 'Map being played';
			}
		});

		// eslint-disable-next-line no-unused-vars
		lobby.on('matchFinished', async (results) => {
			for (let i = 0; i < results.length; i++) {
				// eslint-disable-next-line no-undef
				process.send(`osuuser ${results[i].player.user.id}}`);
			}

			mapIndex++;
			if (mapIndex < dbMaps.length) {
				lobbyStatus = 'Waiting for start';

				let tries = 0;
				while (lobby._beatmapId != dbMaps[mapIndex].beatmapId && tries < 25) {
					await channel.sendMessage('!mp abort');
					await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
					await pause(5000);
					await lobby.updateSettings();
					tries++;
				}
				//Check mods and set them if needed
				let modBits = 0;
				if (lobby.mods) {
					for (let i = 0; i < lobby.mods.length; i++) {
						modBits += lobby.mods[i].enumValue;
					}
				}
				while (parseInt(dbMaps[mapIndex].mods) + noFail !== modBits) {
					await channel.sendMessage(`!mp mods ${parseInt(dbMaps[mapIndex].mods) + noFail}`);
					await pause(5000);
					await lobby.updateSettings();
					modBits = 0;
					if (lobby.mods) {
						for (let i = 0; i < lobby.mods.length; i++) {
							modBits += lobby.mods[i].enumValue;
						}
					}
				}

				if (dbMaps[mapIndex].freeMod) {
					await channel.sendMessage(`!mp mods ${parseInt(dbMaps[mapIndex].mods) + noFail} freemod`);
					await channel.sendMessage(args[8]);
				}

				await channel.sendMessage('Everyone please ready up!');
				await channel.sendMessage('!mp timer 120');
			} else {
				lobbyStatus = 'Lobby finished';

				await channel.sendMessage('Thank you everyone for playing! The lobby will automatically close in one minute.');
				await pause(60000);
				await channel.sendMessage('!mp close');
				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				// eslint-disable-next-line no-undef
				process.send('osu!API');
				osuApi.getMatch({ mp: lobby.id })
					.then(async (match) => {
						saveOsuMultiScores(match, client);
					})
					.catch(() => {
						//Nothing
					});

				let players = args[3].replaceAll('|', ',').split(',');
				let dbPlayers = [];
				for (let j = 0; j < players.length; j++) {
					logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 5');
					const dbDiscordUser = await DBDiscordUsers.findOne({
						where: { id: players[j] }
					});
					dbPlayers.push(dbDiscordUser);
				}

				// Sort players by id desc
				dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

				players = args[3];
				for (let j = 0; j < dbPlayers.length; j++) {
					players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
				}

				// Attach match log
				let attachment = new Discord.AttachmentBuilder(`./matchLogs/${channel.lobby.id}.txt`, { name: `${channel.lobby.id}.txt` });

				let user = await client.users.fetch(args[0]);
				user.send({ content: `The scheduled Qualifier match has finished. <https://osu.ppy.sh/mp/${lobby.id}>\nMatch: \`${args[5]}\`\nScheduled players: ${players}\nMappool: ${args[6]}`, files: [attachment] });

				return await channel.leave();

			}
		});
	},
};

async function messageUserWithRetries(client, user, channelId, content) {
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
					client.shard.broadcastEval(async (c, { channelId, message }) => {
						const channel = await c.channels.cache.get(channelId);
						if (channel) {
							channel.send(message);
						}
					}, { context: { channelId: channelId, message: `<@${user.id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!` } });
				} else {
					await pause(2500);
				}
			} else {
				i = Infinity;
				console.error(error);
			}
		}
	}
}