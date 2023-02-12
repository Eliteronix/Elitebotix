const { DBProcessQueue } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'removeProcessQueueTask',
	usage: '<id>',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/removeProcessQueueTask.js DBProcessQueue');
		await DBProcessQueue.destroy({
			where: {
				id: interaction.options.getString('argument'),
			}
		});

		await interaction.followUp('Deleted the processqueue entry.');
	},
};