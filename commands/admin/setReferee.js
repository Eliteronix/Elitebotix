const { DBOsuMultiMatches } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'setReferee',
	usage: '<matchId> <referee>',
	async execute(interaction) {
		const args = interaction.options.getString('argument').split(/ +/);

		const matchId = args[0];
		const referee = args[1];

		logDatabaseQueries(4, 'commands/admin/setReferee.js DBOsuMultiMatches');
		let count = await DBOsuMultiMatches.update({
			referee: referee,
		}, {
			where: {
				matchId: matchId,
			},
		});

		return await interaction.editReply(`Set ${count} scores to reffed by ${referee}.`);
	},
};