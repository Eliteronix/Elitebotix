const { logDatabaseQueries } = require('./utils');
const { DBOsuMultiScores } = require('./dbObjects');

// eslint-disable-next-line no-undef
process.on('message', (message) => {
	let match = JSON.parse(message);

	console.log(match);

	let tourneyMatch = false;
	if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
		tourneyMatch = true;
	}
	match.games.forEach(game => {
		//Define if the game is freemod or not
		let freeMod = false;
		if (game.scores[0]) {
			let rawMods = game.scores[0].raw_mods;
			for (let i = 0; i < game.scores.length; i++) {
				if (rawMods !== game.scores[i].raw_mods) {
					freeMod = true;
					break;
				}
			}
		}

		game.scores.forEach(async (score) => {
			//Calculate evaluation
			let evaluation = null;

			let gameScores = [];
			for (let i = 0; i < game.scores.length; i++) {
				gameScores.push(game.scores[i]);
			}

			if (gameScores.length > 1) {
				quicksort(gameScores);

				for (let i = 0; i < gameScores.length; i++) {
					if (parseInt(gameScores[i].score) < 10000) {
						gameScores.splice(i, 1);
						i--;
					}
				}

				let sortedScores = [];
				for (let j = 0; j < gameScores.length; j++) {
					//Remove the own score to make it odd for the middle score
					if (!(gameScores.length % 2 === 0 && score.userId === gameScores[j].userId)) {
						sortedScores.push(gameScores[j].score);
					}
				}

				const middleScore = getMiddleScore(sortedScores);

				for (let i = 0; i < gameScores.length; i++) {
					if (score.userId === gameScores[i].userId && gameScores.length > 1) {
						evaluation = 1 / parseInt(middleScore) * parseInt(gameScores[i].score);
					}
				}
			}

			//Add score to db
			logDatabaseQueries(2, 'saveosuMultiScores.js');
			const existingScore = await DBOsuMultiScores.findOne({
				where: {
					osuUserId: score.userId,
					matchId: match.id,
					gameId: game.id,
				}
			});

			if (!existingScore) {
				DBOsuMultiScores.create({
					osuUserId: score.userId,
					matchId: match.id,
					matchName: match.name,
					gameId: game.id,
					scoringType: game.scoringType,
					mode: game.mode,
					beatmapId: game.beatmapId,
					tourneyMatch: tourneyMatch,
					evaluation: evaluation,
					score: score.score,
					gameRawMods: game.raw_mods,
					rawMods: score.raw_mods,
					matchStartDate: match.raw_start,
					matchEndDate: match.raw_end,
					gameStartDate: game.raw_start,
					gameEndDate: game.raw_end,
					freeMod: freeMod,
				});
			}
		});
	});
});


function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].score) >= parseFloat(pivot.score)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}

function getMiddleScore(scores) {
	if (scores.length % 2) {
		//Odd amount of scores
		const middleIndex = scores.length - Math.round(scores.length / 2);
		return scores[middleIndex];
	}

	while (scores.length > 2) {
		scores.splice(0, 1);
		scores.splice(scores.length - 1, 1);
	}

	return (parseInt(scores[0]) + parseInt(scores[1])) / 2;
}