const { DBProcessQueue, DBElitiriCupSignUp } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { currentElitiriCup } = require('../../config.json');

module.exports = {
	name: 'updateElitiriPlayer',
	usage: '<osuUserId>',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/updateElitiriPlayer.js DBElitiriCupSignUp');
		let DBElitiriSignup = await DBElitiriCupSignUp.findOne({
			where: {
				tournamentName: currentElitiriCup,
				osuUserId: interaction.options.getString('argument')
			}
		});

		logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue');
		const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignup.userId } });
		if (!existingTask) {
			logDatabaseQueries(4, 'commands/admin/updateElitiriPlayer.js DBProcessQueue create');
			DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignup.userId });
		}
	},
};