const { DBOsuMultiGameScores } = require('../../dbObjects');
const { humanReadable } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'resetSavedPPValues',
	usage: 'None',
	async execute(interaction) {
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