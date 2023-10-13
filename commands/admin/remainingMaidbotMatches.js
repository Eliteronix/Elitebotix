const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'remainingMaidbotMatches',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/remainingMaidbotMatches.js DBOsuMultiScores');
		let ommMatches = await DBOsuMultiScores.findAll({
			attributes: ['matchId'],
			where: {
				matchName: {
					[Op.startsWith]: 'o!mm'
				},
				verifiedAt: null,
			},
			group: ['matchId'],
		});

		console.log(ommMatches);

		return await interaction.editReply(`Remaining unverified maidbot matches: ${ommMatches.length}`);
	},
};