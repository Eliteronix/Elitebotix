const osu = require('node-osu');
const { getMods, humanReadable, createMOTDAttachment, getAccuracy, pause, saveOsuMultiScores, logMatchCreation, addMatchMessage, logOsuAPICalls } = require('../utils.js');
const { assignKnockoutPoints } = require('./givePointsToPlayers.js');
const { logBroadcastEval } = require('../config.json');

module.exports = {
	knockoutLobby: async function (client, bancho, bracketName, mappool, lobbyNumber, players, users, isFirstRound, scoreversion) {
		//Map [0] has been played already
		//Send message about which lobby the player is in and who he / she is against
		await sendLobbyMessages(client, lobbyNumber, players, users);

		//Case of just one player
		if (players.length === 1) {
			if (lobbyNumber !== 'custom') {
				assignKnockoutPoints(client, players[0], players, 1, 11);
			}
			return await messageUserWithRetries(client, users[0], 'You will win your lobby by default.\nCome back tomorrow for another competition!');
		}

		let startingPlayers = players;

		let playerIds = [];
		for (let i = 0; i < startingPlayers.length; i++) {
			playerIds.push(startingPlayers[i].osuUserId);
		}

		let mapIndex = 1;
		//Increases knockoutmap number to start/continue with harder maps and give more points
		while (12 - players.length > mapIndex && (lobbyNumber === 1 || lobbyNumber === 'custom')) {
			mapIndex++;
		}

		let doubleTime = '';
		if (mapIndex === 4 || mapIndex === 8) {
			doubleTime = ' DT';
		}

		//Calculate start and end date for custom MOTDs
		let plannedStartDate = new Date();
		let startIndex = 1;
		//set startIndex to something else if below 11 players (below all maps played)
		if (players.length < 11) {
			startIndex = 12 - players.length;
		}

		let gameLength = 180;

		//Calculate match time
		for (let i = startIndex; i < mappool.length; i++) {
			gameLength = gameLength + 120 + parseInt(mappool[i].length.total);
		}

		let plannedEndDate = new Date();
		plannedEndDate.setUTCFullYear(plannedStartDate.getUTCFullYear());
		plannedEndDate.setUTCMonth(plannedStartDate.getUTCMonth());
		plannedEndDate.setUTCDate(plannedStartDate.getUTCDate());
		plannedEndDate.setUTCHours(plannedStartDate.getUTCHours());
		plannedEndDate.setUTCMinutes(plannedStartDate.getUTCMinutes());
		plannedEndDate.setUTCSeconds(0);
		plannedEndDate.setUTCSeconds(gameLength);

		let lobbyStatus = 'Joining phase';

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
				channel = await bancho.createLobby(`MOTD: (${bracketName}) vs (Lobby #${lobbyNumber})`);
				client.otherMatches.push(parseInt(channel.lobby.id));
				break;
			} catch (error) {
				if (i === 2) {
					//Start the first knockout map in solo as a fallback
					return knockoutMap(client, mappool, lobbyNumber, startingPlayers, players, users, 1, isFirstRound);
				} else {
					await pause(10000);
				}
			}
		}

		channel.on('message', async (msg) => {
			process.send(`osuuser ${msg.user.id}}`);

			addMatchMessage(lobby.id, matchMessages, msg.user.ircUsername, msg.message);
		});

		const lobby = channel.lobby;
		logMatchCreation(client, lobby.name, lobby.id);

		const password = Math.random().toString(36).substring(8);

		let matchMessages = [];
		await lobby.setPassword(password);
		await channel.sendMessage('!mp addref Eliteronix');
		await channel.sendMessage('!mp lock');
		await channel.sendMessage(`!mp set 0 ${scoreversion} ${players.length}`);
		await pause(60000);

		while (lobby._beatmapId != mappool[mapIndex].id) {
			await channel.sendMessage('!mp abort');
			await channel.sendMessage(`!mp map ${mappool[mapIndex].id} 0`);
			await pause(5000);
		}

		//Check mods and set them if needed
		if (mapIndex === 4 || mapIndex === 8) {
			while (!lobby.mods || lobby.mods && lobby.mods.length === 0 || lobby.mods && lobby.mods[0].shortMod !== 'dt') {
				await channel.sendMessage(`!mp mods FreeMod${doubleTime}`);
				await pause(5000);
			}
		} else {
			while (lobby.mods || lobby.mods && lobby.mods.length !== 0) {
				await channel.sendMessage(`!mp mods FreeMod${doubleTime}`);
				await pause(5000);
			}
		}

		if (process.env.SERVER !== 'Dev' && lobbyNumber !== 'custom') {
			try {
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting MOTD/knockoutLobby.js share match link to shards...');
				}

				client.shard.broadcastEval(async (c, { message }) => {
					const announceChannel = await c.channels.cache.get('893215604503351386');
					if (announceChannel) {
						await announceChannel.send(message);
					}
				}, { context: { message: `Lobby #${lobbyNumber}: <https://osu.ppy.sh/mp/${lobby.id}>` } });
			} catch (error) {
				console.error('MOTD/knockoutLobby.js', error);
			}
		}

		for (let i = 0; i < users.length; i++) {
			await channel.sendMessage(`!mp invite #${players[i].osuUserId}`);
			await messageUserWithRetries(client, users[i], `Your Knockoutlobby has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
		}

		await channel.sendMessage('!mp timer 180');
		let timer = new Date();
		timer.setMinutes(timer.getMinutes() + 4);

		let waitedForMapdownload = false;

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
						//Calculate the amount of knockouts needed
						let knockoutNumber = calculateKnockoutNumber(players, mapIndex);
						await channel.sendMessage(`${knockoutNumber} player(s) will be knocked out.`);
						await channel.sendMessage('!mp timer 60');
					}
				} else if (lobbyStatus === 'Waiting for start') {
					await lobby.updateSettings();

					let playerHasNoMap = false;
					for (let i = 0; i < 16; i++) {
						let player = lobby.slots[i];
						if (player && player.state === require('bancho.js').BanchoLobbyPlayerStates.NoMap) {
							playerHasNoMap = true;
						}
					}

					if (waitedForMapdownload || !playerHasNoMap) {
						//just start; we waited another minute already
						waitedForMapdownload = false;
						await channel.sendMessage('!mp start 10');
						lobbyStatus === 'Map being played';
					} else {
						waitedForMapdownload = true;
						await channel.sendMessage('A player is missing the map. Waiting only 1 minute longer.');
						await channel.sendMessage('!mp timer 60');
					}

				}
			} else if (timer < now && lobbyStatus === 'Joining phase') {
				lobbyStatus = 'Waiting for start';

				await channel.sendMessage('Everyone please ready up!');
				//Calculate the amount of knockouts needed
				let knockoutNumber = calculateKnockoutNumber(players, mapIndex);
				await channel.sendMessage(`${knockoutNumber} player(s) will be knocked out.`);
				await channel.sendMessage('!mp timer 60');
			}
		});

		lobby.on('playerJoined', async (obj) => {
			process.send(`osuuser ${obj.player.user.id}}`);

			if (!playerIds.includes(obj.player.user.id.toString())) {
				channel.sendMessage(`!mp kick #${obj.player.user.id}`);
			} else if (lobbyStatus === 'Joining phase') {
				let allPlayersJoined = true;
				for (let i = 0; i < players.length && allPlayersJoined; i++) {
					if (!lobby.playersById[players[i].osuUserId.toString()]) {
						allPlayersJoined = false;
					}
				}
				if (allPlayersJoined) {
					lobbyStatus = 'Waiting for start';

					await channel.sendMessage('Everyone please ready up!');
					//Calculate the amount of knockouts needed
					let knockoutNumber = calculateKnockoutNumber(players, mapIndex);
					await channel.sendMessage(`${knockoutNumber} player(s) will be knocked out.`);
					await channel.sendMessage('!mp timer 60');
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
			if (lobbyStatus === 'Waiting for start' && playersInLobby === players.length) {
				await channel.sendMessage('!mp start 10');

				lobbyStatus === 'Map being played';
			}
		});
		lobby.on('matchFinished', async (results) => {
			for (let i = 0; i < results.length; i++) {
				process.send(`osuuser ${results[i].player.user.id}}`);
			}

			//Calculate the amount of knockouts needed
			let knockoutNumber = calculateKnockoutNumber(players, mapIndex);

			let knockedOutPlayers = 0;
			let knockedOutPlayerNames = '';
			let knockedOutPlayerIds = [];
			//Remove players that didn't play
			for (let i = 0; i < players.length; i++) {
				let submittedScore = false;
				for (let j = 0; j < results.length; j++) {
					if (results[j].player.user.id.toString() === players[i].osuUserId) {
						submittedScore = true;
					}
				}

				if (!submittedScore) {
					knockedOutPlayers++;
					knockedOutPlayerIds.push(players[i].osuUserId);
					if (knockedOutPlayerNames === '') {
						knockedOutPlayerNames = `${players[i].osuName}`;
					} else {
						knockedOutPlayerNames = `${knockedOutPlayerNames}, ${players[i].osuName}`;
					}

					if (!isFirstRound && lobbyNumber !== 'custom') {
						assignKnockoutPoints(client, players[i], startingPlayers, players.length, mapIndex);
					}
					players.splice(i, 1);
					users.splice(i, 1);
					i--;
				}
			}

			results.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

			const playersUsers = sortPlayersByResultsBanchojs(results, players, users);

			players = playersUsers[0];
			users = playersUsers[1];

			playerIds = [];
			for (let i = 0; i < players.length; i++) {
				playerIds.push(players[i].osuUserId);
			}

			//Remove as many players as needed if there weren't enough players inactive
			if (knockedOutPlayers < knockoutNumber) {
				for (let i = 0; i < players.length && knockedOutPlayers < knockoutNumber; i++) {
					if (lobbyNumber !== 'custom') {
						assignKnockoutPoints(client, players[i], startingPlayers, players.length, mapIndex);
					}
					if (knockedOutPlayerNames === '') {
						knockedOutPlayerNames = `\`${players[i].osuName}\``;
					} else {
						knockedOutPlayerNames = `${knockedOutPlayerNames}, \`${players[i].osuName}\``;
					}
					knockedOutPlayers++;
					knockedOutPlayerIds.push(players[i].osuUserId);
					results.splice(i, 1);
					players.splice(i, 1);
					users.splice(i, 1);
					i--;
				}
			}

			await channel.sendMessage(`Knocked out players this round: ${knockedOutPlayerNames}`);
			await pause(15000);

			for (let i = 0; i < knockedOutPlayerIds.length; i++) {
				await channel.sendMessage(`!mp kick #${knockedOutPlayerIds[i]}`);
			}

			if (players.length === 1) {
				lobbyStatus = 'Lobby finished';

				if (lobbyNumber === 'custom') {
					await channel.sendMessage(`Congratulations ${players[0].osuName}! You won the knockout lobby. Feel free to sign up for another round!`);
				} else {
					await channel.sendMessage(`Congratulations ${players[0].osuName}! You won todays knockout lobby. Come back tomorrow for another round!`);
					assignKnockoutPoints(client, players[0], startingPlayers, players.length, mapIndex + 1);
				}
				await pause(15000);
				await channel.sendMessage('!mp close');

				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				logOsuAPICalls('MOTD/knockoutLobby.js Lobby finished 1 player');
				osuApi.getMatch({ mp: lobby.id })
					.then(async (match) => {
						saveOsuMultiScores(match, client);
					})
					.catch(() => {
						//Nothing
					});
				return await channel.leave();

			} else if (players.length === 0) {
				lobbyStatus = 'Lobby finished';
				await channel.sendMessage('!mp close');

				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				logOsuAPICalls('MOTD/knockoutLobby.js Lobby finished 0 players');
				osuApi.getMatch({ mp: lobby.id })
					.then(async (match) => {
						saveOsuMultiScores(match, client);
					})
					.catch(() => {
						//Nothing
					});
				return await channel.leave();
			} else {
				movePlayersIntoFirstSlots(channel, lobby, players, scoreversion);
				mapIndex++;

				if (lobbyNumber === 1 || lobbyNumber === 'custom') {
					let skipped = false;
					//Increases knockoutmap number to start/continue with harder maps and give more points
					while (12 - players.length > mapIndex) {
						mapIndex++;
						skipped = true;
					}

					if (skipped) {
						await channel.sendMessage('One or more maps have been skipped due to a lower amount of players.');
					}
				}

				doubleTime = '';
				if (mapIndex === 4 || mapIndex === 8) {
					doubleTime = ' DT';
				}

				while (lobby._beatmapId != mappool[mapIndex].id) {
					await channel.sendMessage('!mp abort');
					await channel.sendMessage(`!mp map ${mappool[mapIndex].id} 0`);
					await pause(5000);
				}

				//Check mods and set them if needed
				if (mapIndex === 4 || mapIndex === 8) {
					while (!lobby.mods || lobby.mods && lobby.mods.length === 0 || lobby.mods && lobby.mods[0].shortMod !== 'dt') {
						await channel.sendMessage(`!mp mods FreeMod${doubleTime}`);
						await pause(5000);
					}
				} else {
					while (lobby.mods || lobby.mods && lobby.mods.length !== 0) {
						await channel.sendMessage(`!mp mods FreeMod${doubleTime}`);
						await pause(5000);
					}
				}

				lobbyStatus = 'Waiting for start';
				//Calculate the amount of knockouts needed
				let knockoutNumber = calculateKnockoutNumber(players, mapIndex);
				await channel.sendMessage(`${knockoutNumber} player(s) will be knocked out.`);
				await channel.sendMessage('!mp timer 60');

				isFirstRound = false;
			}
		});
	}
};

async function sendLobbyMessages(client, lobbyNumber, players, users) {
	let playerList = '';

	for (let i = 0; i < players.length; i++) {
		if (i === 0) {
			playerList = `\`${players[i].osuName}\``;
		} else {
			playerList = `${playerList}, \`${players[i].osuName}\``;
		}
	}

	let data = [];
	data.push(`You are in lobby #${lobbyNumber}`);
	data.push('Your lobby consists of the following players:');
	data.push(playerList);
	for (let i = 0; i < users.length; i++) {
		await messageUserWithRetries(client, users[i], data.join('\n'));
	}
}

async function knockoutMap(client, mappool, lobbyNumber, startingPlayers, players, users, mapIndex, isFirstRound) {
	if (lobbyNumber === 1 || lobbyNumber === 'custom') {
		let skipped = false;
		//Increases knockoutmap number to start/continue with harder maps and give more points
		while (12 - players.length > mapIndex) {
			mapIndex++;
			skipped = true;
		}

		if (skipped) {
			for (let i = 0; i < users.length; i++) {
				await messageUserWithRetries(client, users[i], 'One or more knockout maps have been skipped due to a lower amount of players left in the lobby.');
			}
		}
	}

	//Set array for how many players should get through maximum
	let expectedPlayers = [];
	expectedPlayers.push(16); //Map [0] Qualifiers -> 16
	expectedPlayers.push(14); //Map [1] 16 -> 14
	expectedPlayers.push(12); //Map [2] 14 -> 12
	expectedPlayers.push(10); //Map [3] 12 -> 10
	expectedPlayers.push(8); //Map [4] 10 -> 8 --DT
	expectedPlayers.push(6); //Map [5] 8 -> 6
	expectedPlayers.push(5); //Map [6] 6 -> 5
	expectedPlayers.push(4); //Map [7] 5 -> 4
	expectedPlayers.push(3); //Map [8] 4 -> 3 --DT
	expectedPlayers.push(2); //Map [9] 3 -> 2
	expectedPlayers.push(1); //Map [10] 2 -> 1

	//Calculate the amount of knockouts needed
	let knockoutNumber = expectedPlayers[mapIndex - 1] - expectedPlayers[mapIndex];
	//Set the amount to 1 if less players are in the lobby
	if (players.length < expectedPlayers[mapIndex - 1]) {
		knockoutNumber = 1;
	}

	//Set if it is a doubletime map or not
	let doubleTimeMap = false;

	if (mapIndex === 4 || mapIndex === 8) {
		doubleTimeMap = true;
	}

	//Update the players about the current map
	await sendMapMessages(client, mappool[mapIndex], mapIndex, knockoutNumber, users, doubleTimeMap);
	//wait map + 120 seconds
	setTimeout(async function () {
		//Fetch the results of the map
		let results = await getKnockoutScores(mappool[mapIndex], players, doubleTimeMap);

		results.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

		const playersUsers = sortPlayersByResults(results, players, users);

		players = playersUsers[0];
		users = playersUsers[1];

		let knockedOutPlayers = 0;
		let knockedOutPlayerNames = '';

		//Send leaderboard of that map
		await sendMapLeaderboard(client, results, players, users);

		//Remove players by inactivity
		for (let i = 0; i < results.length; i++) {
			if (results[i].score < 0) {
				if (isFirstRound) {
					for (let j = 0; j < startingPlayers.length; j++) {
						if (startingPlayers[j].userId === players[i].userId) {
							startingPlayers.splice(j, 1);
							j = startingPlayers.length;
						}
					}
				} else {
					if (lobbyNumber !== 'custom') {
						assignKnockoutPoints(client, players[i], startingPlayers, players.length, mapIndex);
					}
				}
				if (lobbyNumber === 'custom') {
					await messageUserWithRetries(client, users[i], `You failed to submit a valid score for the last knockout map and have been removed from the competition.\nReason for the knockout: ${results[i].pp}\nFeel free to sign up for a new round.`);
				} else {
					await messageUserWithRetries(client, users[i], `You failed to submit a valid score for the last knockout map and have been removed from todays competition.\nReason for the knockout: ${results[i].pp}\nCome back tomorrow for another round.`);
				}
				if (knockedOutPlayerNames === '') {
					knockedOutPlayerNames = `\`${players[i].osuName}\``;
				} else {
					knockedOutPlayerNames = `${knockedOutPlayerNames}, \`${players[i].osuName}\``;
				}
				results.splice(i, 1);
				players.splice(i, 1);
				users.splice(i, 1);
				knockedOutPlayers++;
				i--;
			} else {
				i = results.length;
			}
		}

		//Remove as many players as needed if there weren't enough players inactive
		if (knockedOutPlayers < knockoutNumber) {
			for (let i = 0; i < players.length && knockedOutPlayers < knockoutNumber; i++) {
				if (lobbyNumber !== 'custom') {
					assignKnockoutPoints(client, players[i], startingPlayers, players.length, mapIndex);
				}
				await messageUserWithRetries(client, users[i], 'You were knocked out by score. Thank you for playing and come back tomorrow for another round!');
				if (knockedOutPlayerNames === '') {
					knockedOutPlayerNames = `\`${players[i].osuName}\``;
				} else {
					knockedOutPlayerNames = `${knockedOutPlayerNames}, \`${players[i].osuName}\``;
				}
				results.splice(i, 1);
				players.splice(i, 1);
				users.splice(i, 1);
				knockedOutPlayers++;
				i--;
			}
		}

		//Stop round if no one is left
		if (players.length === 0) {
			return;
		}

		//Inform the rest of the players about the knockout for this round
		for (let i = 0; i < users.length; i++) {
			await messageUserWithRetries(client, users[i], `Knocked out players this round:\n${knockedOutPlayerNames}`);
		}

		//Message the winner if only one person is left
		if (players.length === 1) {
			if (lobbyNumber !== 'custom') {
				assignKnockoutPoints(client, players[0], startingPlayers, players.length, mapIndex + 1);
				return await messageUserWithRetries(client, users[0], 'All other players have been knocked out of todays competition which means **you have won!**\nCongratulations, thank you for playing and come back tomorrow for another round.');
			} else {
				return await messageUserWithRetries(client, users[0], 'All other players have been knocked out of the competition which means **you have won!**\nCongratulations, thank you for playing and feel free to sign up for another round.');
			}
		}

		//Start the next round
		knockoutMap(client, mappool, lobbyNumber, startingPlayers, players, users, mapIndex + 1, false);
	}, parseInt(mappool[mapIndex].length.total) * 1000 + 1000 * 120);
}

async function sendMapMessages(client, map, mapIndex, knockoutNumber, users, doubleTime) {
	let data = [];
	//Invisible seperator before the \n to ensure line break
	data.push(`⁣\n${mapIndex}. knockout map (${knockoutNumber} player(s) will be knocked out):`);
	data.push(`You have **${Math.floor(map.length.total / 60) + 2}:${(map.length.total % 60).toString().padStart(2, '0')} minutes** to play the map. **Last submitted score will count (fails included)**.`);
	data.push(`Website: <https://osu.ppy.sh/b/${map.id}> | osu! direct: <osu://b/${map.id}>`);
	const attachment = await createMOTDAttachment(`${mapIndex}. Knockout Map`, map, doubleTime);
	for (let i = 0; i < users.length; i++) {
		await messageUserWithRetries(client, users[i], data.join('\n'), attachment);
	}
}

async function getKnockoutScores(map, players, doubleTime) {
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	//pp field is abused for reason of knockout
	let results = [];
	for (let i = 0; i < players.length; i++) {
		logOsuAPICalls('MOTD/knockoutLobby.js getUserRecent');
		const score = await osuApi.getUserRecent({ u: players[i].osuUserId })
			.then(async (scores) => {
				let mods = getMods(scores[0].raw_mods);
				if (!mods[0]) {
					mods.push('NM');
				}
				scores[0].raw_mods = mods;
				if (mods.includes('NF')) {
					scores[0].score = parseInt(parseInt(scores[0].score) * 1.75);
				}
				if (doubleTime && !mods.includes('DT') && !mods.includes('NC')) {
					scores[0].score = '-1';
					scores[0].pp = 'You didn\'t use DoubleTime on a DoubleTime map.';
					scores[0].raw_mods.push(' - Didn\'t use DT');
				}
				if (scores[0].beatmapId !== map.id) {
					let startOfRound = new Date();
					startOfRound.setUTCSeconds(startOfRound.getUTCSeconds() - parseInt(map.length.total) - 150);
					if (scores[0].raw_date < startOfRound) {
						scores[0].score = '-1';
						scores[0].pp = 'It seems like you didn\'t submit a score in time for the beatmap in this round.';
						scores[0].raw_mods = ['Invalid Score'];
					} else {
						scores[0].score = '-1';
						scores[0].pp = 'It seems like your last submitted score was played on the wrong beatmap. Maybe it was the wrong difficulty?';
						scores[0].raw_mods = ['Invalid Score'];
					}
				}
				return scores[0];
			})
			.catch(err => {
				if (err.message === 'Not found') {
					const score = {
						score: '-1',
						user: {
							name: players[i].osuName,
							id: players[i].osuUserId
						},
						beatmapId: null,
						counts: {
							'50': '-1',
							'100': '-1',
							'300': '-1',
							geki: '-1',
							katu: '-1',
							miss: '-1'
						},
						maxCombo: '-1',
						perfect: true,
						raw_date: '-1',
						rank: 'F',
						pp: 'No scores found from the last 24 hours',
						hasReplay: false,
						raw_mods: ['Invalid Score'],
						beatmap: undefined,
					};

					return score;
				} else {
					console.error(err);
				}
			});

		results.push(score);
	}

	return results;
}

function sortPlayersByResults(results, playersInput, usersInput) {
	let playersOutput = [];
	let usersOutput = [];

	for (let i = 0; i < results.length; i++) {
		for (let j = 0; j < playersInput.length; j++) {
			if (results[i].user.id === playersInput[j].osuUserId) {
				playersOutput.push(playersInput[j]);
				usersOutput.push(usersInput[j]);
				//Close inner loop
				j = playersInput.length;
			}
		}
	}

	let output = [];
	output.push(playersOutput);
	output.push(usersOutput);

	return output;
}

function sortPlayersByResultsBanchojs(results, playersInput, usersInput) {
	let playersOutput = [];
	let usersOutput = [];

	for (let i = 0; i < results.length; i++) {
		for (let j = 0; j < playersInput.length; j++) {
			if (results[i].player.user.id.toString() === playersInput[j].osuUserId) {
				playersOutput.push(playersInput[j]);
				usersOutput.push(usersInput[j]);
				//Close inner loop
				j = playersInput.length;
			}
		}
	}

	let output = [];
	output.push(playersOutput);
	output.push(usersOutput);

	return output;
}

async function sendMapLeaderboard(client, results, players, users) {
	let data = [];
	//Invisible seperator to ensure line break
	data.push('⁣\n**Last maps scores:**');
	for (let i = 0; i < results.length; i++) {
		//Calculate accuracy
		const accuracy = getAccuracy(results[results.length - i - 1], 0) * 100;
		if (results[results.length - i - 1].score === '-1') {
			data.push(`\`${players[results.length - i - 1].osuName}\`: ${humanReadable(parseInt(results[results.length - i - 1].score))} | ${results[results.length - i - 1].raw_mods.join('')}`);
		} else {
			data.push(`\`${players[results.length - i - 1].osuName}\`: ${humanReadable(parseInt(results[results.length - i - 1].score))} | ${Math.round(accuracy * 100) / 100}% | ${results[results.length - i - 1].maxCombo}x | ${results[results.length - i - 1].counts.miss} miss | ${results[results.length - i - 1].raw_mods.join('')}`);
		}
	}
	for (let i = 0; i < users.length; i++) {
		await messageUserWithRetries(client, users[i], data.join('\n'));
	}
}

async function messageUserWithRetries(client, user, content, attachment) {
	for (let i = 0; i < 3; i++) {
		try {
			if (attachment) {
				await user.send({ content: content, files: [attachment] })
					.then(() => {
						i = Infinity;
					})
					.catch(async (error) => {
						throw (error);
					});
			} else {
				await user.send(content)
					.then(() => {
						i = Infinity;
					})
					.catch(async (error) => {
						throw (error);
					});
			}
		} catch (error) {
			if (error.message === 'Cannot send messages to this user' || error.message === 'Internal Server Error') {
				if (i === 2) {
					if (logBroadcastEval) {
						// eslint-disable-next-line no-console
						console.log('Broadcasting MOTD/knockoutLobby.js DM issues to shards...');
					}

					client.shard.broadcastEval(async (c, { message }) => {
						const channel = await c.channels.cache.get('833803740162949191');
						if (channel) {
							await channel.send(message);
						}
					}, { context: { message: `<@${user.id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!` } });
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

async function movePlayersIntoFirstSlots(channel, lobby, players, scoreversion) {
	await lobby.updateSettings();

	let spotToFillNext = 0;
	for (let i = 0; i < 16; i++) {
		if (lobby.slots[i] && i === spotToFillNext) {
			spotToFillNext++;
		} else if (lobby.slots[i] && i !== spotToFillNext) {
			await channel.sendMessage(`!mp move #${lobby.slots[i].user.id} ${spotToFillNext + 1}`);
			spotToFillNext++;
		}
	}

	await pause(10000);

	await channel.sendMessage(`!mp set 0 ${scoreversion} ${players.length}`);
}

function calculateKnockoutNumber(players, mapIndex) {
	//Set array for how many players should get through maximum
	let expectedPlayers = [];
	expectedPlayers.push(16); //Map [0] Qualifiers -> 16
	expectedPlayers.push(14); //Map [1] 16 -> 14
	expectedPlayers.push(12); //Map [2] 14 -> 12
	expectedPlayers.push(10); //Map [3] 12 -> 10
	expectedPlayers.push(8); //Map [4] 10 -> 8 --DT
	expectedPlayers.push(6); //Map [5] 8 -> 6
	expectedPlayers.push(5); //Map [6] 6 -> 5
	expectedPlayers.push(4); //Map [7] 5 -> 4
	expectedPlayers.push(3); //Map [8] 4 -> 3 --DT
	expectedPlayers.push(2); //Map [9] 3 -> 2
	expectedPlayers.push(1); //Map [10] 2 -> 1

	//Calculate the amount of knockouts needed
	let knockoutNumber = expectedPlayers[mapIndex - 1] - expectedPlayers[mapIndex];
	//Set the amount to 1 if less players are in the lobby
	if (players.length < expectedPlayers[mapIndex - 1]) {
		knockoutNumber = 1;
	}

	return knockoutNumber;
}