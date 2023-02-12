module.exports = {
	name: 'removeUpdateFlag',
	usage: 'None',
	async execute(interaction) {
		// eslint-disable-next-line no-empty-pattern
		await interaction.client.shard.broadcastEval(async (c, { }) => {
			c.update = 0;
		}, { context: {} });

		return await interaction.editReply('Removed update flag.');
	},
};