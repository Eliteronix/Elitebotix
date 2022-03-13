const { DBDiscordUsers, DBOsuBeatmaps } = require('../dbObjects');
const { pause, saveOsuMultiScores, logDatabaseQueries } = require('../utils');
const osu = require('node-osu');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let channel;
		let discordChannel = await client.channels.fetch(args[1]);

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
				break;
			} catch (error) {
				if (i === 4) {
					let players = args[3].split(',');
					let dbPlayers = [];
					for (let j = 0; j < players.length; j++) {
						logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 1');
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayers.push(dbDiscordUser.osuName);
					}
					processQueueEntry.destroy();
					let user = await client.users.fetch(args[0]);
					user.send(`I am having issues creating the lobby and the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayers.join(', ')}\nMappool: ${args[6]}`);
					return discordChannel.send(`I am having issues creating the lobby and the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayers.join(', ')}\nMappool: ${args[6]}`);
				} else {
					await pause(10000);
				}
			}
		}

		let players = args[3].split(',');
		let dbPlayers = [];
		let playerIds = [];
		let discordIds = [];
		let users = [];
		for (let i = 0; i < players.length; i++) {
			logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 2');
			const dbDiscordUser = await DBDiscordUsers.findOne({
				where: { id: players[i] }
			});
			dbPlayers.push(dbDiscordUser);
			playerIds.push(dbDiscordUser.osuUserId);
			discordIds.push(dbDiscordUser.userId);
			const user = await client.users.fetch(dbDiscordUser.userId);
			users.push(user);
		}

		const lobby = channel.lobby;

		const password = Math.random().toString(36).substring(8);

		await lobby.setPassword(password);
		await channel.sendMessage('!mp map 975342 0');
		await channel.sendMessage(`!mp set 0 ${args[7]} ${dbPlayers.length}`);
		let lobbyStatus = 'Joining phase';
		let mapIndex = 0;
		let maps = args[2].split(',');
		let dbMaps = [];
		for (let i = 0; i < maps.length; i++) {
			logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBOsuBeatmaps');
			const dbOsuBeatmap = await DBOsuBeatmaps.findOne({
				where: { id: maps[i] }
			});
			dbMaps.push(dbOsuBeatmap);
		}


		for (let i = 0; i < users.length; i++) {
			await channel.sendMessage(`!mp invite #${dbPlayers[i].osuUserId}`);
			await messageUserWithRetries(client, users[i], args[1], `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
		}
		discordChannel.send(`<@${discordIds.join('>, <@')}> your match has been created. You have been invited ingame by \`Eliteronix\` and also got a DM as a backup.`);

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

		let playersThatDontSeemToForfeit = [];

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
					processQueueEntry.destroy();

					let dbPlayerNames = [];
					for (let j = 0; j < players.length; j++) {
						logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 3');
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayerNames.push(dbDiscordUser.osuName);
					}

					let user = await client.users.fetch(args[0]);
					user.send(`The scheduled Qualifier has been aborted because no one showed up. <https://osu.ppy.sh/mp/${lobby.id}>\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayerNames.join(', ')}\nMappool: ${args[6]}`);
					return await channel.leave();
				}

				lobbyStatus = 'Waiting for start';

				while (lobby._beatmapId != dbMaps[mapIndex].beatmapId) {
					await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
					await pause(5000);
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
				await channel.sendMessage('Everyone please ready up!');
				await channel.sendMessage('!mp timer 120');
				mapIndex++;
			} else if (matchStartingTime < now && !secondRoundOfInvitesSent && lobbyStatus === 'Joining phase') {
				secondRoundOfInvitesSent = true;
				await lobby.updateSettings();
				for (let i = 0; i < users.length; i++) {
					if (!lobby.playersById[dbPlayers[i].osuUserId.toString()]) {
						await channel.sendMessage(`!mp invite #${dbPlayers[i].osuUserId}`);
						await messageUserWithRetries(client, users[i], args[1], `Your match is about to start. Please join as soon as possible. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
						discordChannel.send(`<@${dbPlayers[i].userId}> The lobby is about to start. I've sent you another invite.`);
					}
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
					await channel.sendMessage('Everyone please ready up!');
					await channel.sendMessage('!mp timer 120');
					mapIndex++;
				}
			}

			//Add all players that belong into the lobby and have joined once already here
			if (playerIds.includes(obj.player.user.id.toString()) && !playersThatDontSeemToForfeit.includes(obj.player.user.id.toString())) {
				playersThatDontSeemToForfeit.push(obj.player.user.id.toString());
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

			//Check that all players are in the lobby that previously joined
			if (lobbyStatus === 'Waiting for start' && playersInLobby >= playersThatDontSeemToForfeit.length) {
				await channel.sendMessage('!mp start 10');

				lobbyStatus === 'Map being played';
			}
		});

		// eslint-disable-next-line no-unused-vars
		lobby.on('matchFinished', async (results) => {
			if (mapIndex < dbMaps.length) {
				lobbyStatus = 'Waiting for start';

				while (lobby._beatmapId != dbMaps[mapIndex].beatmapId) {
					await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
					await pause(5000);
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
				await channel.sendMessage('Everyone please ready up!');
				await channel.sendMessage('!mp timer 120');
				mapIndex++;
			} else {
				lobbyStatus = 'Lobby finished';

				await channel.sendMessage('Thank you everyone for playing! The lobby will automatically close in one minute.');
				await pause(60000);
				await channel.sendMessage('!mp close');
				processQueueEntry.destroy();
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

				let dbPlayerNames = [];
				for (let j = 0; j < players.length; j++) {
					logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 4');
					const dbDiscordUser = await DBDiscordUsers.findOne({
						where: { id: players[j] }
					});
					dbPlayerNames.push(dbDiscordUser.osuName);
				}

				let user = await client.users.fetch(args[0]);
				user.send(`The scheduled Qualifier match has finished. <https://osu.ppy.sh/mp/${lobby.id}>\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayerNames.join(', ')}\nMappool: ${args[6]}`);

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
					const channel = await client.channels.fetch(channelId);
					channel.send(`<@${user.id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
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