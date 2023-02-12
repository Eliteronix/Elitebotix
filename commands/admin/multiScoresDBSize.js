const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'multiScoresDBSize',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/multiScoresDBSize.js DBOsuMultiScores');
		const mapScoreAmount = await DBOsuMultiScores.count();

		await interaction.editReply(`Multi Scores DB Size: ${mapScoreAmount}`);
	},
};