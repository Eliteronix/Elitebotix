const { DBOsuMultiMatches } = require('../../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'setReferee',
	usage: '<referee> <matchId>',
	async execute(interaction) {
		const args = interaction.options.getString('argument').split(/ +/);

		const referee = args.shift();

		let count = await DBOsuMultiMatches.update({
			referee: referee,
		}, {
			where: {
				matchId: {
					[Op.in]: args,
				},
			},
		});

		return await interaction.editReply(`Set ${count} matches to reffed by ${referee}.`);
	},
};