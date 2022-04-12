const { logDatabaseQueries, getScoreModpool, getMods, getModBits } = require('./utils');
const { DBOsuMultiScores, DBOsuBeatmaps } = require('./dbObjects');

// eslint-disable-next-line no-undef
process.on('message', async (message) => {
	let match = JSON.parse(message);

	let tourneyMatch = false;
	if (match.name.toLowerCase().match(/.+:.+vs.+/g)) {
		tourneyMatch = true;
	}

	for (let gameIndex = 0; gameIndex < match.games.length; gameIndex++) {
		//Define if the game is freemod or not
		let freeMod = false;
		for (let i = 0; i < match.games[gameIndex].scores.length; i++) {
			if (match.games[gameIndex].scores[i].raw_mods) {
				freeMod = true;
				break;
			}
		}

		let forceMod = true;

		if (!freeMod) {
			forceMod = false;
		}

		for (let i = 0; i < match.games[gameIndex].scores.length; i++) {
			if (parseInt(match.games[gameIndex].scores[i].score) >= 10000 && forceMod) {
				//Remove DT and NC from scoreMods
				let scoreMods = getMods(match.games[gameIndex].scores[i].raw_mods);
				for (let j = 0; j < scoreMods.length; j++) {
					if (scoreMods[j] === 'DT' || scoreMods[j] === 'NC') {
						scoreMods.splice(j, 1);
						j--;
					}
				}
				scoreMods = getModBits(scoreMods.join(''));

				if (scoreMods <= 1) {
					forceMod = false;
				}
			}
		}

		console.log(`${match.name} - ${match.games[gameIndex].beatmapId} - ${forceMod} - ${freeMod}`);

		for (let scoreIndex = 0; scoreIndex < match.games[gameIndex].scores.length; scoreIndex++) {
			//Calculate evaluation
			let evaluation = null;

			let gameScores = [];
			for (let i = 0; i < match.games[gameIndex].scores.length; i++) {
				gameScores.push(match.games[gameIndex].scores[i]);
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
					if (!(gameScores.length % 2 === 0 && match.games[gameIndex].scores[scoreIndex].userId === gameScores[j].userId)) {
						sortedScores.push(gameScores[j].score);
					}
				}

				const middleScore = getMiddleScore(sortedScores);

				for (let i = 0; i < gameScores.length; i++) {
					if (match.games[gameIndex].scores[scoreIndex].userId === gameScores[i].userId && gameScores.length > 1) {
						evaluation = 1 / parseInt(middleScore) * parseInt(gameScores[i].score);
					}
				}
			}

			try {
				//Remove DT and NC from scoreMods
				let scoreMods = getMods(match.games[gameIndex].scores[scoreIndex].raw_mods);
				for (let i = 0; i < scoreMods.length; i++) {
					if (scoreMods[i] === 'DT' || scoreMods[i] === 'NC') {
						scoreMods.splice(i, 1);
						i--;
					}
				}
				scoreMods = getModBits(scoreMods.join(''));

				//Add score to db
				logDatabaseQueries(2, 'saveosuMultiScores.js');
				const existingScore = await DBOsuMultiScores.findOne({
					where: {
						osuUserId: match.games[gameIndex].scores[scoreIndex].userId,
						matchId: match.id,
						gameId: match.games[gameIndex].id,
					}
				});

				if (!existingScore) {
					let score = await DBOsuMultiScores.create({
						osuUserId: match.games[gameIndex].scores[scoreIndex].userId,
						matchId: match.id,
						matchName: match.name,
						gameId: match.games[gameIndex].id,
						scoringType: match.games[gameIndex].scoringType,
						mode: match.games[gameIndex].mode,
						beatmapId: match.games[gameIndex].beatmapId,
						tourneyMatch: tourneyMatch,
						evaluation: evaluation,
						score: match.games[gameIndex].scores[scoreIndex].score,
						gameRawMods: match.games[gameIndex].raw_mods,
						rawMods: scoreMods,
						matchStartDate: match.raw_start,
						matchEndDate: match.raw_end,
						gameStartDate: match.games[gameIndex].raw_start,
						gameEndDate: match.games[gameIndex].raw_end,
						freeMod: freeMod,
						forceMod: forceMod,
						maxCombo: match.games[gameIndex].scores[scoreIndex].maxCombo,
						count50: match.games[gameIndex].scores[scoreIndex].counts['50'],
						count100: match.games[gameIndex].scores[scoreIndex].counts['100'],
						count300: match.games[gameIndex].scores[scoreIndex].counts['300'],
						countMiss: match.games[gameIndex].scores[scoreIndex].counts.miss,
						countKatu: match.games[gameIndex].scores[scoreIndex].counts.katu,
						countGeki: match.games[gameIndex].scores[scoreIndex].counts.geki,
						perfect: match.games[gameIndex].scores[scoreIndex].perfect,
					});

					//Set the tournament flags on the corresponding beatmap
					if (tourneyMatch && !match.name.startsWith('MOTD:')) {
						let dbBeatmaps = await DBOsuBeatmaps.findAll({
							where: {
								beatmapId: match.games[gameIndex].beatmapId,
							}
						});

						for (let i = 0; i < dbBeatmaps.length; i++) {
							if (!dbBeatmaps[i].tourneyMap) {
								dbBeatmaps[i].tourneyMap = true;
								await dbBeatmaps[i].save({ silent: true });
							}

							if (getScoreModpool(score) === 'NM' && !dbBeatmaps[i].noModMap) {
								dbBeatmaps[i].noModMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpool(score) === 'HD' && !dbBeatmaps[i].hiddenMap) {
								dbBeatmaps[i].hiddenMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpool(score) === 'HR' && !dbBeatmaps[i].hardRockMap) {
								dbBeatmaps[i].hardRockMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpool(score) === 'DT' && !dbBeatmaps[i].doubleTimeMap) {
								dbBeatmaps[i].doubleTimeMap = true;
								await dbBeatmaps[i].save({ silent: true });
							} else if (getScoreModpool(score) === 'FM' && !dbBeatmaps[i].freeModMap) {
								dbBeatmaps[i].freeModMap = true;
								await dbBeatmaps[i].save({ silent: true });
							}
						}
					}
				} else if (existingScore.forceMod === null) {
					existingScore.maxCombo = match.games[gameIndex].scores[scoreIndex].maxCombo;
					existingScore.count50 = match.games[gameIndex].scores[scoreIndex].counts['50'];
					existingScore.count100 = match.games[gameIndex].scores[scoreIndex].counts['100'];
					existingScore.count300 = match.games[gameIndex].scores[scoreIndex].counts['300'];
					existingScore.countMiss = match.games[gameIndex].scores[scoreIndex].counts.miss;
					existingScore.countKatu = match.games[gameIndex].scores[scoreIndex].counts.katu;
					existingScore.countGeki = match.games[gameIndex].scores[scoreIndex].counts.geki;
					existingScore.perfect = match.games[gameIndex].scores[scoreIndex].perfect;
					existingScore.teamType = match.games[gameIndex].teamType;
					existingScore.team = match.games[gameIndex].scores[scoreIndex].team;
					existingScore.freeMod = freeMod;
					existingScore.forceMod = forceMod;
					await existingScore.save();
				}
			} catch (error) {
				scoreIndex--;
			}
		}
	}

	// eslint-disable-next-line no-undef
	process.send('done');
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