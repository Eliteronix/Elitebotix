const { DBDiscordUsers } = require('../../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'tournamentBanned',
	usage: 'None',
	async execute(interaction) {
		let discordUsers = await DBDiscordUsers.findAll({
			attributes: ['osuUserId', 'osuName'],
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