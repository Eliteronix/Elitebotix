const { DBOsuMultiGames, DBOsuMultiGameScores } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');

module.exports = {
	name: 'fixScoresAmount',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/fixScoreAmount.js DBOsuMultiGames');
		let gamesWithMissingData = await DBOsuMultiGames.count({
			where: {
				scores: null,
				tourneyMatch: true,
			},
			group: ['gameId'],
		});

		await interaction.followUp(`Games with missing data: ${gamesWithMissingData.length}`);

		gamesWithMissingData = gamesWithMissingData.filter(game => game.count === 1);

		await interaction.followUp(`Games with missing data (without duplicate matches): ${gamesWithMissingData.length}`);

		gamesWithMissingData = gamesWithMissingData.map(game => game.gameId);

		gamesWithMissingData.slice(0, 5000);

		let scores = await DBOsuMultiGameScores.findAll({
			where: {
				gameId: {
					[Op.in]: gamesWithMissingData
				},
			},
			group: ['gameId', 'osuUserId'],
		});

		let gameScoreAmounts = [];

		for (let i = 0; i < gamesWithMissingData.length; i++) {
			let game = gamesWithMissingData[i];
			let gameScores = scores.filter(score => score.gameId === game);

			gameScoreAmounts.push({
				gameId: game,
				amount: gameScores.length,
			});
		}

		gameScoreAmounts.sort((a, b) => {
			return a.amount - b.amount;
		});

		while (gameScoreAmounts.length > 0) {
			let scoresAmount = gameScoreAmounts[0].amount;

			let updated = await DBOsuMultiGames.update({
				scores: scoresAmount,
			}, {
				where: {
					gameId: {
						[Op.in]: gameScoreAmounts.filter(game => game.amount === scoresAmount).map(game => game.gameId),
					},
				}
			});

			await interaction.followUp(`Updated ${updated} games with ${scoresAmount} scores each`);

			gameScoreAmounts = gameScoreAmounts.filter(game => game.amount !== scoresAmount);
		}

		return await interaction.followUp('Finished updating the batch.');
	},
};