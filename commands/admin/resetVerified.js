const { DBOsuMultiScores } = require('../../dbObjects');
const { Op } = require('sequelize');
const { getOsuPlayerName } = require('../../utils');

module.exports = {
	name: 'resetVerified',
	usage: '<incomplete/all/osuUserId>',
	async execute(interaction) {
		if (!interaction.options.getString('argument')) {
			return interaction.reply('Please provide an argument.');
		}

		const argument = interaction.options.getString('argument');

		if (argument === 'incomplete') {
			let count = DBOsuMultiScores.update({
				verifiedBy: null,
				verificationComment: null,
			}, {
				where: {
					verifiedBy: {
						[Op.ne]: null,
					},
					verifiedAt: null,
				},
			});

			return await interaction.editReply(`Reset all ${count} incomplete Elitebotix verifications.`);
		} else if (argument === 'all') {
			let count = DBOsuMultiScores.update({
				verifiedBy: null,
				verifiedAt: null,
				verificationComment: null,
			}, {
				where: {
					verifiedBy: {
						[Op.eq]: 31050083,
					},
				},
			});

			return await interaction.editReply(`Reset all ${count} Elitebotix verifications.`);
		} else {
			let count = DBOsuMultiScores.update({
				verifiedBy: null,
				verifiedAt: null,
				verificationComment: null,
			}, {
				where: {
					verifiedBy: {
						[Op.eq]: argument,
					},
				},
			});

			let playerName = await getOsuPlayerName(argument);

			return await interaction.editReply(`Reset all ${count} verifications by ${playerName}.`);
		}
	},
};