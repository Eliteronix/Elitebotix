const { DBDiscordUsers, DBDuelRatingHistory } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'resetSavedRatings',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/resetSavedRatings.js DBDuelRatingHistory');
		let deleted = await DBDuelRatingHistory.destroy({
			where: {
				id: {
					[Op.gt]: 0,
				},
			}
		});

		await interaction.followUp(`Deleted ${deleted} duel rating histories.`);

		logDatabaseQueries(4, 'commands/admin/resetSavedRatings.js DBDiscordUsers');
		let updated = await DBDiscordUsers.update({
			lastDuelRatingUpdate: null,
		}, {
			where: {
				lastDuelRatingUpdate: {
					[Op.not]: null,
				},
			},
			silent: true
		});

		return await interaction.followUp(`Updated ${updated} discord users.`);
	},
};


