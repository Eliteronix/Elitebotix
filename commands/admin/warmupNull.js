const { DBOsuMultiGames } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'warmupNull',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/warmupNull.js DBOsuMultiGames');
		let count = await DBOsuMultiGames.count({
			where: {
				warmup: null,
				tourneyMatch: true,
			},
		});

		return await interaction.editReply(`Warmup null: ${count}`);
	},
};