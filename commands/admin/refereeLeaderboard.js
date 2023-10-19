const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries, getOsuPlayerName } = require('../../utils');

module.exports = {
	name: 'refereeLeaderboard',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/refereeLeaderboard.js DBOsuMultiScores');
		const refereesPerMatch = await DBOsuMultiScores.findAll({
			attributes: [
				'referee',
			],
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
					refereeUsername: await getOsuPlayerName(referee),
					refereeCount: 1,
				});
			}
		}

		// eslint-disable-next-line no-console
		console.log('Referee leaderboard:');

		for (let i = 0; i < refereeLeaderboard.length && i < 100; i++) {
			// eslint-disable-next-line no-console
			console.log(`#${i + 1}. ${refereeLeaderboard[i].refereeUsername} (${refereeLeaderboard[i].referee}) - ${refereeLeaderboard[i].refereeCount} matches`);
		}

		await interaction.editReply('Logged the leaderboard to the console.');
	},
};