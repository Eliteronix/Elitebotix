const { DBDiscordUsers, DBDuelRatingHistory } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'resetFuckedRatings',
	usage: 'None',
	async execute(interaction) {
		let fuckedUp = new Date();

		fuckedUp.setDate(26);

		logDatabaseQueries(4, 'commands/admin/resetSavedRatings.js DBDuelRatingHistory');
		let deleted = await DBDuelRatingHistory.destroy({
			where: {
				updatedAt: {
					[Op.gte]: fuckedUp
				}
			}
		});

		await interaction.followUp(`Deleted ${deleted} duel rating histories.`);

		logDatabaseQueries(4, 'commands/admin/resetSavedRatings.js DBDiscordUsers');
		let updated = await DBDiscordUsers.update({
			lastDuelRatingUpdate: null,
		}, {
			where: {
				lastDuelRatingUpdate: {
					[Op.gte]: fuckedUp,
				},
			},
			silent: true
		});

		return await interaction.followUp(`Updated ${updated} discord users.`);
	},
};


