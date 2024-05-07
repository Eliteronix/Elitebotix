const { getIDFromPotentialOsuLink } = require('../../utils');

module.exports = {
	name: 'matchtrack',
	usage: '<matchID>',
	async execute(interaction) {
		const matchId = getIDFromPotentialOsuLink(interaction.options.getString('argument'));

		const command = require('../osu-matchtrack.js');

		process.send(`command ${command.name}`);

		command.execute({ id: 1, channel: interaction.channel, author: { id: 1 }, client: interaction.client }, [matchId, '--tracking']);

		await interaction.editReply('Match tracking triggered.');
	},
};