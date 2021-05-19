const osu = require('node-osu');
const { knockoutLobby } = require('./knockoutLobby.js');
const { assignQualifierPoints } = require('./givePointsToPlayers.js');
const { getMods, humanReadable, createMOTDAttachment } = require('../utils.js');

module.exports = {
	qualifier: async function (client, mappool, players) {
		//Return if there aren't any players
		if (players.length === 0) {
			return;
		}

		let users = [];

		//Grab all the discord users
		for (let i = 0; i < players.length; i++) {
			const user = await client.users.fetch(players[i].userId);
			users.push(user);
		}

		// Catch the case of only one player playing Sadge
		if (players.length === 1) {
			// Send message to user
			return users[0].send('There aren\'t any other players registered for your bracket at the moment.\nMaybe try asking your friends and there will be another competition tomorrow.')
				.catch(async () => {
					const channel = await client.channels.fetch('833803740162949191');
					channel.send(`<@${users[0].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
				});
		}

		// Catch case of less than 17 players
		if (players.length < 17) {
			return knockoutLobby(client, mappool, 1, players, users, true);
		}

		// Catch case of qualifiers actually being played
		//Send messages to inform players
		await sendQualifierMessages(client, mappool[0], users);

		//wait 10 minutes
		setTimeout(async function () {
			//Grab qualifier results of all players
			let results = await getQualifierResults(mappool[0], players);

			//Sort results
			quicksort(results);

			//Sort players and users by the results order
			const playersUsers = sortPlayersByResults(results, players, users);

			players = playersUsers[0];
			users = playersUsers[1];

			//Get rid of people without scores
			for (let i = 0; i < results.length; i++) {
				if (results[i].score < 0) {
					users[i].send('You failed to submit a score for todays qualifier map and have been removed from todays competition.\nCome back tomorrow for another round.')
						.catch(async () => {
							const channel = await client.channels.fetch('833803740162949191');
							channel.send(`<@${users[i].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
						});
					results.splice(i, 1);
					players.splice(i, 1);
					users.splice(i, 1);
					i--;
				}
			}

			//Return if there aren't any players
			if (players.length === 0) {
				return;
			}

			//Assign all points to the players
			assignQualifierPoints(players);

			//Get rid of people without scores
			for (let i = 0; i < users.length; i++) {
				await users[i].send(`You placed \`${i + 1}.\` out of \`${users.length}\` players with a score of \`${humanReadable(results[i].score)}\``)
					.catch(async () => {
						const channel = await client.channels.fetch('833803740162949191');
						channel.send(`<@${users[i].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
					});
			}

			//Divide sorted players into knockout lobbies
			divideIntoGroups(client, mappool, 1, players, users);
		}, 1000 * 60 * 10);
	}
};

function divideIntoGroups(client, mappool, lobbyNumber, players, users) {
	let thisLobbyPlayers = [];
	let otherPlayers = [];

	let thisLobbyUsers = [];
	let otherUsers = [];

	for (let i = 0; i < players.length; i++) {
		if (i < 16) {
			thisLobbyPlayers.push(players[i]);
			thisLobbyUsers.push(users[i]);
		} else {
			otherPlayers.push(players[i]);
			otherUsers.push(users[i]);
		}
	}

	knockoutLobby(client, mappool, lobbyNumber, thisLobbyPlayers, thisLobbyUsers, false);

	if (otherPlayers.length > 0) {
		divideIntoGroups(client, mappool, lobbyNumber + 1, otherPlayers, otherUsers);
	}
}

async function sendQualifierMessages(client, map, users) {
	let data = [];
	data.push(`There are ${users.length} players registered today for your bracket!`);
	data.push('Try to get your **best score** possible in the next **10 minutes** on the following map to qualify for a knockout lobby **(fails are excluded)**.');
	data.push('\nTodays qualifier map:');
	data.push(`Website: <https://osu.ppy.sh/b/${map.id}> | osu! direct: <osu://b/${map.id}>`);
	const attachment = await createMOTDAttachment('Qualifier', map, false);
	for (let i = 0; i < users.length; i++) {
		await users[i].send(data, attachment, { split: true })
			.catch(async () => {
				const channel = await client.channels.fetch('833803740162949191');
				channel.send(`<@${users[i].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
			});
	}
}

async function getQualifierResults(map, players) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	let results = [];

	for (let i = 0; i < players.length; i++) {
		const score = await osuApi.getScores({ b: map.id, u: players[i].osuUserId })
			.then(async (scores) => {
				let mods = getMods(scores[0].raw_mods);
				if (!mods[0]) {
					mods.push('NM');
				}
				scores[0].raw_mods = mods;
				if (mods.includes('NF')) {
					scores[0].score = parseInt(scores[0].score) * 2;
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

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].score) >= parseFloat(pivot.score)) {
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