const { DBOsuMultiScores } = require('../../dbObjects');
const { humanReadable, logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'resetSavedPPValues',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin.js DBOsuMultiScores resetSavedPPValues');
		let count = await DBOsuMultiScores.update({
			pp: null,
		}, {
			where: {
				pp: {
					[Op.ne]: null
				}
			}
		});

		return interaction.editReply(`Reset ${humanReadable(count)} scores' pp values`);
	},
};