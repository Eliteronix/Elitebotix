const { DBOsuMultiMatches } = require('../../dbObjects');
const { logDatabaseQueries, getOsuPlayerName } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'refereeLeaderboard',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/refereeLeaderboard.js DBOsuMultiMatches');
		const refereesPerMatch = await DBOsuMultiMatches.findAll({
			attributes: [
				'referee',
			],
			where: {
				tourneyMatch: true,
				referee: {
					[Op.gt]: 0,
				},
			},
			group: ['referee', 'matchId'],
		});

		const refereeLeaderboard = [];

		// Count the number of matches each referee has reffed
		for (let i = 0; i < refereesPerMatch.length; i++) {
			const referee = refereesPerMatch[i].referee;

			if (refereeLeaderboard.some((entry) => entry.referee === referee)) {
				refereeLeaderboard.find((entry) => entry.referee === referee).refereeCount++;
			} else {
				refereeLeaderboard.push({
					referee: referee,
					refereeCount: 1,
				});
			}
		}

		// Sort by number of matches reffed descending
		refereeLeaderboard.sort((a, b) => b.refereeCount - a.refereeCount);

		let leaderboardString = '# Referee leaderboard\n```';

		for (let i = 0; i < refereeLeaderboard.length && i < 100; i++) {
			const refereeUsername = await getOsuPlayerName(refereeLeaderboard[i].referee);

			let newString = `\n#${i + 1}. ${refereeUsername} (${refereeLeaderboard[i].referee}) - ${refereeLeaderboard[i].refereeCount} matches`;

			if (leaderboardString.length + newString.length + '```'.length > 2000) {
				await interaction.followUp(leaderboardString + '```');
				leaderboardString = '```';
			}

			leaderboardString += newString;
		}

		await interaction.followUp(leaderboardString + '```');
	},
};