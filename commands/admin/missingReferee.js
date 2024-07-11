const { DBOsuMultiMatches } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'missingReferee',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/missingReferee.js DBOsuMultiMatches get all matches with missing referee info');
		const missingMatches = await DBOsuMultiMatches.findAll({
			attributes: [
				'matchId',
				'matchStartDate',
				'verifiedAt',
				'verifiedBy',
			],
			where: {
				tourneyMatch: true,
				referee: null,
			},
			order: [
				['matchId', 'ASC'],
			],
		});

		console.log(missingMatches);

		return await interaction.editReply(`Logged matches info`);
	},
};