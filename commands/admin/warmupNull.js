const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'warmupNull',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/warmupNull.js DBOsuMultiScores');
		let count = await DBOsuMultiScores.count({
			where: {
				warmup: null,
				tourneyMatch: true,
			},
		});

		return await interaction.editReply(`Warmup null: ${count}`);
	},
};