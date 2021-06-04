//Players gain Points from qualifications -> scales by amount of players
// each player should get points by inverted rank -> rank #1 out of 500 = 500 points
// totalPlayers - rank + 1 -> will result in qualifier points
//Players also gain points from knockout -> Should scale by the lobby
// 10% more for each round you pass -> 10 rounds (win) = 100%
// 100% = the highest amount of points one player got from the qualifiers
// i. e. if it is 1 - 16 it would be 16 as the base for everyone
// players losing in the first round receive 10% of 16 points
// players losing in the 5th round receive 50% of 16 points
// the winner receives 100% of 16 points

const { DBMOTDPoints, DBDiscordUsers } = require('../dbObjects');

module.exports = {
	assignQualifierPoints: async function (allPlayers) {
		for (let i = 0; i < allPlayers.length; i++) {
			createQualifierResult(allPlayers[i], allPlayers.length, i + 1);
		}
	},
	assignKnockoutPoints: async function (client, player, allPlayers, rank, round) {
		let today = new Date();
		today.setUTCHours(18);
		today.setUTCMinutes(0);
		today.setUTCSeconds(0);
		today.setUTCMilliseconds(0);

		const qualifierDataset = await DBMOTDPoints.findOne({
			where: { userId: player.userId, osuUserId: player.osuUserId, matchDate: today }
		});

		if (qualifierDataset) {
			let maximumPointsFromQualis = 0;
			for (let i = 0; i < allPlayers.length; i++) {
				const qualifierDataset = await DBMOTDPoints.findOne({
					where: { userId: allPlayers[i].userId, osuUserId: allPlayers[i].osuUserId, matchDate: today }
				});

				if (qualifierDataset && parseInt(maximumPointsFromQualis) < parseInt(qualifierDataset.qualifierPoints)) {
					maximumPointsFromQualis = parseInt(qualifierDataset.qualifierPoints);
				}
			}

			let knockoutPoints = Math.round(parseInt(maximumPointsFromQualis) * (parseInt(round) / 10 * 2));


			qualifierDataset.totalPoints = parseInt(qualifierDataset.qualifierPoints) + parseInt(knockoutPoints);
			qualifierDataset.knockoutPoints = knockoutPoints;
			qualifierDataset.knockoutRank = rank;
			qualifierDataset.knockoutPlayers = allPlayers.length;
			qualifierDataset.knockoutRound = round;
			qualifierDataset.maxQualifierPoints = maximumPointsFromQualis;
			qualifierDataset.save();

			try {
				const user = await client.users.fetch(player.userId);
				user.send(`You got a total of **${qualifierDataset.totalPoints} points** today! (${qualifierDataset.qualifierPoints} from Qualifiers | ${qualifierDataset.knockoutPoints} from Knockouts)`);
			} catch {
				//Nothing
			}
		} else {
			let qualifierPoints = allPlayers.length - rank + 1;
			let knockoutPoints = Math.round(allPlayers.length * (parseInt(round) / 10 * 2));
			const motdPoints = await DBMOTDPoints.create({
				userId: player.userId,
				osuUserId: player.osuUserId,
				osuRank: player.osuRank,
				totalPoints: parseInt(qualifierPoints) + parseInt(knockoutPoints),
				qualifierPoints: qualifierPoints,
				qualifierRank: rank,
				qualifierPlayers: allPlayers.length,
				knockoutPoints: knockoutPoints,
				knockoutRank: rank,
				knockoutPlayers: allPlayers.length,
				knockoutRound: round,
				maxQualifierPoints: allPlayers.length,
				matchDate: today
			});

			try {
				const user = await client.users.fetch(player.userId);
				user.send(`You got a total of **${motdPoints.totalPoints} points** today! (${motdPoints.qualifierPoints} from Qualifiers | ${motdPoints.knockoutPoints} from Knockouts)`);
			} catch {
				//Nothing
			}
		}

		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: player.userId }
		});

		if (discordUser) {
			let now = new Date();
			discordUser.osuMOTDlastRoundPlayed = now;
			discordUser.osuMOTDerrorFirstOccurence = null;
			discordUser.save();
		}
	}
};

async function createQualifierResult(player, playerAmount, playerRank) {
	let today = new Date();
	today.setUTCHours(18);
	today.setUTCMinutes(0);
	today.setUTCSeconds(0);
	today.setUTCMilliseconds(0);

	DBMOTDPoints.create({
		userId: player.userId,
		osuUserId: player.osuUserId,
		osuRank: player.osuRank,
		totalPoints: playerAmount - playerRank + 1,
		qualifierPoints: playerAmount - playerRank + 1,
		qualifierRank: playerRank,
		qualifierPlayers: playerAmount,
		knockoutPoints: -1,
		knockoutRank: -1,
		knockoutPlayers: -1,
		knockoutRound: -1,
		maxQualifierPoints: -1,
		matchDate: today
	});
}

