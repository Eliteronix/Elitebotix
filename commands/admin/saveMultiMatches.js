const { DBProcessQueue } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'saveMultiMatches',
	usage: '<matchId>',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/saveMultiMatches.js DBProcessQueue destroy');
		await DBProcessQueue.destroy({ where: { task: 'saveMultiMatches' } });

		let now = new Date();
		logDatabaseQueries(4, 'commands/admin/saveMultiMatches.js DBProcessQueue create');
		await DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: interaction.options.getString('argument'), priority: 2, date: now });

		await interaction.editReply('Added new saveMultiMatches task to process queue.');
	},
};