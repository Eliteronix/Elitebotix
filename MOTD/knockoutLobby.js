const osu = require('node-osu');
const { getMods, humanReadable } = require('../utils.js');

module.exports = {
	knockoutLobby: async function (client, mappool, lobbyNumber, players, users) {
		//Map [0] has been played already
		sendLobbyMessages(client, lobbyNumber, players, users);

		if (players.length === 1) {
			// give points to player
			return users[0].send('You will win your lobby by default.\nCome back tomorrow for another competition!')
				.catch(async () => {
					const channel = await client.channels.fetch('833803740162949191');
					channel.send(`<@${users[0].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
				});
		}

		//Map [1] 16 -> 14
		let knockoutNumber = 2;
		if (players.length < 16) {
			knockoutNumber = 1;
		}
		sendMapMessages(client, mappool[1], 1, knockoutNumber, users, false);
		//wait map + 60 seconds
		setTimeout(async function () {
			let results = await getKnockoutScores(mappool[1], players, false);

			quicksort(results);

			const playersUsers = sortPlayersByResults(results, players, users);

			players = playersUsers[0];
			users = playersUsers[1];

			let knockedOutPlayers = 0;
			let knockedOutPlayerNames = '';

			//Send leaderboard of that map
			sendMapLeaderboard(client, results, users);

			//Remove players by inactivity
			for (let i = 0; i < results.length; i++) {
				if (results[i] < 0) {
					users[i].send('You failed to submit a score for the first knockout map and have been removed from todays competition.\nCome back tomorrow for another round.')
						.catch(async () => {
							const channel = await client.channels.fetch('833803740162949191');
							channel.send(`<@${users[0].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
						});
					results.splice(i, 1);
					players.splice(i, 1);
					users.splice(i, 1);
					knockedOutPlayers++;
					if (knockedOutPlayerNames === '') {
						knockedOutPlayerNames = `\`${players[i].osuName}\``;
					} else {
						knockedOutPlayerNames = `${knockedOutPlayerNames}, \`${players[i].osuName}\``;
					}
				} else {
					i = results.length;
				}
			}

			if (knockedOutPlayers < knockoutNumber) {
				for (let i = 0; i < players.length && knockedOutPlayers < knockoutNumber; i++) {
					users[i].send('You were knocked out by score. Thank you for playing and come back tomorrow for another round!')
						.catch(async () => {
							const channel = await client.channels.fetch('833803740162949191');
							channel.send(`<@${users[0].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
						});
					results.splice(i, 1);
					players.splice(i, 1);
					users.splice(i, 1);
					knockedOutPlayers++;
					if (knockedOutPlayerNames === '') {
						knockedOutPlayerNames = `\`${players[i].osuName}\``;
					} else {
						knockedOutPlayerNames = `${knockedOutPlayerNames}, \`${players[i].osuName}\``;
					}
				}
			}

			if (players.length === 0) {
				return;
			}

			for (let i = 0; i < users.length; i++) {
				users[i].send(`Knocked out players this round:\n${knockedOutPlayerNames}`)
					.catch(async () => {
						const channel = await client.channels.fetch('833803740162949191');
						channel.send(`<@${users[i].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
					});
			}

			if (players.length === 1) {
				return users[0].send('All other players have been knocked out of todays competition.\nGG, thank you for playing and come back tomorrow for another round.')
					.catch(async () => {
						const channel = await client.channels.fetch('833803740162949191');
						channel.send(`<@${users[0].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
					});
			}

			//Map [2] 14 -> 12
			//Map [3] 12 -> 10
			//Map [4] 10 -> 8 --DT
			//Map [5] 8 -> 6
			//Map [6] 6 -> 5
			//Map [7] 5 -> 4
			//Map [8] 4 -> 3 --DT
			//Map [9] 3 -> 2
			//Map [10] 2 -> 1
		}, parseInt(mappool[1].length.total) * 1000 + 1000 * 60);
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

	for (let i = 0; i < users.length; i++) {
		let data = [];
		data.push(`You are in lobby ${lobbyNumber}`);
		data.push('Your lobby consists of the following players:');
		data.push(playerList);

		await users[i].send(data, { split: true })
			.catch(async () => {
				const channel = await client.channels.fetch('833803740162949191');
				channel.send(`<@${users[i].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
			});
	}
}

async function sendMapMessages(client, map, mapNumber, knockoutNumber, users, doubleTime) {
	for (let i = 0; i < users.length; i++) {
		let data = [];
		let DTMap = '';
		if (doubleTime) {
			DTMap = '+DoubleTime';
		}
		data.push(`**The map is FreeMod${DTMap} - Scores with \`NF\` will be doubled - Don't use \`ScoreV2\`, \`Relax\`, \`Autopilot\` or \`Auto\`**`);
		data.push(`\n${mapNumber}. knockout map (${knockoutNumber} players will be knocked out):`);
		data.push(`${map.artist} - ${map.title} [${map.version}] | Mapper: ${map.creator}`);
		data.push(`${Math.round(map.difficulty.rating * 100) / 100}* | ${Math.floor(map.length.total / 60)}:${(map.length.total % 60).toString().padStart(2, '0')} | ${map.bpm} BPM | CS ${map.difficulty.size} | HP ${map.difficulty.drain} | OD ${map.difficulty.overall} | AR ${map.difficulty.approach}`);
		data.push(`Website: https://osu.ppy.sh/b/${map.id} | osu! direct: <osu://dl/${map.beatmapSetId}>`);
		await users[i].send(data, { split: true })
			.catch(async () => {
				const channel = await client.channels.fetch('833803740162949191');
				channel.send(`<@${users[i].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
			});
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

	let results = [];
	for (let i = 0; i < players.length; i++) {
		const score = await osuApi.getUserRecent({ u: players[i].osuUserId })
			.then(async (scores) => {
				const mods = getMods(scores[0].raw_mods);
				if (mods.includes('NF')) {
					scores[0].score = parseInt(scores[0].score) * 2;
				}
				if (doubleTime && !mods.includes('DT')) {
					scores[0].score = '-1';
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
						pp: '-1',
						hasReplay: false,
						raw_mods: 0,
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

async function sendMapLeaderboard(client, results, users) {
	let data = [];
	data.push('Here is the leaderboard for the last map:');
	for (let i = 0; i < results.length; i++) {
		data.push(`\`${results[i].user.name}\`: ${humanReadable(parseInt(results[i].score))}`);
	}
	for (let i = 0; i < users.length; i++) {
		await users[i].send(data, { split: true })
			.catch(async () => {
				const channel = await client.channels.fetch('833803740162949191');
				channel.send(`<@${users[i].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
			});
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