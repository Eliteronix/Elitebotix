const { logBroadcastEval } = require('../../config.json');

module.exports = {
	name: 'removeUpdateFlag',
	usage: 'None',
	async execute(interaction) {

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting commands/admin/removeUpdateFlag.js to shards...');
		}

		// eslint-disable-next-line no-empty-pattern
		await interaction.client.shard.broadcastEval(async (c, { }) => {
			c.update = 0;
		}, { context: {} });

		return await interaction.editReply('Removed update flag.');
	},
};