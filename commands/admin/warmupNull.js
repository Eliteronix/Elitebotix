const { DBOsuMultiGames } = require('../../dbObjects');

module.exports = {
	name: 'warmupNull',
	usage: 'None',
	async execute(interaction) {
		let count = await DBOsuMultiGames.count({
			where: {
				warmup: null,
				tourneyMatch: true,
			},
		});

		return await interaction.editReply(`Warmup null: ${count}`);
	},
};