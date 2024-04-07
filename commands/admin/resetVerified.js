const { DBOsuMultiMatches } = require('../../dbObjects');
const { Op } = require('sequelize');
const { getOsuPlayerName, logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'resetVerified',
	usage: '<incomplete/all/osuUserId>',
	async execute(interaction) {
		if (!interaction.options.getString('argument')) {
			return await interaction.reply('Please provide an argument.');
		}

		const argument = interaction.options.getString('argument');

		if (argument === 'incomplete') {
			logDatabaseQueries(4, 'commands/admin/resetVerified.js DBOsuMultiMatches incomplete');
			let count = await DBOsuMultiMatches.update({
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
			logDatabaseQueries(4, 'commands/admin/resetVerified.js DBOsuMultiMatches all');
			let count = await DBOsuMultiMatches.update({
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
		} else if (argument === 'o!mm incomplete') {
			logDatabaseQueries(4, 'commands/admin/resetVerified.js DBOsuMultiMatches all');
			let count = await DBOsuMultiMatches.update({
				verifiedBy: null,
				verifiedAt: null,
				verificationComment: null,
			}, {
				where: {
					verifiedBy: {
						[Op.eq]: 31050083,
					},
					verificationComment: 'Not determinable if match was created by MaidBot',
				},
			});

			return await interaction.editReply(`Reset all ${count} o!mm incomplete Elitebotix verifications.`);
		} else {
			logDatabaseQueries(4, 'commands/admin/resetVerified.js DBOsuMultiMatches osuUserId');
			let count = await DBOsuMultiMatches.update({
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