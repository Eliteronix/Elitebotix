const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'remainingMaidbotMatches',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/remainingMaidbotMatches.js DBOsuMultiScores');
		let count = await DBOsuMultiScores.count({
			where: {
				matchName: {
					[Op.startsWith]: 'o!mm'
				},
				verifiedAt: null,
			},
			group: ['matchId'],
		});

		return await interaction.editReply(`Remaining unverified maidbot matches: ${count.length}`);
	},
};