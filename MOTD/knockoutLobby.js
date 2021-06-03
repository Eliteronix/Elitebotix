const osu = require('node-osu');
const { getMods, humanReadable, createMOTDAttachment, getAccuracy, pause } = require('../utils.js');
const { assignKnockoutPoints } = require('./givePointsToPlayers.js');

module.exports = {
	knockoutLobby: async function (client, bancho, mappool, lobbyNumber, players, users, isFirstRound) {
		//Map [0] has been played already
		//Send message about which lobby the player is in and who he / she is against
		await sendLobbyMessages(client, lobbyNumber, players, users);

		//Case of just one player
		if (players.length === 1) {
			assignKnockoutPoints(client, players[0], players, 1, 11);
			return await messageUserWithRetries(client, users[0], 'You will win your lobby by default.\nCome back tomorrow for another competition!');
		}

		let startingPlayers = players;

		let startingPlayerIds = [];
		for (let i = 0; i < startingPlayers.length; i++) {
			startingPlayerIds.push(startingPlayers[i].osuUserId);
		}

		console.log('Connecting now');

		await bancho.connect().then(async () => {
			console.log('Connected');

			const channel = await bancho.createLobby(`MOTD: (Lobby) vs (#${lobbyNumber})`);
			const lobby = channel.lobby;

			const password = Math.random().toString(36).substring(8);

			await Promise.all([lobby.setPassword(password),]);
			await channel.sendMessage(`!mp map ${mappool[1].id} 0`);
			await channel.sendMessage('!mp mods FreeMod');

			for (let i = 0; i < users.length; i++) {
				await channel.sendMessage(`!mp invite #${players[i].osuUserId}`);
				await messageUserWithRetries(client, users[i], `Your Knockoutlobby has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
			}

			await channel.sendMessage('!mp timer 300');

			channel.on('message', (msg) => {
				console.log(msg.message);

				if (msg.user.ircUsername === 'BanchoBot' && msg.message === 'Countdown finished') {
					//Banchobot countdown finished
					console.log('The bots countdown has finished');
				}
			});
			lobby.on('playerJoined', (obj) => {
				if (!startingPlayerIds.includes(obj.player.user.id.toString())) {
					channel.sendMessage(`!mp kick #${obj.player.user.id}`);
				}
			});
			lobby.on('allPlayersReady', () => {
				console.log('allPlayersReady');
			});
			lobby.on('matchFinished', (scores) => {
				console.log(scores);
			});

			// await lobby.closeLobby();
			// await bancho.disconnect();
		}).catch(console.error);
		//Start the first knockout map
		// knockoutMap(client, mappool, lobbyNumber, startingPlayers, players, users, 1, isFirstRound);
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
		await messageUserWithRetries(client, users[i], data);
	}
}

async function knockoutMap(client, mappool, lobbyNumber, startingPlayers, players, users, mapIndex, isFirstRound) {
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

		quicksort(results);

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
					assignKnockoutPoints(client, players[i], startingPlayers, players.length, mapIndex);
				}
				await messageUserWithRetries(client, users[i], `You failed to submit a valid score for the last knockout map and have been removed from todays competition.\nReason for the knockout: ${results[i].pp}\nCome back tomorrow for another round.`);
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
				assignKnockoutPoints(client, players[i], startingPlayers, players.length, mapIndex);
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
			assignKnockoutPoints(client, players[0], startingPlayers, players.length, mapIndex + 1);
			return await messageUserWithRetries(client, users[0], 'All other players have been knocked out of todays competition which means **you have won!**\nCongratulations, thank you for playing and come back tomorrow for another round.');
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
		await messageUserWithRetries(client, users[i], data, attachment);
	}
}

async function getKnockoutScores(map, players, doubleTime) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	//pp field is abused for reason of knockout
	let results = [];
	for (let i = 0; i < players.length; i++) {
		const score = await osuApi.getUserRecent({ u: players[i].osuUserId })
			.then(async (scores) => {
				let mods = getMods(scores[0].raw_mods);
				if (!mods[0]) {
					mods.push('NM');
				}
				scores[0].raw_mods = mods;
				if (mods.includes('NF')) {
					scores[0].score = parseInt(scores[0].score) * 2;
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
					console.log(err);
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
		await messageUserWithRetries(client, users[i], data);
	}
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].score) <= parseFloat(pivot.score)) {
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

async function messageUserWithRetries(client, user, content, attachment) {
	for (let i = 0; i < 3; i++) {
		try {
			if (attachment) {
				await user.send(content, attachment)
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
					const channel = await client.channels.fetch('833803740162949191');
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