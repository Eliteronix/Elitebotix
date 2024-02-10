const { DBOsuMultiMatches, DBOsuMultiGames, DBOsuMultiGameScores } = require('../../dbObjects');
const { logDatabaseQueries, humanReadable } = require('../../utils');

module.exports = {
	name: 'multiScoresDBSize',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/multiScoresDBSize.js DBOsuMultiMatches');
		const matchesAmount = await DBOsuMultiMatches.count();
		const uniqueMatchesAmount = await DBOsuMultiMatches.count({ distinct: true, col: 'matchId' });

		await interaction.followUp(`Matches DB Size: ${humanReadable(matchesAmount)} (Unique: ${humanReadable(uniqueMatchesAmount)})`);

		logDatabaseQueries(4, 'commands/admin/multiScoresDBSize.js DBOsuMultiGames');
		const gamesAmount = await DBOsuMultiGames.count();
		const uniqueGamesAmount = await DBOsuMultiGames.count({ distinct: true, col: 'gameId' });

		await interaction.followUp(`Games DB Size: ${humanReadable(gamesAmount)} (Unique: ${humanReadable(uniqueGamesAmount)})`);

		logDatabaseQueries(4, 'commands/admin/multiScoresDBSize.js DBOsuMultiGames');
		const gameScoresAmount = await DBOsuMultiGameScores.count();
		const uniqueGameScoresAmount = await DBOsuMultiGameScores.count({ distinct: true, group: ['gameId', 'osuUserId'] }); // distinct by gameId and osuUserId

		await interaction.followUp(`Games Scores DB Size: ${humanReadable(gameScoresAmount)} (Unique: ${humanReadable(uniqueGameScoresAmount.length)})`);
	},
};