const { DBOsuMultiMatches } = require('../../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'oldestUnverifiedMatchesCount',
	usage: 'None',
	async execute(interaction) {
		let matchToVerify = await DBOsuMultiMatches.findOne({
			attributes: ['updatedAt'],
			where: {
				tourneyMatch: true,
				verifiedAt: null,
				matchEndDate: {
					[Op.not]: null,
				},
			},
			order: [
				['updatedAt', 'ASC']
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
				updatedAt: {
					[Op.lte]: matchToVerify.updatedAt,
				},
			},
		});

		await interaction.editReply(`There are ${count} unverified matches with the oldest update date.`);
	},
};