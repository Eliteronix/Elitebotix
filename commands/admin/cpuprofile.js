const { logBroadcastEval } = require('../../config.json');
const { pause } = require('../../utils');

module.exports = {
	name: 'cpuprofile',
	usage: '<seconds>',
	async execute(interaction) {
		let seconds = 30;

		if (interaction.options.get('argument')) {
			seconds = parseInt(interaction.options.get('argument').value);
		}

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting commands/admin/cpuprofile.js to shards...');
		}

		await interaction.client.shard.broadcastEval(async (c, { seconds }) => {
			const inspector = require('inspector');
			const fs = require('fs');
			const { pause } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

			const session = new inspector.Session();
			session.connect();

			session.post('Profiler.enable', () => {
				session.post('Profiler.start', async () => {

					await pause(seconds * 1000);

					session.post('Profiler.stop', (err, { profile }) => {
						// Write profile to disk, upload, etc.
						if (!err) {
							//Check if the maps folder exists and create it if necessary
							if (!fs.existsSync('./profiles')) {
								fs.mkdirSync('./profiles');
							}

							fs.writeFileSync(`./profiles/profile${c.shardId}.cpuprofile`, JSON.stringify(profile));
						}
					});
				});
			});
		}, { context: { seconds: seconds } });

		await pause(seconds * 1000);

		await interaction.editReply(`Finished profiling for ${seconds} seconds`);
	},
};