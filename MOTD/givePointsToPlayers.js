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

const { DBMOTDPoints } = require('../dbObjects');

module.exports = {
	assignQualifierPoints: async function (allPlayers) {
		for (let i = 0; i < allPlayers.length; i++) {
			createQualifierResult(allPlayers[i], allPlayers.length, i + 1);
		}
	},
	assignKnockoutPoints: async function (player, round, playerAmount, playerRank) {
		let today = new Date();
		today.setUTCHours(18);
		today.setUTCMinutes(0);
		today.setUTCSeconds(0);
		today.setUTCMilliseconds(0);

		const qualifierDataset = await DBMOTDPoints.findOne({
			where: {
				userId: player.userId,
				osuUserId: player.osuUserId,
				matchDate: today
			}
		});

		//Real calculation for this still has to be done
		if (qualifierDataset) {
			qualifierDataset.totalPoints = playerAmount - playerRank + 1;
			qualifierDataset.knockoutPoints = -1;
			qualifierDataset.knockoutRank = -1;
			qualifierDataset.knockoutPlayers = -1;
		} else {
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
				matchDate: today
			});
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
		matchDate: today
	});
}

