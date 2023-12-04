const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'remainingUsers',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/remainingUsers.js DBDiscordUsers');
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