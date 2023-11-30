/* eslint-disable no-console */
// eslint-disable-next-line no-console
console.log('Migrating database...');
const { DBOsuMultiScores, DBOsuMultiGameScores, DBOsuMultiGames, DBOsuMultiMatches } = require('./dbObjects');
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

	console.log(`Found ${multiScoresData.length} multi scores to migrate... -> Translating...`);

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

		if (multiScore.referee && isNaN(multiScore.referee)) {
			multiScore.referee = -1;
		}

		return multiScore;
	});

	console.log('Updated scoringType, teamType and mode... -> Migrating to new scores table...');

	await DBOsuMultiGameScores.bulkCreate(multiScoresData);

	console.log(`Done migrating ${multiScoresData.length} scores...`);

	// Reduce to one score per gameId
	let multiGamesData = [];
	let gameIds = [];
	let currentGameId = multiScoresData[0].gameId;
	let currentGameScoreCount = 1;
	for (let i = 0; i < multiScoresData.length; i++) {
		if (i % 1000 === 0 && i) {
			console.log(`Found ${gameIds.length} games after ${i} scores...`);
		}

		if (currentGameId !== multiScoresData[i].gameId) {
			multiGamesData[multiGamesData.length - 1].scores = currentGameScoreCount;
			currentGameId = multiScoresData[i].gameId;
			currentGameScoreCount = 0;
		}

		if (parseInt(multiScoresData[i].score) >= 10000) {
			currentGameScoreCount++;
		}

		if (!gameIds.includes(multiScoresData[i].gameId)) {
			gameIds.push(multiScoresData[i].gameId);
			multiGamesData.push(multiScoresData[i]);
		}
	}

	multiGamesData[multiGamesData.length - 1].scores = currentGameScoreCount;

	console.log(`Found ${gameIds.length} games...`);

	await DBOsuMultiGames.bulkCreate(multiGamesData);

	console.log(`Done migrating ${multiGamesData.length} games...`);

	// Reduce to one score per matchId
	let multiMatchData = [];
	let matchIds = [];
	for (let i = 0; i < multiGamesData.length; i++) {
		if (i % 1000 === 0 && i) {
			console.log(`Found ${matchIds.length} matches after ${i} games...`);
		}

		if (!matchIds.includes(multiGamesData[i].matchId)) {
			matchIds.push(multiGamesData[i].matchId);
			multiMatchData.push(multiGamesData[i]);
		}
	}

	await DBOsuMultiMatches.bulkCreate(multiMatchData);

	console.log(`Done migrating ${multiMatchData.length} matches...`);
})();