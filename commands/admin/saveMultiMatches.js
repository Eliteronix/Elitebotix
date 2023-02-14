const { DBProcessQueue } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'saveMultiMatches',
	usage: '<matchId>',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/saveMultiMatches.js DBProcessQueue');
		const processQueueTasks = await DBProcessQueue.findAll({ where: { task: 'saveMultiMatches' } });
		for (let i = 0; i < processQueueTasks.length; i++) {
			await processQueueTasks[i].destroy();
		}

		let now = new Date();
		logDatabaseQueries(4, 'commands/admin/saveMultiMatches.js DBProcessQueue create');
		await DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: interaction.options.getString('argument'), priority: 2, date: now });

		await interaction.editReply('Added new saveMultiMatches task to process queue.');
	},
};