const { DBProcessQueue } = require('../../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'removeProcessQueueTasks',
	usage: '[id]',
	async execute(interaction) {
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