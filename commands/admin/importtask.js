const { DBProcessQueue } = require('../../dbObjects');

module.exports = {
	name: 'importtask',
	usage: '<matchId>',
	async execute(interaction) {
		const matchId = interaction.options.getString('argument');

		DBProcessQueue.create({
			guildId: 'None',
			task: 'importMatch',
			additions: `${matchId};1;${new Date()};Placeholder`,
			priority: 1,
			date: new Date()
		});

		await interaction.followUp(`Created import task for match ${matchId}.`);
	},
};