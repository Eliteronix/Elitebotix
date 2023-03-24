const { DBProcessQueue } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'runningMatches',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/runningMatches.js DBProcessQueue runningMatches');
		let importMatchTasks = await DBProcessQueue.findAll({
			attributes: ['additions'],
			where: {
				task: 'importMatch',
			}
		});

		for (let i = 0; i < importMatchTasks.length; i++) {
			await interaction.followUp(`https://osu.ppy.sh/mp/${importMatchTasks[i].additions}`);
		}

		await interaction.followUp(`${importMatchTasks.length} running matches`);
	},
};