const { DBOsuMultiScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'noEndDate',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/noEndDate.js DBOsuMultiScores');
		let noEndDate = await DBOsuMultiScores.findAll({
			attributes: ['matchId', 'matchName'],
			where: {
				matchEndDate: null,
				tourneyMatch: true,
			},
			group: ['matchId', 'matchName'],
		});

		for (let i = 0; i < noEndDate.length; i++) {
			// eslint-disable-next-line no-console
			console.log('matchId', noEndDate[i].matchId, 'matchName', noEndDate[i].matchName);

			await interaction.channel.send(`https://osu.ppy.sh/community/matches${noEndDate[i].matchId}`);
		}

		return await interaction.editReply(`Logged ${noEndDate.length} matches with no end date.`);
	},
};