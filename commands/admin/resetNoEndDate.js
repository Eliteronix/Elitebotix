const { DBOsuMultiScores } = require('../../dbObjects');
const { humanReadable, logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'resetNoEndDate',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/resetNoEndDate.js DBOsuMultiScores');
		let count = await DBOsuMultiScores.update({
			warmup: null,
		}, {
			where: {
				matchEndDate: null,
			}
		});

		return await interaction.editReply(`Reset ${humanReadable(count)} scores' warmup flag`);
	},
};