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