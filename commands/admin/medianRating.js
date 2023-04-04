const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'medianRating',
	usage: '<minRank> <maxRank>',
	async execute(interaction) {
		const args = interaction.options.getString('argument').split(' ');

		logDatabaseQueries(4, 'commands/admin/medianRating.js DBDiscordUsers medianRating');
		let discordUsers = await DBDiscordUsers.findAll({
			attributes: ['osuDuelStarRating', 'osuRank'],
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

		let validUsers = discordUsers.filter(discordUser => {
			return discordUser.osuRank && parseInt(discordUser.osuRank) >= parseInt(args[0]) && parseInt(discordUser.osuRank) <= parseInt(args[1]) && discordUser.osuDuelStarRating;
		});

		validUsers.sort((a, b) => {
			return a.osuDuelStarRating - b.osuDuelStarRating;
		});

		let medianRating = parseFloat(validUsers[Math.floor(validUsers.length / 2)].osuDuelStarRating);

		return await interaction.editReply(`The median rating for players ranked ${args[0]} to ${args[1]} is ${medianRating.toFixed(2)}`);
	},
};