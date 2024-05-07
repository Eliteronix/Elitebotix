const { cleanUpDuplicateEntries } = require('../../utils');

module.exports = {
	name: 'cleanUp',
	usage: 'None',
	async execute(interaction) {
		cleanUpDuplicateEntries(interaction.client, true);

		await interaction.editReply('Started cleanup process');
	},
};