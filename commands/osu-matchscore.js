const osu = require('node-osu');
const { createLeaderboard, getIDFromPotentialOsuLink, saveOsuMultiScores, getMods, getOsuPlayerName } = require('../utils');
const { PermissionsBitField } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-matchscore',
	description: 'Sends an evaluation of how valuable all the players in the match were',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'osu',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let matchId = interaction.options.getString('match');
		let customWarmups = interaction.options.getInteger('warmups');
		let calculation = 'mixed';

		if (interaction.options.getString('calculation')) {
			calculation = interaction.options.getString('calculation');
		}

		let skiplast = 0;

		if (interaction.options.getInteger('skiplast')) {
			skiplast = interaction.options.getInteger('skiplast');
		}

		let ezmultiplier = 1.7;

		if (interaction.options.getNumber('ezmultiplier')) {
			ezmultiplier = interaction.options.getNumber('ezmultiplier');
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		if (isNaN(matchId)) {
			if (matchId.startsWith('https://osu.ppy.sh/community/matches/') || matchId.startsWith('https://osu.ppy.sh/mp/')) {
				matchId = getIDFromPotentialOsuLink(matchId);
			} else {
				return await interaction.editReply('You didn\'t provide a valid match ID or URL.');
			}
		}

		osuApi.getMatch({ mp: matchId })
			.then(async (match) => {
				saveOsuMultiScores(match);
				let warmups = 2;
				let warmupsReason = `Assumed ${warmups} warmups.`;
				if (customWarmups !== null) {
					warmups = customWarmups;
					warmupsReason = `${warmups} warmups were specified.`;
				}


				//Remove warmups from the list
				for (let i = 0; i < match.games.length && i < warmups; i++) {
					match.games.splice(0, 1);
				}

				//Remove last game if specified
				let skiplastReason = '';
				if (skiplast) {
					for (let i = 0; i < skiplast && match.games.length > 0; i++) {
						match.games.splice(match.games.length - 1, 1);
					}
					skiplastReason = `Removed the last ${skiplast} maps.\n`;
				}

				if (match.games.length === 0) {
					return await interaction.editReply(`${warmupsReason}\n${skiplastReason}There seems to be no maps left after removing the warmups.`);
				}

				let playerMatchResults = [];

				let redScore = 0;
				let blueScore = 0;

				for (let i = 0; i < match.games.length; i++) {
					let gameScores = match.games[i].scores;

					if (gameScores.length > 1) {
						//Apply ez multiplier if necessary
						for (let i = 0; i < gameScores.length; i++) {
							//Only individual mods have to be checked because the matchscore is relative anyway so it won't matter if everyone plays ez or not
							if (getMods(gameScores[i].raw_mods).includes('EZ')) {
								gameScores[i].score *= ezmultiplier;
							}
						}

						//Get the scores of the teams
						let blueScores = gameScores.filter(score => score.team === 'Blue');
						let redScores = gameScores.filter(score => score.team === 'Red');

						if (blueScores.length || redScores.length) {
							let blueTotalScore = 0;
							for (let i = 0; i < blueScores.length; i++) {
								blueTotalScore += parseInt(blueScores[i].score);
							}

							let redTotalScore = 0;
							for (let i = 0; i < redScores.length; i++) {
								redTotalScore += parseInt(redScores[i].score);
							}

							if (blueTotalScore > redTotalScore) {
								blueScore++;
							} else if (redTotalScore > blueTotalScore) {
								redScore++;
							}
						} else if (gameScores.length === 2) {
							//Head to head
							let playerNames = match.name.split(/\) ?vs.? ?\(/gm);
							//basically a check if its a tourney match (basically)
							if (playerNames[1]) {
								let redPlayer = playerNames[0].replace(/.+\(/gm, '');
								let bluePlayer = playerNames[1].replace(')', '');

								let redTotal = null;
								let blueTotal = null;

								for (let j = 0; j < gameScores.length; j++) {
									gameScores[j].username = await getOsuPlayerName(gameScores[j].userId);
									if (gameScores[j].username === redPlayer) {
										redTotal = parseInt(gameScores[j].score);
									}

									if (gameScores[j].username === bluePlayer) {
										blueTotal = parseInt(gameScores[j].score);
									}
								}

								if (blueTotal > redTotal) {
									blueScore++;
								} else if (blueTotal < redTotal) {
									redScore++;
								}
							}
						}

						quicksort(gameScores);

						for (let j = 0; j < gameScores.length; j++) {
							if (parseInt(gameScores[j].score) < 10000) {
								gameScores.splice(j, 1);
								j--;
							}
						}

						for (let j = 0; j < gameScores.length; j++) {
							let sortedScores = [];
							for (let k = 0; k < gameScores.length; k++) {
								//Remove the own score to make it odd for the middle score
								if (!(gameScores.length % 2 === 0 && gameScores[j].userId === gameScores[k].userId)) {
									sortedScores.push(gameScores[k].score);
								}
							}

							const middleScore = getMiddleScore(sortedScores);

							let existingScore = null;

							for (let k = 0; k < playerMatchResults.length; k++) {
								if (gameScores[j].userId === playerMatchResults[k].userId) {
									existingScore = playerMatchResults[k];
									k = playerMatchResults.length;
								}
							}

							if (existingScore) {
								existingScore.playedRounds += 1;
								existingScore.score += 1 / parseInt(middleScore) * parseInt(gameScores[j].score);

								if (j === 0) {
									existingScore.wins += 1;
								}

								if (gameScores[j].team === 'Blue') {
									existingScore.color = '#3498DB';
								} else if (gameScores[j].team === 'Red') {
									existingScore.color = '#CF252D';
								}
							} else {
								let newScore = {
									userId: gameScores[j].userId,
									playedRounds: 1,
									score: 1 / parseInt(middleScore) * parseInt(gameScores[j].score),
									wins: 0
								};

								if (j === 0) {
									newScore.wins = 1;
								}

								if (gameScores[j].team === 'Blue') {
									newScore.color = '#3498DB';
								} else if (gameScores[j].team === 'Red') {
									newScore.color = '#CF252D';
								}

								playerMatchResults.push(newScore);
							}
						}
					}
				}

				let valueType = 'summed';
				let valueHint = 'Players were judged across the whole match making players that play more often more valuable. (Favors all-rounders)';

				if (calculation === 'avg') {
					for (let i = 0; i < playerMatchResults.length; i++) {
						playerMatchResults[i].score = playerMatchResults[i].score / playerMatchResults[i].playedRounds;
					}

					valueType = 'average';
					valueHint = 'Players were judged across only the maps they played making players that play less often more valuable. (Favors niche players)';
				} else if (calculation === 'mixed') {
					for (let i = 0; i < playerMatchResults.length; i++) {
						playerMatchResults[i].score = playerMatchResults[i].score / playerMatchResults[i].playedRounds;

						playerMatchResults[i].score = playerMatchResults[i].score * (0.8 + 0.2 * playerMatchResults[i].playedRounds);
					}

					valueType = 'mixed';
					valueHint = 'Players were judged across the whole match making players that play more often more valuable. (Middle ground between all-rounders and niche players)';
				}

				if (playerMatchResults.length === 0) {
					return await interaction.editReply('No rounds with at least 2 players found in the match.');
				}

				quicksort(playerMatchResults);

				let sortedPlayerMatchResults = [];
				for (let i = 0; i < playerMatchResults.length; i++) {
					sortedPlayerMatchResults.push(playerMatchResults[i].score);
				}

				const middleScore = getMiddleScore(sortedPlayerMatchResults);

				for (let i = 0; i < playerMatchResults.length; i++) {
					playerMatchResults[i].score = 1 / parseFloat(middleScore) * parseFloat(playerMatchResults[i].score);
				}

				let leaderboardData = [];

				for (let i = 0; i < playerMatchResults.length; i++) {
					let dataset = {
						name: await getOsuPlayerName(playerMatchResults[i].userId),
						value: `${Math.round(playerMatchResults[i].score * 100) / 100} ${valueType} over ${playerMatchResults[i].playedRounds} maps (${playerMatchResults[i].wins}x #1)`,
						color: playerMatchResults[i].color,
					};

					leaderboardData.push(dataset);
				}

				const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${match.name}`, `osu-match-${match.name}.png`);

				let finalScore = '';

				if (redScore || blueScore) {
					finalScore = `\n\n**Final score:** \`${redScore} - ${blueScore}\``;
				}

				//Send attachment
				return await interaction.editReply({ content: `The leaderboard shows the evaluation of the players that participated in the match.\n${warmupsReason}\n${skiplastReason}${valueHint}\n<https://osu.ppy.sh/community/matches/${match.id}>${finalScore}`, files: [attachment] });
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					return await interaction.editReply(`Could not find match \`${matchId.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	},
};

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

	return (parseFloat(scores[0]) + parseFloat(scores[1])) / 2;
}