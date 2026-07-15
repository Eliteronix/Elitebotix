const { DBOsuMultiMatches } = require('../../dbObjects');
const sequelize = require('sequelize');
const { Op } = require('sequelize');

module.exports = {
	name: 'oldestUnverifiedMatchesCount',
	usage: 'None',
	async execute(interaction) {
		let matchToVerify = await DBOsuMultiMatches.findOne({
			attributes: [[sequelize.col('updatedat'), 'updatedAt']],
			where: {
				tourneyMatch: true,
				verifiedAt: null,
				matchEndDate: {
					[Op.not]: null,
				},
			},
			order: [
				['updatedat', 'ASC']
			]
		});

		if (!matchToVerify) {
			await interaction.editReply('There are no unverified matches left to verify.');
			return;
		}

		let count = await DBOsuMultiMatches.count({
			where: {
				tourneyMatch: true,
				verifiedAt: null,
				matchEndDate: {
					[Op.not]: null,
				},
				updatedat: {
					[Op.lte]: matchToVerify.updatedAt,
				},
			},
		});

		await interaction.editReply(`There are ${count} unverified matches with the oldest update date.`);
	},
};