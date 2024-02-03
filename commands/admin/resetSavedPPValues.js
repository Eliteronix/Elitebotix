const { DBOsuMultiGameScores } = require('../../dbObjects');
const { humanReadable, logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'resetSavedPPValues',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/resetSavedPPValues.js DBOsuMultiGameScores');
		let count = await DBOsuMultiGameScores.update({
			pp: null,
		}, {
			where: {
				pp: {
					[Op.ne]: null
				}
			}
		});

		return await interaction.editReply(`Reset ${humanReadable(count)} scores' pp values`);
	},
};