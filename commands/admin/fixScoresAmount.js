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

		gamesWithMissingData = gamesWithMissingData.slice(0, 25000);

		gamesWithMissingData = gamesWithMissingData.map(game => game.gameId);

		await interaction.followUp(`Grabbing scores for ${gamesWithMissingData.length} games.`);

		let scores = await DBOsuMultiGameScores.findAll({
			where: {
				gameId: {
					[Op.in]: gamesWithMissingData
				},
				score: {
					[Op.gte]: 10000
				}
			},
			group: ['gameId', 'osuUserId'],
		});

		await interaction.followUp(`Scores grabbed: ${scores.length}`);

		let gameScoreAmounts = [];

		for (let i = 0; i < gamesWithMissingData.length; i++) {
			if (i % 250 === 0) {
				await new Promise(resolve => setTimeout(resolve, 1000));
			}

			let game = gamesWithMissingData[i];
			let scoresCount = scores.length;
			scores = scores.filter(score => score.gameId !== game);
			scoresCount = scoresCount - scores.length;

			gameScoreAmounts.push({
				gameId: game,
				amount: scoresCount,
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

			try {
				await interaction.followUp(`Updated ${updated} games with ${scoresAmount} scores each`);
			} catch (error) {
				await interaction.channel.send(`Updated ${updated} games with ${scoresAmount} scores each`);
			}

			gameScoreAmounts = gameScoreAmounts.filter(game => game.amount !== scoresAmount);
		}

		return await interaction.followUp('Finished updating the batch.');
	},
};