module.exports = {
	givePointsToPlayers: async function (client) {
		console.log(client);

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
	}
};