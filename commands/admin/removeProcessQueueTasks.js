const { DBProcessQueue } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'removeProcessQueueTasks',
	usage: '[id]',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/removeProcessQueueTasks.js DBProcessQueue');

		const ids = interaction.options.getString('argument').split(/ +/gm);

		const deleted = await DBProcessQueue.destroy({
			where: {
				id: {
					[Op.in]: ids,
				},
			}
		});

		await interaction.followUp(`Deleted ${deleted} processqueue entries.`);
	},
};