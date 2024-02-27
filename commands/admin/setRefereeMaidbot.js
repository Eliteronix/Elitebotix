const { DBOsuMultiMatches } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'setRefereeMaidbot',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/setRefereeMaidbot.js DBOsuMultiMatches');
		let count = await DBOsuMultiMatches.update({
			referee: 16173747,
		}, {
			where: {
				verifiedBy: 31050083,
				verificationComment: 'Match created by MaidBot',
			},
		});

		return await interaction.editReply(`Set ${count} scores to reffed by MaidBot.`);
	},
};