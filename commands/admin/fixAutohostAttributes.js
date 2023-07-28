const { DBOsuMultiScores } = require('../../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'fixAutohostAttributes',
	usage: 'None',
	async execute(interaction) {
		let autohosts = await DBOsuMultiScores.update({
			tourneyMatch: false
		}, {
			where: {
				matchName: {
					[Op.startsWith]: 'ETX Autohost%',
				},
				tourneyMatch: true
			}
		});

		interaction.editReply(`Updated ${autohosts[0]} autohosts`);
	},
};