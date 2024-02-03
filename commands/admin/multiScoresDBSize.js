const { DBOsuMultiMatches, DBOsuMultiGames, DBOsuMultiGameScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'multiScoresDBSize',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/multiScoresDBSize.js DBOsuMultiMatches');
		const matchesAmount = await DBOsuMultiMatches.count();

		await interaction.followUp(`Matches DB Size: ${matchesAmount}`);

		logDatabaseQueries(4, 'commands/admin/multiScoresDBSize.js DBOsuMultiGames');
		const gamesAmount = await DBOsuMultiGames.count();

		await interaction.followUp(`Games DB Size: ${gamesAmount}`);

		logDatabaseQueries(4, 'commands/admin/multiScoresDBSize.js DBOsuMultiGames');
		const gameScoresAmount = await DBOsuMultiGameScores.count();

		await interaction.followUp(`Games Scores DB Size: ${gameScoresAmount}`);
	},
};