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
			limit: 100,
		});

		for (const match of missingMatches) {
			await interaction.followUp(`Match ID: <https://osu.ppy.sh/community/matches/${match.matchId}>, Match Start Date: ${match.matchStartDate}, Verified At: ${match.verifiedAt}, Verified By: ${match.verifiedBy}`);
		}

		return await interaction.followUp(`Sent ${missingMatches.length} matches`);
	},
};