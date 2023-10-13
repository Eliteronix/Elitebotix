const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'setLatestEndDate',
	usage: '[matchIds]',
	async execute(interaction) {
		let matchIds = interaction.options.getString('argument').split(/ +/);

		logDatabaseQueries(4, 'commands/admin/noEndDate.js DBOsuMultiScores');
		let noEndDateMatch = await DBOsuMultiScores.findAll({
			attributes: ['matchId'],
			where: {
				matchId: {
					[Op.in]: matchIds
				},
				matchEndDate: null,
				tourneyMatch: true,
			},
			group: ['matchId'],
		});

		for (let i = 0; i < noEndDateMatch.length; i++) {
			let latestEndDate = await DBOsuMultiScores.findOne({
				attributes: ['gameEndDate'],
				where: {
					matchId: noEndDateMatch[i].matchId,
					gameEndDate: {
						[Op.ne]: null
					},
				},
				order: [['gameEndDate', 'DESC']],
			});

			// eslint-disable-next-line no-console
			console.log('matchId', noEndDateMatch[i].matchId, 'latestEndDate', latestEndDate.gameEndDate);

			logDatabaseQueries(4, 'commands/admin/noEndDate.js DBOsuMultiScores update');
			await DBOsuMultiScores.update({ matchEndDate: latestEndDate.gameEndDate }, { where: { matchId: noEndDateMatch[i].matchId } });
			await interaction.followUp(`Updated match https://osu.ppy.sh/mp/matches/${noEndDateMatch[i].matchId} with latest end date ${latestEndDate.gameEndDate}`);
		}

		return await interaction.followUp(`Updated ${noEndDateMatch.length} matches with latest end date.`);
	},
};