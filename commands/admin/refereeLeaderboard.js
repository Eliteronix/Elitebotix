const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries, getOsuPlayerName } = require('../../utils');

module.exports = {
	name: 'refereeLeaderboard',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/refereeLeaderboard.js DBOsuMultiScores');
		const refereeLeaderboard = await DBOsuMultiScores.findAll({
			attributes: [
				'referee',
				[DBOsuMultiScores.sequelize.fn('COUNT', DBOsuMultiScores.sequelize.col('referee')), 'refereeCount'],
			],
			group: ['referee', 'matchId'],
		});

		for (let i = 0; i < refereeLeaderboard.length && i < 100; i++) {
			const refereeUsername = await getOsuPlayerName(refereeLeaderboard[i].referee);

			// eslint-disable-next-line no-console
			console.log(`#${i + 1}. ${refereeUsername} (${refereeLeaderboard[i].referee}) - ${refereeLeaderboard[i].refereeCount} matches`);
		}

		await interaction.editReply('Logged the leaderboard to the console.');
	},
};