const { knockoutLobby } = require('./knockoutLobby.js');

module.exports = {
	qualifier: async function (client, mappool, players) {
		if (players.length === 0) {
			return;
		}

		let users = [];

		for (let i = 0; i < players.length; i++) {
			const user = client.users.fetch(players[i].userId);
			users.push(user);
		}

		// Catch the case of only one player playing Sadge
		if (players.length === 1) {
			// Send message to user
			return users[0].send('There aren\'t any other players registered for this bracket at the moment :(\nMaybe try asking your friends and there will be another one competition tomorrow :)');
		}

		// Catch case of less than 17 players
		if (players.length < 17) {
			return knockoutLobby(client, mappool, 1, players, users);
		}

		// Catch case of qualifiers actually being played
		//Qualifiers
		//Send messages to inform players
		await sendQualifierMessages(client, mappool[0], users);

		//wait 10 minutes
		await setTimeout(function () {

		}, 1000 * 60 * 10);

		//Grab qualifier results of all players
		const results = await getQualifierResults(mappool[0], players);

		//Divide sorted players into knockout lobbies
		divideIntoGroups(client, mappool, 1, players, users);
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

	knockoutLobby(client, mappool, lobbyNumber, thisLobbyPlayers, thisLobbyUsers);

	if (otherPlayers.length > 0) {
		divideIntoGroups(client, mappool, lobbyNumber + 1, otherPlayers, otherUsers);
	}
}

async function sendQualifierMessages(client, map, users) {
	for (let i = 0; i < users.length; i++) {
		let data = [];
		data.push(`There are ${users.length} players registered today for this bracket!`);
		data.push('Try to get your best score possible in the next 10 minutes on the following map to qualify for a knockout lobby.');
		data.push('**The map is FreeMod - `NF` will be countered and scores will be doubled - Don\'t use `ScoreV2`, `Relax`, `Autopilot`, `Auto`**');
		data.push(`${map.artist} - ${map.title} [${map.version}]`);
		data.push(`${Math.round(map[i].difficulty.rating * 100) / 100}* | ${Math.floor(map[i].length.total / 60)}:${(map[i].length.total % 60).toString().padStart(2, '0')} | ${map[i].bpm} BPM | CS ${map[i].difficulty.size} | HP ${map[i].difficulty.drain} | OD ${map[i].difficulty.overall} | AR ${map[i].difficulty.approach}`);
		data.push(`Website: <https://osu.ppy.sh/b/${map[i].id}> | osu! direct: <osu://dl/${map[i].beatmapSetId}>`);
		await users[i].send(data, { split: true })
			.catch(async () => {
				const channel = await client.channels.fetch('833803740162949191');
				channel.send(`<@${users[i].id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
			});
	}
}

async function getQualifierResults(map, players) {
	let results = [];

	

	return results;
}