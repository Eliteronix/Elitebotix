/* eslint-disable no-console */
// eslint-disable-next-line no-console
console.log('Migrating database...');
const { DBOsuMultiScores, DBOsuMultiGameScores } = require('./dbObjects');
(async () => {
	let multiScoresData = await DBOsuMultiScores.findAll({
		attributes: [
			'osuUserId',
			'matchId',
			'matchName',
			'referee',
			'gameId',
			'scoringType',
			'mode',
			'beatmapId',
			'tourneyMatch',
			'evaluation',
			'score',
			'gameRawMods',
			'rawMods',
			'matchStartDate',
			'matchEndDate',
			'gameStartDate',
			'gameEndDate',
			'freeMod',
			'forceMod',
			'warmup',
			'warmupDecidedByAmount',
			'maxCombo',
			'count50',
			'count100',
			'count300',
			'countMiss',
			'countKatu',
			'countGeki',
			'perfect',
			'teamType',
			'team',
			'pp',
			'verifiedAt',
			'verifiedBy',
			'verificationComment'
		]
	});

	multiScoresData = multiScoresData.map((multiScore) => multiScore.dataValues);

	// Translate scoringType, teamType and mode to numbers
	multiScoresData = multiScoresData.map((multiScore) => {
		if (multiScore.scoringType === 'Score') {
			multiScore.scoringType = 0;
		} else if (multiScore.scoringType === 'Accuracy') {
			multiScore.scoringType = 1;
		} else if (multiScore.scoringType === 'Combo') {
			multiScore.scoringType = 2;
		} else if (multiScore.scoringType === 'Score v2') {
			multiScore.scoringType = 3;
		}

		if (multiScore.teamType === 'Head to Head') {
			multiScore.teamType = 0;
		} else if (multiScore.teamType === 'Tag Co-op') {
			multiScore.teamType = 1;
		} else if (multiScore.teamType === 'Team vs') {
			multiScore.teamType = 2;
		} else if (multiScore.teamType === 'Tag Team vs') {
			multiScore.teamType = 3;
		}

		if (multiScore.mode === 'Standard') {
			multiScore.mode = 0;
		} else if (multiScore.mode === 'Taiko') {
			multiScore.mode = 1;
		} else if (multiScore.mode === 'Catch the Beat') {
			multiScore.mode = 2;
		} else if (multiScore.mode === 'Mania') {
			multiScore.mode = 3;
		}

		// TODO: Referee is currently a string when unavailable

		return multiScore;
	});

	console.log(multiScoresData);

	await DBOsuMultiGameScores.bulkCreate(multiScoresData);

	console.log('Done migrating scores...');

	// Reduce to one score per gameId
	let multiGamesData = [];
	let gameIds = [];
	for (let i = 0; i < multiScoresData.length; i++) {
		if (!gameIds.includes(multiScoresData[i].gameId)) {
			gameIds.push(multiScoresData[i].gameId);
			multiGamesData.push(multiScoresData[i]);
		}
	}

	console.log(multiGamesData);

	//TODO: Bulk import games and matches
})();