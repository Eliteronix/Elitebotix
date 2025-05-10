const { DBDiscordUsers } = require('../../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'remainingUsers',
	usage: 'None',
	async execute(interaction) {
		let count = await DBDiscordUsers.count({
			where: {
				osuUserId: {
					[Op.not]: null
				},
				userId: null,
				osuRank: null,
				nextOsuPPUpdate: {
					[Op.eq]: null
				},
			},
		});

		return await interaction.editReply(`Remaining users: ${count}`);
	},
};