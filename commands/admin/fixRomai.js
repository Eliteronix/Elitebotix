const { DBOsuMultiMatches } = require('../../dbObjects');

module.exports = {
	name: 'fixRomai',
	usage: 'None',
	async execute(interaction) {
		let unverifiedRomaiMatches = await DBOsuMultiMatches.update({
			verifiedBy: null,
			verifiedAt: null,
			verificationComment: null,
		}, {
			where: {
				verifiedBy: 31050083,
				verificationComment: 'Match not created by DarkerSniper',
				referee: 38024038
			},
		});

		await interaction.editReply(`Updated ${unverifiedRomaiMatches.length} unverified Romai matches.`);
	},
};