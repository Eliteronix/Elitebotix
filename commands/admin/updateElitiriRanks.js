const { DBProcessQueue } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { DBElitiriCupSignUp } = require('../../dbObjects');
const { currentElitiriCup } = require('../../config.json');

module.exports = {
	name: 'updateElitiriRanks',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBElitiriCupSignUp');
		let DBElitiriSignups = await DBElitiriCupSignUp.findAll({
			where: {
				tournamentName: currentElitiriCup
			}
		});

		for (let i = 0; i < DBElitiriSignups.length; i++) {
			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue');
			const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId } });
			if (!existingTask) {
				logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue create');
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId });
			}
		}

		await interaction.editReply('Added all players to updateOsuRank queue');
	},
};