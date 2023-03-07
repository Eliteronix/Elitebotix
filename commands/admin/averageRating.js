const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'averageRating',
	usage: '<minRank> <maxRank>',
	async execute(interaction) {
		const args = interaction.options.getString('argument').split(' ');

		logDatabaseQueries(4, 'commands/admin/averageRating.js DBDiscordUsers averageRating');
		let discordUsers = await DBDiscordUsers.findAll({
			where: {
				osuUserId: {
					[Op.gt]: 0
				},
				osuPP: {
					[Op.gt]: 0
				},
				osuDuelStarRating: {
					[Op.gt]: 0
				},
				osuDuelProvisional: {
					[Op.not]: true,
				}
			}
		});

		let totalRating = 0;
		let totalPlayers = 0;

		for (let i = 0; i < discordUsers.length; i++) {
			let discordUser = discordUsers[i];

			if (discordUser.osuRank && parseInt(discordUser.osuRank) >= parseInt(args[0]) && parseInt(discordUser.osuRank) <= parseInt(args[1]) && discordUser.osuDuelStarRating) {
				totalRating += parseFloat(discordUser.osuDuelStarRating);
				totalPlayers++;
			}
		}

		let averageRating = totalRating / totalPlayers;

		return await interaction.editReply(`The average rating for players ranked ${args[0]} to ${args[1]} is ${averageRating.toFixed(2)}`);
	},
};