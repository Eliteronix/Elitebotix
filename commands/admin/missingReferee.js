const { DBOsuMultiMatches } = require('../../dbObjects');

module.exports = {
	name: 'missingReferee',
	usage: 'None',
	async execute(interaction) {
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

		await interaction.followUp(`Found ${missingMatches.length} matches with missing referee info`);

		for (const match of missingMatches) {
			await interaction.followUp(`Match ID: <https://osu.ppy.sh/community/matches/${match.matchId}>, Match Start Date: ${match.matchStartDate}, Verified At: ${match.verifiedAt}, Verified By: ${match.verifiedBy}`);
		}

		return await interaction.followUp(`Sent ${missingMatches.length} matches`);
	},
};