const { DBProcessQueue } = require('../../dbObjects');
const { DBElitiriCupSignUp } = require('../../dbObjects');
const { currentElitiriCup } = require('../../config.json');

module.exports = {
	name: 'updateElitiriRanks',
	usage: 'None',
	async execute(interaction) {
		let DBElitiriSignups = await DBElitiriCupSignUp.findAll({
			attributes: ['userId'],
			where: {
				tournamentName: currentElitiriCup
			}
		});

		for (let i = 0; i < DBElitiriSignups.length; i++) {
			const existingTasks = await DBProcessQueue.count({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId } });
			if (existingTasks === 0) {
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId });
			}
		}

		await interaction.editReply('Added all players to updateOsuRank queue');
	},
};