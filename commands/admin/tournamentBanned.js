const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'tournamentBanned',
	usage: 'None',
	async execute(interaction) {
		//TODO: add attributes and logdatabasequeries
		logDatabaseQueries(4, 'commands/admin/tournamentBanned.js DBDiscordUsers');
		let discordUsers = await DBDiscordUsers.findAll({
			where: {
				tournamentBannedUntil: {
					[Op.gte]: new Date(),
				},
			},
		});

		for (let i = 0; i < discordUsers.length; i++) {
			await interaction.followUp(`${discordUsers[i].osuName} | <https://osu.ppy.sh/users/${discordUsers[i].osuUserId}>`);
		}

		await interaction.followUp(`Total: ${discordUsers.length}`);
	},
};