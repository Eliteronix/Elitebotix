const { DBOsuMultiMatches } = require('../../dbObjects');

module.exports = {
	name: 'fixRomai',
	usage: 'None',
	async execute(interaction) {
		await interaction.deferReply();

		let unverifiedRomaiMatches = await DBOsuMultiMatches.findAll({
			where: {
				verifiedBy: 31050083,
				verificationComment: 'Match not created by DarkerSniper',
				referee: 38024038
			},
		});

		console.log(unverifiedRomaiMatches);

		await interaction.reply(`Found ${unverifiedRomaiMatches.length} unverified Romai matches.`);
	},
};