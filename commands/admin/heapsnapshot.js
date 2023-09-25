const { logBroadcastEval } = require('../../config.json');

module.exports = {
	name: 'heapsnapshot',
	usage: 'None',
	async execute(interaction) {

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting commands/admin/heapsnapshot.js to shards...');
		}

		// eslint-disable-next-line no-empty-pattern, no-unused-vars
		await interaction.client.shard.broadcastEval(async (c, { }) => {
			const fs = require('fs');

			//Check if the maps folder exists and create it if necessary
			if (!fs.existsSync('./heapSnapshots')) {
				fs.mkdirSync('./heapSnapshots');
			}

			// Save a heap snapshot in ./heapSnapshots with require('v8').writeHeapSnapshot();
			require('v8').writeHeapSnapshot(`./heapSnapshots/heapSnapshot${c.shardId}.heapsnapshot`);
		}, { context: {} });

		await interaction.editReply('Finished creating heap snapshots');
	},
};