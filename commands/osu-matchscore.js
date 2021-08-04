const osu = require('node-osu');
const { getGuildPrefix, createLeaderboard, getIDFromPotentialOsuLink, saveOsuMultiScores, populateMsgFromInteraction } = require('../utils');
const { DBDiscordUsers } = require('../dbObjects');

module.exports = {
	name: 'osu-matchscore',
	aliases: ['osu-match'],
	description: 'Sends an evaluation of how valuable all the players in the match were',
	usage: '<match ID or URL> [# of warmups] [avg]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(additionalObjects[0], interaction);

			args = [];

			for (let i = 0; i < interaction.data.options.length; i++) {
				args.push(interaction.data.options[i].value);
			}
		}
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let matchID = args[0];

		if (isNaN(matchID)) {
			if (args[0].startsWith('https://osu.ppy.sh/community/matches/')) {
				matchID = getIDFromPotentialOsuLink(args[0]);
			} else {
				const guildPrefix = await getGuildPrefix(msg);
				if (msg.id) {
					return msg.channel.send(`You didn't provide a valid match ID or URL.\nUsage: \`${guildPrefix}${this.name} ${this.usage}\``);
				} else {
					return additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
						data: {
							type: 4,
							data: {
								content: `You didn't provide a valid match ID or URL.\nUsage: \`/${this.name} ${this.usage}\``
							}
						}
					});
				}
			}
		}

		osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				saveOsuMultiScores(match);
				await additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
					data: {
						type: 4,
						data: {
							content: 'Matchscores are getting calculated'
						}
					}
				});
				let processingMessage = await msg.channel.send('Processing osu! match leaderboard...');
				let warmups = 2;
				let warmupsReason = `Assumed ${warmups} warmups.`;
				if (args[1] && !isNaN(args[1])) {
					warmups = parseInt(args[1]);
					warmupsReason = `${warmups} warmups were specified.`;
				}

				for (let i = 0; i < match.games.length && i < warmups; i++) {
					match.games.splice(0, 1);
				}

				if (match.games.length === 0) {
					return msg.channel.send(`${warmupsReason}\nThere seems to be no maps left after removing the warmups.`);
				}

				let playerMatchResults = [];

				for (let i = 0; i < match.games.length; i++) {
					let gameScores = match.games[i].scores;

					if (gameScores.length > 1) {
						quicksort(gameScores);

						for (let j = 0; j < gameScores.length; j++) {
							if (parseInt(gameScores[j].score) < 10000) {
								gameScores.splice(j, 1);
								j--;
							}
						}

						let sortedScores = [];
						for (let j = 0; j < gameScores.length; j++) {
							sortedScores.push(gameScores[j].score);
						}

						const middleScore = getMiddleScore(sortedScores);

						for (let j = 0; j < gameScores.length; j++) {
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
							} else {
								let newScore = {
									userId: gameScores[j].userId,
									playedRounds: 1,
									score: 1 / parseInt(middleScore) * parseInt(gameScores[j].score)
								};

								playerMatchResults.push(newScore);
							}
						}
					}
				}

				let valueType = 'accumulated';
				let valueHint = 'Players were judged across the whole match making players that play more often more valuable.\nTo only judge on played rounds add `avg` at the end of the command.';

				if (args[2] && args[2] === 'avg') {
					for (let i = 0; i < playerMatchResults.length; i++) {
						playerMatchResults[i].score = playerMatchResults[i].score / playerMatchResults[i].playedRounds;
					}

					valueType = 'average';
					valueHint = 'Players were judged across only the maps they played making players that play less often more valuable.\nTo judge on all rounds remove `avg` at the end of the command.';
				}

				if (playerMatchResults.length === 0) {
					return processingMessage.edit('No rounds with at least 2 players found in the match.');
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
					let playerName = `ID: ${playerMatchResults[i].userId}`;

					if (playerMatchResults.length < 33) {
						let discordUser = await DBDiscordUsers.findOne({
							where: { osuUserId: playerMatchResults[i].userId }
						});

						if (discordUser) {
							playerName = discordUser.osuName;
						} else {
							const osuUser = await osuApi.getUser({ u: playerMatchResults[i].userId });
							if (osuUser) {
								playerName = osuUser.name;
							}
						}
					}

					let dataset = {
						name: playerName,
						value: `Value: ${Math.round(playerMatchResults[i].score * 100) / 100} ${valueType} over ${playerMatchResults[i].playedRounds} played rounds`,
					};

					leaderboardData.push(dataset);
				}

				const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${match.name}`, `osu-match-${match.name}.png`);

				//Send attachment
				await msg.channel.send(`The leaderboard shows the evaluation of the players that participated in the match.\n${warmupsReason}\n${valueHint}\n<https://osu.ppy.sh/community/matches/${match.id}>`, attachment);
				processingMessage.delete();
			})
			.catch(err => {
				if (err.message === 'Not found') {
					if (msg.id) {
						return msg.channel.send(`Could not find match \`${args[0].replace(/`/g, '')}\`.`);
					} else {
						return additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
							data: {
								type: 4,
								data: {
									content: `Could not find match \`${args[0].replace(/`/g, '')}\`.`
								}
							}
						});
					}
				} else {
					console.log(err);
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

	return (parseInt(scores[0]) + parseInt(scores[1])) / 2;
}