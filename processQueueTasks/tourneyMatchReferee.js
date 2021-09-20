const { DBDiscordUsers, DBOsuBeatmaps } = require('../dbObjects');
const { pause } = require('../utils');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
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
				break;
			} catch (error) {
				if (i === 4) {
					let players = args[3].split(',');
					let dbPlayers = [];
					for (let j = 0; j < players.length; j++) {
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayers.push(dbDiscordUser.osuName);
					}
					let user = await client.users.fetch(args[0]);
					user.send(`I am having issues creating the lobby and the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayers.join(', ')}\nMappool: ${args[2]}`);
					let discordChannel = await client.channels.fetch(args[1]);
					return discordChannel.send(`I am having issues creating the lobby and the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayers.join(', ')}\nMappool: ${args[2]}`);
				} else {
					await pause(10000);
				}
			}
		}

		let players = args[3].split(',');
		let dbPlayers = [];
		let playerIds = [];
		let users = [];
		for (let i = 0; i < players.length; i++) {
			const dbDiscordUser = await DBDiscordUsers.findOne({
				where: { id: players[i] }
			});
			dbPlayers.push(dbDiscordUser);
			playerIds.push(dbDiscordUser.osuUserId);
			const user = await client.users.fetch(dbDiscordUser.userId);
			users.push(user);
		}

		const lobby = channel.lobby;

		const password = Math.random().toString(36).substring(8);

		await lobby.setPassword(password);
		await channel.sendMessage('!mp map 975342 0');
		await channel.sendMessage(`!mp set 0 3 ${dbPlayers.length}`);
		let lobbyStatus = 'Joining phase';
		let mapIndex = 0;
		let maps = args[2].split(',');
		let dbMaps = [];
		for (let i = 0; i < maps.length; i++) {
			const dbOsuBeatmap = await DBOsuBeatmaps.findOne({
				where: { id: maps[i] }
			});
			dbMaps.push(dbOsuBeatmap);
		}


		for (let i = 0; i < users.length; i++) {
			await channel.sendMessage(`!mp invite #${dbPlayers[i].osuUserId}`);
			await messageUserWithRetries(client, users[i], args[1], `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
		}
		//Add timers to 10 minutes after the match and also during the scheduled time send another message

		// channel.on('message', async (msg) => {
		// 	let now = new Date();
		// 	if (msg.user.ircUsername === 'BanchoBot' && msg.message === 'Countdown finished') {
		// 		//Banchobot countdown finished
		// 		if (lobbyStatus === 'Joining phase') {
		// 			await lobby.updateSettings();
		// 			let allPlayersReady = true;
		// 			for (let i = 0; i < 16; i++) {
		// 				let player = lobby.slots[i];
		// 				if (player && player.state !== require('bancho.js').BanchoLobbyPlayerStates.Ready) {
		// 					allPlayersReady = false;
		// 				}
		// 			}

		// 			if (allPlayersReady) {
		// 				await channel.sendMessage('!mp start 10');

		// 				lobbyStatus === 'Map being played';
		// 			} else {
		// 				lobbyStatus = 'Waiting for start';

		// 				await channel.sendMessage('Everyone please ready up!');
		// 				await channel.sendMessage('!mp timer 120');
		// 			}
		// 		} else if (lobbyStatus === 'Waiting for start') {
		// 			await channel.sendMessage('!mp start 10');

		// 			lobbyStatus === 'Map being played';
		// 		}
		// 	} else if (timer < now && lobbyStatus === 'Joining phase') {
		// 		lobbyStatus = 'Waiting for start';

		// 		await channel.sendMessage('Everyone please ready up!');
		// 		await channel.sendMessage('!mp timer 120');
		// 	}
		// });

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

					await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
					await channel.sendMessage(`!mp mods ${dbMaps[mapIndex].mods}`);
					mapIndex++;
					await channel.sendMessage('Everyone please ready up!');
					await channel.sendMessage('!mp timer 120');
				}
			}
		});

		// lobby.on('allPlayersReady', async () => {
		// 	await lobby.updateSettings();
		// 	let playersInLobby = 0;
		// 	for (let i = 0; i < 16; i++) {
		// 		if (lobby.slots[i]) {
		// 			playersInLobby++;
		// 		}
		// 	}
		// 	if (lobbyStatus === 'Waiting for start' && playersInLobby === players.length) {
		// 		await channel.sendMessage('!mp start 10');

		// 		lobbyStatus === 'Map being played';
		// 	}
		// });
		// lobby.on('matchFinished', async (results) => {
		// 	//Set array for how many players should get through maximum
		// 	let expectedPlayers = [];
		// 	expectedPlayers.push(16); //Map [0] Qualifiers -> 16
		// 	expectedPlayers.push(14); //Map [1] 16 -> 14
		// 	expectedPlayers.push(12); //Map [2] 14 -> 12
		// 	expectedPlayers.push(10); //Map [3] 12 -> 10
		// 	expectedPlayers.push(8); //Map [4] 10 -> 8 --DT
		// 	expectedPlayers.push(6); //Map [5] 8 -> 6
		// 	expectedPlayers.push(5); //Map [6] 6 -> 5
		// 	expectedPlayers.push(4); //Map [7] 5 -> 4
		// 	expectedPlayers.push(3); //Map [8] 4 -> 3 --DT
		// 	expectedPlayers.push(2); //Map [9] 3 -> 2
		// 	expectedPlayers.push(1); //Map [10] 2 -> 1

		// 	//Calculate the amount of knockouts needed
		// 	let knockoutNumber = expectedPlayers[mapIndex - 1] - expectedPlayers[mapIndex];
		// 	//Set the amount to 1 if less players are in the lobby
		// 	if (players.length < expectedPlayers[mapIndex - 1]) {
		// 		knockoutNumber = 1;
		// 	}

		// 	let knockedOutPlayers = 0;
		// 	let knockedOutPlayerNames = '';
		// 	let knockedOutPlayerIds = [];
		// 	//Remove players that didn't play
		// 	for (let i = 0; i < players.length; i++) {
		// 		let submittedScore = false;
		// 		for (let j = 0; j < results.length; j++) {
		// 			if (results[j].player.user.id.toString() === players[i].osuUserId) {
		// 				submittedScore = true;
		// 			}
		// 		}

		// 		if (!submittedScore) {
		// 			knockedOutPlayers++;
		// 			knockedOutPlayerIds.push(players[i].osuUserId);
		// 			if (knockedOutPlayerNames === '') {
		// 				knockedOutPlayerNames = `${players[i].osuName}`;
		// 			} else {
		// 				knockedOutPlayerNames = `${knockedOutPlayerNames}, ${players[i].osuName}`;
		// 			}

		// 			if (!isFirstRound) {
		// 				assignKnockoutPoints(client, players[i], startingPlayers, players.length, mapIndex);
		// 			}
		// 			players.splice(i, 1);
		// 			users.splice(i, 1);
		// 			i--;
		// 		}
		// 	}

		// 	quicksort(results);

		// 	const playersUsers = sortPlayersByResultsBanchojs(results, players, users);

		// 	players = playersUsers[0];
		// 	users = playersUsers[1];

		// 	playerIds = [];
		// 	for (let i = 0; i < players.length; i++) {
		// 		playerIds.push(players[i].osuUserId);
		// 	}

		// 	//Remove as many players as needed if there weren't enough players inactive
		// 	if (knockedOutPlayers < knockoutNumber) {
		// 		for (let i = 0; i < players.length && knockedOutPlayers < knockoutNumber; i++) {
		// 			assignKnockoutPoints(client, players[i], startingPlayers, players.length, mapIndex);
		// 			if (knockedOutPlayerNames === '') {
		// 				knockedOutPlayerNames = `\`${players[i].osuName}\``;
		// 			} else {
		// 				knockedOutPlayerNames = `${knockedOutPlayerNames}, \`${players[i].osuName}\``;
		// 			}
		// 			knockedOutPlayers++;
		// 			knockedOutPlayerIds.push(players[i].osuUserId);
		// 			results.splice(i, 1);
		// 			players.splice(i, 1);
		// 			users.splice(i, 1);
		// 			i--;
		// 		}
		// 	}

		// 	await channel.sendMessage(`Knocked out players this round: ${knockedOutPlayerNames}`);
		// 	await pause(30000);

		// 	for (let i = 0; i < knockedOutPlayerIds.length; i++) {
		// 		await channel.sendMessage(`!mp kick #${knockedOutPlayerIds[i]}`);
		// 	}

		// 	if (players.length === 1) {
		// 		lobbyStatus = 'Lobby finished';

		// 		await channel.sendMessage(`Congratulations ${players[0].osuName}! You won todays knockout lobby. Come back tomorrow for another round!`);
		// 		assignKnockoutPoints(client, players[0], startingPlayers, players.length, mapIndex + 1);
		// 		await pause(30000);
		// 		await channel.sendMessage('!mp close');
		// 		// eslint-disable-next-line no-undef
		// 		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// 			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		// 			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		// 			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		// 			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		// 		});

		// 		osuApi.getMatch({ mp: lobby.id })
		// 			.then(async (match) => {
		// 				saveOsuMultiScores(match);
		// 			})
		// 			.catch(() => {
		// 				//Nothing
		// 			});
		// 		return await channel.leave();

		// 	} else if (players.length === 0) {
		// 		lobbyStatus = 'Lobby finished';
		// 		await channel.sendMessage('!mp close');
		// 		// eslint-disable-next-line no-undef
		// 		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// 			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		// 			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		// 			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		// 			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		// 		});

		// 		osuApi.getMatch({ mp: lobby.id })
		// 			.then(async (match) => {
		// 				saveOsuMultiScores(match);
		// 			})
		// 			.catch(() => {
		// 				//Nothing
		// 			});
		// 		return await channel.leave();
		// 	} else {
		// 		movePlayersIntoFirstSlots(channel, lobby, players);
		// 		mapIndex++;
		// 		let skipped = false;
		// 		//Increases knockoutmap number to start/continue with harder maps and give more points
		// 		while (12 - players.length > mapIndex) {
		// 			mapIndex++;
		// 			skipped = true;
		// 		}

		// 		if (skipped) {
		// 			await channel.sendMessage('One or more maps have been skipped due to a lower amount of players.');
		// 		}

		// 		doubleTime = '';
		// 		if (mapIndex === 4 || mapIndex === 8) {
		// 			doubleTime = ' DT';
		// 		}

		// 		await channel.sendMessage(`!mp map ${mappool[mapIndex].id} 0`);
		// 		if (mapIndex === 4 || mapIndex === 5 || mapIndex === 8 || mapIndex === 9) {
		// 			await channel.sendMessage(`!mp mods FreeMod${doubleTime}`);
		// 		}

		// 		lobbyStatus = 'Waiting for start';
		// 		await channel.sendMessage('!mp timer 120');

		// 		isFirstRound = false;
		// 	}
		// });

		processQueueEntry.destroy();
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