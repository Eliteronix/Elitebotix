const { DBDiscordUsers, DBMOTDPoints } = require('../dbObjects');
const { createLeaderboard, humanReadable } = require('../utils.js');

module.exports = {
	createLeaderboard: async function (client, since, topAmount, title, channelId) {
		const channel = await client.channels.fetch(channelId);
		channel.messages.fetch({ limit: 100 })
			.then(async (messages) => {
				const messagesArray = [];
				messages.filter(m => m.content === 'Daily Update').each(message => messagesArray.push(message));

				for (let i = 0; i < messagesArray.length; i++) {
					messagesArray[i].delete();
				}
			});

		const allBrackets = await getPlayers(client);

		for (let i = 0; i < allBrackets.length; i++) {
			let bracketPlayers = allBrackets[i];

			let bracketPlayerResults = [];

			for (let j = 0; j < bracketPlayers.length; j++) {
				let playerResults = await DBMOTDPoints.findAll({
					where: { userId: bracketPlayers[j].userId, osuUserId: bracketPlayers[j].osuUserId }
				});

				for (let k = 0; k < playerResults.length; k++) {
					//let BWSRank = Math.round(Math.pow(playerResults[k].osuRank, Math.pow(0.9937, Math.pow(bracketPlayers[j].osuBadges, 2))));
					//||i === 0 && BWSRank > 9999 //Top Bracket
					//|| i === 1 && (BWSRank < 10000 || BWSRank > 49999) // Middle Bracket
					//|| i === 2 && (BWSRank < 50000 || BWSRank > 99999) // Lower Bracket
					//|| i === 3 && BWSRank < 100000 //Beginner Bracket
					if (playerResults[k].matchDate < since //Time
					) {
						playerResults.splice(k, 1);
						k--;
					}
				}

				if (playerResults.length === 0) {
					bracketPlayers.splice(j, 1);
					j--;
				} else {
					quicksort(playerResults);

					let totalPlayerPoints = 0;
					let qualifierPlayerPoints = 0;
					let knockoutPlayerPoints = 0;
					let playedRounds = 0;

					for (let k = 0; k < playerResults.length && k < topAmount; k++) {
						totalPlayerPoints += parseInt(playerResults[k].totalPoints);
						qualifierPlayerPoints += parseInt(playerResults[k].qualifierPoints);
						knockoutPlayerPoints += parseInt(playerResults[k].knockoutPoints);
						playedRounds++;
					}

					let playerResult = {
						userId: bracketPlayers[j].userId,
						osuUserId: bracketPlayers[j].osuUserId,
						osuName: bracketPlayers[j].osuName,
						totalPoints: totalPlayerPoints,
						qualifierPoints: qualifierPlayerPoints,
						knockoutPoints: knockoutPlayerPoints,
						playedRounds: playedRounds
					};

					bracketPlayerResults.push(playerResult);
				}
			}

			quicksort(bracketPlayerResults);

			let leaderboardData = [];

			for (let i = 0; i < bracketPlayerResults.length; i++) {
				let dataset = {
					name: bracketPlayerResults[i].osuName,
					value: `Points: ${humanReadable(bracketPlayerResults[i].totalPoints.toString())} (Q.: ${humanReadable(bracketPlayerResults[i].qualifierPoints.toString())} | K.: ${humanReadable(bracketPlayerResults[i].knockoutPoints.toString())} | ${humanReadable(bracketPlayerResults[i].playedRounds.toString())} Day(s))`,
				};

				leaderboardData.push(dataset);
			}

			let bracketName = 'Top-Bracket';

			if (i === 1) {
				bracketName = 'Middle-Bracket';
			} else if (i === 2) {
				bracketName = 'Lower-Bracket';
			} else if (i === 3) {
				bracketName = 'Beginner-Bracket';
			}

			const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `osu! ${title} MOTD leaderboard for ${bracketName}`, `osu-MOTD-leaderboard-${bracketName}-${title}.png`);

			let content = 'Daily Update';

			let today = new Date();
			let tomorrow = new Date();
			tomorrow.setUTCDate(today.getUTCDate() + 1);

			const todayFormatted = `${today.getUTCDate().toString().padStart(2, '0')}.${(today.getUTCMonth() + 1).toString().padStart(2, '0')}.${today.getUTCFullYear()}`;

			if (title === 'Daily') {
				content = `Leaderboard from \`${todayFormatted}\``;
			} else if (title === 'Weekly' && today.getUTCDay() === 0) { //Sunday
				content = `Leaderboard from \`${todayFormatted}\``;
			} else if (title === 'Monthly' && tomorrow.getUTCDate() === 1) { //1st of the month is tomorrow
				content = `Leaderboard from \`${todayFormatted}\``;
			} else if (title === 'Quarter Yearly' && tomorrow.getUTCDate() === 1 && (tomorrow.getUTCMonth() === 3 || tomorrow.getUTCMonth() === 6 || tomorrow.getUTCMonth() === 9 || tomorrow.getUTCMonth() === 0)) {
				content = `Leaderboard from \`${todayFormatted}\``;
			} else if (title === 'All Time') {
				content = `Leaderboard from \`${todayFormatted}\``;
			}

			//Send attachment
			await channel.send({ content: content, files: [attachment] });
		}
	}
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].totalPoints) >= parseFloat(pivot.totalPoints)) {
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
			let BWSRank = Math.round(Math.pow(registeredUsers[i].osuRank, Math.pow(0.9937, Math.pow(registeredUsers[i].osuBadges, 2))));
			if (BWSRank < 10000) {
				topBracketPlayers.push(registeredUsers[i]);
			} else if (BWSRank < 50000) {
				middleBracketPlayers.push(registeredUsers[i]);
			} else if (BWSRank < 100000) {
				lowerBracketPlayers.push(registeredUsers[i]);
			} else if (BWSRank < 10000000) {
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