const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'noEndDate',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/noEndDate.js DBOsuMultiScores');
		let noEndDate = await DBOsuMultiScores.findAll({
			attributes: ['matchId', 'matchName', 'matchEndDate', 'createdAt', 'updatedAt'],
			where: {
				matchEndDate: null,
			},
			group: ['matchId', 'matchName', 'matchEndDate', 'createdAt', 'updatedAt'],
		});

		// eslint-disable-next-line no-console
		console.log(noEndDate);

		return await interaction.editReply(`Logged ${noEndDate.length} matches with no end date.`);
	},
};