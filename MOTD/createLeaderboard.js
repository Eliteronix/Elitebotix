const { DBDiscordUsers } = require('../dbObjects');

module.exports = {
	createLeaderboard: async function (client, upperRank, lowerRank, since, topAmount, channelID) {
		const allBrackets = await getPlayers(client);

		for (let i = 0; i < allBrackets.length; i++) {
			const bracketPlayers = allBrackets[i];
			

		}
	}
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].totalPoints) <= parseFloat(pivot.totalPoints)) {
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

async function getPlayers(client) {
	const registeredUsers = await DBDiscordUsers.findAll({
		where: { osuMOTDRegistered: 1 }
	});

	let topBracketPlayers = [];
	let middleBracketPlayers = [];
	let lowerBracketPlayers = [];
	let beginnerBracketPlayers = [];

	for (let i = 0; i < registeredUsers.length; i++) {
		if (registeredUsers[i].osuUserId) {
			if (registeredUsers[i].osuRank < 10000) {
				topBracketPlayers.push(registeredUsers[i]);
			} else if (registeredUsers[i].osuRank < 50000) {
				middleBracketPlayers.push(registeredUsers[i]);
			} else if (registeredUsers[i].osuRank < 100000) {
				lowerBracketPlayers.push(registeredUsers[i]);
			} else if (registeredUsers[i].osuRank < 10000000) {
				beginnerBracketPlayers.push(registeredUsers[i]);
			}
		} else {
			registeredUsers[i].osuMOTDRegistered = 0;
			await registeredUsers[i].save();

			client.users.fetch(registeredUsers[i].userId)
				.then(async (user) => {
					user.send('It seems like you removed your connected osu! account and have been removed as a player for the `Maps of the Day` competition because of that.\nIf you want to take part again please reconnect your osu! account and use `e!osu-motd register` again.');
				});
		}
	}

	let allPlayers = [];
	allPlayers.push(topBracketPlayers);
	allPlayers.push(middleBracketPlayers);
	allPlayers.push(lowerBracketPlayers);
	allPlayers.push(beginnerBracketPlayers);

	return allPlayers;
}