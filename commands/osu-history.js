const { DBDiscordUsers, DBDuelRatingHistory, DBOsuMultiGameScores, DBOsuMultiGames, DBOsuMultiMatches } = require('../dbObjects');
const osu = require('node-osu');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries, getOsuPlayerName, multiToBanchoScore, getUserDuelStarRating, getOsuBeatmap, getOsuDuelLeague, getIDFromPotentialOsuLink, getAvatar, logOsuAPICalls } = require('../utils');
const Canvas = require('canvas');
const Discord = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

module.exports = {
	name: 'osu-history',
	description: 'Summarizes the whole osu! history for a user',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-history')
		.setNameLocalizations({
			'de': 'osu-historie',
			'en-GB': 'osu-history',
			'en-US': 'osu-history',
		})
		.setDescription('Summarizes the whole osu! history for a user')
		.setDescriptionLocalizations({
			'de': 'Fässt die gesamte osu! Historie für einen Spieler zusammen',
			'en-GB': 'Summarizes the whole osu! history for a user',
			'en-US': 'Summarizes the whole osu! history for a user',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('username')
				.setNameLocalizations({
					'de': 'nutzername',
					'en-GB': 'username',
					'en-US': 'username',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('onlymatchhistory')
				.setNameLocalizations({
					'de': 'nurmatchhistorie',
					'en-GB': 'onlymatchhistory',
					'en-US': 'onlymatchhistory',
				})
				.setDescription('Only show the match history')
				.setDescriptionLocalizations({
					'de': 'Zeigt nur die Matchhistorie an',
					'en-GB': 'Only show the match history',
					'en-US': 'Only show the match history',
				})
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('showtournamentdetails')
				.setNameLocalizations({
					'de': 'zeigeturnierdetails',
					'en-GB': 'showtournamentdetails',
					'en-US': 'showtournamentdetails',
				})
				.setDescription('Show the details of the tournaments (WIP)')
				.setDescriptionLocalizations({
					'de': 'Zeigt die Details der Turniere an (WIP)',
					'en-GB': 'Show the details of the tournaments (WIP)',
					'en-US': 'Show the details of the tournaments (WIP)',
				})
				.setRequired(false)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let username = interaction.options.getString('username');

		let discordUser = null;

		if (username === null) {
			logDatabaseQueries(4, 'commands/osu-history.js DBDiscordUsers 1');
			discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId', 'osuName'],
				where: {
					userId: interaction.user.id,
				}
			});

			if (discordUser === null) {
				username = interaction.user.username;

				if (interaction.member && interaction.member.nickname) {
					username = interaction.member.nickname;
				}
			}
		}

		//Get the user from the database if possible
		if (discordUser === null) {
			logDatabaseQueries(4, 'commands/osu-history.js DBDiscordUsers 2');
			discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId', 'osuName'],
				where: {
					[Op.or]: {
						osuUserId: getIDFromPotentialOsuLink(username),
						osuName: username,
						userId: username.replace('<@', '').replace('>', '').replace('!', ''),
					}
				}
			});
		}

		let osuUser = {
			osuUserId: null,
			osuName: null
		};

		if (discordUser) {
			osuUser.osuUserId = parseInt(discordUser.osuUserId);
			osuUser.osuName = discordUser.osuName;
		}

		//Get the user from the API if needed
		if (!osuUser.osuUserId) {
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			try {
				logOsuAPICalls('commands/osu-history.js');
				const user = await osuApi.getUser({ u: username });
				osuUser.osuUserId = parseInt(user.id);
				osuUser.osuName = user.name;
			} catch (error) {
				return await interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
			}
		}

		// Gather all the data
		logDatabaseQueries(4, 'commands/osu-history.js DBOsuMultiGameScores 1');
		let multiMatchIds = await DBOsuMultiGameScores.findAll({
			attributes: ['matchId'],
			where: {
				osuUserId: osuUser.osuUserId,
				tourneyMatch: true,
				warmup: {
					[Op.not]: true,
				},
				score: {
					[Op.gte]: 10000,
				}
			},
			group: ['matchId'],
		});

		multiMatchIds = multiMatchIds.map(match => match.matchId);

		if (multiMatchIds.length === 0) {
			return await interaction.editReply(`\`${osuUser.osuName}\` didn't play any tournament matches.`);
		}

		logDatabaseQueries(4, 'commands/osu-history.js DBOsuMultiMatches 2');
		let multiMatches = await DBOsuMultiMatches.findAll({
			attributes: ['matchId', 'matchName', 'matchStartDate'],
			where: {
				matchId: {
					[Op.in]: multiMatchIds
				},
				matchName: {
					[Op.notLike]: 'MOTD:%',
				},
			},
		});

		logDatabaseQueries(4, 'commands/osu-history.js DBOsuMultiGameScores 2');
		let multiScores = await DBOsuMultiGameScores.findAll({
			attributes: [
				'id',
				'score',
				'gameRawMods',
				'rawMods',
				'teamType',
				'pp',
				'beatmapId',
				'createdAt',
				'osuUserId',
				'count50',
				'count100',
				'count300',
				'countGeki',
				'countKatu',
				'countMiss',
				'maxCombo',
				'perfect',
				'mode',
				'matchId',
				'gameId',
				'gameStartDate',
				'team',
			],
			where: {
				matchId: {
					[Op.in]: multiMatches.map(match => match.matchId)
				},
				score: {
					[Op.gte]: 10000,
				}
			},
			order: [
				['matchId', 'DESC'],
			],
		});

		for (let i = 0; i < multiScores.length; i++) {
			let match = multiMatches.find(match => match.matchId === multiScores[i].matchId);

			multiScores[i].matchName = match.matchName;
			multiScores[i].matchStartDate = match.matchStartDate;
		}

		let onlymatchhistory = false;

		if (interaction.options.getBoolean('onlymatchhistory')) {
			onlymatchhistory = true;
		}

		const files = [];

		let matchesChecked = [];
		let matchesWon = 0;
		let matchesLost = 0;

		let gamesChecked = [];
		let gamesWon = 0;
		let gamesLost = 0;

		let tourneyPPPlays = [];
		let mostPlayedWith = [];
		let mostWonAgainst = [];
		let mostLostAgainst = [];
		let tourneysPlayed = [];

		let lastUpdate = new Date();

		let matchesPlayed = [];

		let hideQualifiers = new Date();
		hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

		let matchScores = multiScores.filter(score => score.matchId === multiScores[0].matchId);
		let gameScores = null;
		let matchId = multiScores[0].matchId;
		let gameId = multiScores[0].gameId;

		for (let i = 0; i < multiScores.length; i++) {
			let newMatch = false;

			if (osuUser.osuUserId !== multiScores[i].osuUserId) {
				let mostPlayedWithPlayer = mostPlayedWith.find(player => player.osuUserId === multiScores[i].osuUserId);

				if (mostPlayedWithPlayer) {
					// Check if this match has already been counted
					if (!mostPlayedWithPlayer.matches.includes(multiScores[i].matchId)) {
						mostPlayedWithPlayer.amount++;
						mostPlayedWithPlayer.matches.push(multiScores[i].matchId);

						newMatch = true;
					}
				} else {
					mostPlayedWith.push({
						osuUserId: multiScores[i].osuUserId,
						amount: 1,
						matches: [multiScores[i].matchId],
					});

					newMatch = true;
				}
			}

			if (multiScores[i].matchName.toLowerCase().includes('scrim') || multiScores[i].warmup) {
				continue;
			}

			if (new Date() - lastUpdate > 15000) {
				await interaction.editReply(`Processing ${i}/${multiScores.length} scores...`);
				lastUpdate = new Date();
			}

			if (matchId !== multiScores[i].matchId) {
				matchId = multiScores[i].matchId;
				matchScores = multiScores.filter(score => score.matchId === multiScores[i].matchId);
			}

			if (gameId !== multiScores[i].gameId) {
				gameId = multiScores[i].gameId;
				gameScores = null;
			}

			let date = new Date(multiScores[i].matchStartDate);

			if (date > hideQualifiers && multiScores[i].matchName.toLowerCase().includes('qualifier')) {
				multiScores[i].matchId = `XXXXXXXXX (hidden for ${daysHidingQualifiers} days)`;
			}

			if (!matchesPlayed.includes(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${multiScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${multiScores[i].matchId}`)) {
				matchesPlayed.push(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${multiScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${multiScores[i].matchId}`);
			}

			if (onlymatchhistory) {
				continue;
			}

			if (!matchesChecked.includes(multiScores[i].matchId)) {
				matchesChecked.push(multiScores[i].matchId);

				// Get all the scores for this game
				if (!gameScores) {
					gameScores = matchScores.filter(score => score.gameId === multiScores[i].gameId);
				}

				let ownScore = gameScores.find(score => score.osuUserId === osuUser.osuUserId);

				if (gameScores.length === 2 && gameScores[0].teamType === 0 && ownScore) {
					let otherScore = gameScores.find(score => score.osuUserId !== osuUser.osuUserId);

					try {
						if (parseInt(ownScore.score) > parseInt(otherScore.score)) {
							matchesWon++;
						} else {
							matchesLost++;
						}
					} catch (error) {
						console.error(error, ownScore, otherScore, multiScores[i].matchId);
					}
				} else if (gameScores[0].teamType === 2) {
					let ownScores = matchScores.filter(score => score.osuUserId === osuUser.osuUserId);

					let team = ownScores[0].team;

					let ownTeamScore = 0;
					let otherTeamScore = 0;

					for (let j = 0; j < gameScores.length; j++) {
						if (gameScores[j].team === team) {
							ownTeamScore += parseInt(gameScores[j].score);
						} else {
							otherTeamScore += parseInt(gameScores[j].score);
						}
					}

					if (ownTeamScore > otherTeamScore) {
						matchesWon++;
					} else {
						matchesLost++;
					}
				}
			}

			if (!gamesChecked.includes(multiScores[i].gameId)) {
				gamesChecked.push(multiScores[i].gameId);

				// Get all the scores for this game
				if (!gameScores) {
					gameScores = matchScores.filter(score => score.gameId === multiScores[i].gameId);
				}

				let ownScore = gameScores.find(score => score.osuUserId === osuUser.osuUserId);

				if (ownScore) {
					if (gameScores.length === 2 && gameScores[0].teamType === 0) {
						let otherScore = gameScores.find(score => score.osuUserId !== osuUser.osuUserId);

						try {
							if (parseInt(ownScore.score) > parseInt(otherScore.score)) {
								gamesWon++;
							} else {
								gamesLost++;
							}
						} catch (error) {
							console.error(error, ownScore, otherScore, multiScores[i].matchId);
						}
					} else if (gameScores[0].teamType === 2) {
						let team = ownScore.team;

						let ownTeamScore = 0;
						let otherTeamScore = 0;

						for (let j = 0; j < gameScores.length; j++) {
							if (gameScores[j].team === team) {
								ownTeamScore += parseInt(gameScores[j].score);
							} else {
								otherTeamScore += parseInt(gameScores[j].score);
							}
						}

						if (ownTeamScore > otherTeamScore) {
							gamesWon++;
						} else {
							gamesLost++;
						}
					}
				}
			}

			if (multiScores[i].osuUserId !== osuUser.osuUserId) {
				if (newMatch) {
					let matchWonAgainst = false;
					let matchLostAgainst = false;

					// Get all the scores for this game
					if (!gameScores) {
						gameScores = matchScores.filter(score => score.gameId === multiScores[i].gameId);
					}

					let ownScore = gameScores.find(score => score.osuUserId === osuUser.osuUserId);

					if (gameScores.length === 2 && gameScores[0].teamType === 0 && ownScore) {
						let otherScore = gameScores.find(score => score.osuUserId !== osuUser.osuUserId);

						try {
							if (parseInt(ownScore.score) > parseInt(otherScore.score)) {
								matchWonAgainst = true;
							} else {
								matchLostAgainst = true;
							}
						} catch (error) {
							console.error(error, ownScore, otherScore, multiScores[i].matchId);
						}
					} else if (gameScores[0].teamType === 2) {
						let ownScores = matchScores.filter(score => score.osuUserId === osuUser.osuUserId);

						let team = ownScores[0].team;

						let ownTeamScore = 0;
						let otherTeamScore = 0;

						for (let j = 0; j < gameScores.length; j++) {
							if (gameScores[j].team === team) {
								ownTeamScore += parseInt(gameScores[j].score);
							} else {
								otherTeamScore += parseInt(gameScores[j].score);
							}
						}

						if (team !== multiScores[i].team) {
							if (ownTeamScore > otherTeamScore) {
								matchWonAgainst = true;
							} else {
								matchLostAgainst = true;
							}
						}
					}

					if (matchWonAgainst) {
						let mostWonAgainstPlayer = mostWonAgainst.find(player => player.osuUserId === multiScores[i].osuUserId);

						if (mostWonAgainstPlayer) {
							// Check if this match has already been counted
							if (!mostWonAgainstPlayer.matches.includes(multiScores[i].matchId)) {
								mostWonAgainstPlayer.amount++;
								mostWonAgainstPlayer.matches.push(multiScores[i].matchId);
							}
						} else {
							mostWonAgainst.push({
								osuUserId: multiScores[i].osuUserId,
								amount: 1,
								matches: [multiScores[i].matchId],
							});
						}
					} else if (matchLostAgainst) {
						let mostLostAgainstPlayer = mostLostAgainst.find(player => player.osuUserId === multiScores[i].osuUserId);

						if (mostLostAgainstPlayer) {
							// Check if this match has already been counted
							if (!mostLostAgainstPlayer.matches.includes(multiScores[i].matchId)) {
								mostLostAgainstPlayer.amount++;
								mostLostAgainstPlayer.matches.push(multiScores[i].matchId);
							}
						} else {
							mostLostAgainst.push({
								osuUserId: multiScores[i].osuUserId,
								amount: 1,
								matches: [multiScores[i].matchId],
							});
						}
					}
				}
			} else {
				if (multiScores[i].teamType !== 3 && multiScores[i].teamType !== 1) {
					if (parseInt(multiScores[i].gameRawMods) % 2 === 1) {
						multiScores[i].gameRawMods = parseInt(multiScores[i].gameRawMods) - 1;
					}
					if (parseInt(multiScores[i].rawMods) % 2 === 1) {
						multiScores[i].rawMods = parseInt(multiScores[i].rawMods) - 1;
					}

					let banchoScore = await multiToBanchoScore(multiScores[i], interaction.client);

					if (banchoScore.pp && parseFloat(banchoScore.pp) < 2000 && parseFloat(banchoScore.pp)) {
						tourneyPPPlays.push(banchoScore);
					}
				}
			}

			if (multiScores[i].matchName.startsWith('ETX:') || multiScores[i].matchName.startsWith('ETX Teams:') || multiScores[i].matchName.startsWith('o!mm Ranked:') || multiScores[i].matchName.startsWith('o!mm Team Ranked:') || multiScores[i].matchName.startsWith('o!mm Private:') || multiScores[i].matchName.startsWith('o!mm Team Private:')) {
				continue;
			}

			let inMonths = new Date(multiScores[i].matchStartDate);
			inMonths.setMonth(inMonths.getMonth() + 3);

			let tourneyEntry = tourneysPlayed.find(tourney => tourney.acronym.toLowerCase() === multiScores[i].matchName.replace(/:.*/gm, '').replace(/ (GF|F|SF|QF|RO16|RO32|RO64) \d+/gm, '').replace(/ GS\d+/gm, '').toLowerCase() && tourney.date < inMonths);

			if (!tourneyEntry) {
				tourneysPlayed.push({
					acronym: multiScores[i].matchName.replace(/:.*/gm, '').replace(/ (GF|F|SF|QF|RO16|RO32|RO64) \d+/gm, '').replace(/ GS\d+/gm, ''),
					matches: [{ matchId: multiScores[i].matchId, matchName: multiScores[i].matchName, beatmapIds: [multiScores[i].beatmapId] }],
					teammates: [], date: multiScores[i].matchStartDate
				});
			} else if (!tourneyEntry.matches.includes(multiScores[i].matchId)) {
				let matchEntry = tourneyEntry.matches.find(match => match.matchId === multiScores[i].matchId);

				if (!matchEntry) {
					tourneyEntry.matches.push({ matchId: multiScores[i].matchId, matchName: multiScores[i].matchName, beatmapIds: [multiScores[i].beatmapId] });
				} else if (!matchEntry.beatmapIds.includes(multiScores[i].beatmapId)) {
					matchEntry.beatmapIds.push(multiScores[i].beatmapId);
				}
			}

			if (interaction.options.getBoolean('showtournamentdetails')) {
				if (multiScores[i].teamType === 2 && (!tourneyEntry || !tourneyEntry.teammates.includes(multiScores[i].osuUserId))) {
					let ownScores = matchScores.filter(score => score.osuUserId === osuUser.osuUserId);

					let team = ownScores[0].team;

					let currentUserScores = matchScores.filter(score => score.osuUserId === multiScores[i].osuUserId);

					let currentUserTeam = currentUserScores[0].team;

					if (team === currentUserTeam) {
						let tourneyEntry = tourneysPlayed.find(tourney => tourney.acronym.toLowerCase() === multiScores[i].matchName.replace(/:.*/gm, '').replace(/ (GF|F|SF|QF|RO16|RO32|RO64) \d+/gm, '').replace(/ GS\d+/gm, '').toLowerCase() && tourney.date < inMonths);

						if (!tourneyEntry.teammates.includes(multiScores[i].osuUserId)) {
							tourneyEntry.teammates.push(multiScores[i].osuUserId);
						}
					}
				}
			}
		}

		let players = [...new Set(multiScores.map(score => score.osuUserId))];

		logDatabaseQueries(4, 'commands/osu-history.js DBDiscordUsers osuNames');
		let discordUsers = await DBDiscordUsers.findAll({
			attributes: ['osuUserId', 'osuName'],
			where: {
				osuUserId: {
					[Op.in]: players,
				}
			},
		});

		for (let i = 0; i < players.length; i++) {
			players[i] = {
				osuUserId: players[i],
				osuName: discordUsers.find(user => user.osuUserId === players[i]) ? discordUsers.find(user => user.osuUserId === players[i]).osuName : await getOsuPlayerName(players[i]),
			};
		}

		if (interaction.options.getBoolean('showtournamentdetails')) {
			let acronyms = [...new Set(tourneysPlayed.map(tourney => tourney.acronym.replaceAll('\'', '\\\'')))].filter(acronym => acronym.length > 0);

			try {
				let tourneyMatches = [];
				let tourneyScores = [];

				if (acronyms.length > 0) {
					logDatabaseQueries(4, 'commands/osu-history.js DBOsuMultiMatches 3');
					tourneyMatches = await DBOsuMultiMatches.findAll({
						attributes: ['matchId', 'matchName', 'matchStartDate'],
						where: {
							tourneyMatch: true,
							matchName: {
								[Op.or]: eval('[' + acronyms.map(acronym => `{[Op.like]: '${acronym}:%'}`).join(', ') + ']'),
							},
						},
						group: ['matchId', 'matchName', 'matchStartDate'],
						order: [['matchStartDate', 'DESC']],
					});

					logDatabaseQueries(4, 'commands/osu-history.js DBOsuMultiGames 3');
					tourneyScores = await DBOsuMultiGames.findAll({
						attributes: ['matchId', 'teamType', 'beatmapId'],
						where: {
							tourneyMatch: true,
							matchId: {
								[Op.in]: tourneyMatches.map(match => match.matchId),
							}
						},
						group: ['matchId', 'teamType', 'beatmapId'],
						order: [['matchId', 'DESC']],
					});
				}

				for (let i = 0; i < tourneyScores.length; i++) {
					let match = tourneyMatches.find(match => match.matchId === tourneyScores[i].matchId);

					tourneyScores[i].matchName = match.matchName;
					tourneyScores[i].matchStartDate = match.matchStartDate;
				}

				for (let i = 0; i < tourneysPlayed.length; i++) {
					if (new Date() - lastUpdate > 15000) {
						await interaction.editReply(`Processing ${i}/${tourneysPlayed.length} tournaments...`);
						lastUpdate = new Date();
					}

					// const util = require('util');

					// console.log(util.inspect(tourneysPlayed[i], { showHidden: false, depth: null, colors: true }));

					let daysBefore = new Date(tourneysPlayed[i].date);
					daysBefore.setDate(daysBefore.getDate() - 21);

					let daysAfter = new Date(tourneysPlayed[i].date);
					daysAfter.setDate(daysAfter.getDate() + 21);

					let matchesWithTheLastMatchBeatmaps = [...new Set(tourneyScores.filter(score => tourneysPlayed[i].matches[0].beatmapIds.includes(score.beatmapId) && new Date(score.matchStartDate) < daysAfter && new Date(score.matchStartDate) > daysBefore).map(score => score.matchId))];

					if (matchesWithTheLastMatchBeatmaps.length > 1) {
						if (tourneysPlayed[i].matches[0].matchName.includes('Qualifiers')) {
							tourneysPlayed[i].result = 'Did not qualify';
						} else if (tourneysPlayed[i].matches[0].matchName.includes('Tryouts')) {
							tourneysPlayed[i].result = 'Did not make the team';
						} else {
							// Ro16 has 24 matches, Ro32 has 48 matches, Ro64 has 96 matches, Ro128 has 192 matches
							// GF has 2 + 1 matches, F has 4 matches, SF has 8 matches, QF has 16 matches

							if (matchesWithTheLastMatchBeatmaps.length > 96) {
								tourneysPlayed[i].result = 'Round of 128';
							} else if (matchesWithTheLastMatchBeatmaps.length > 48) {
								tourneysPlayed[i].result = 'Round of 64';
							} else if (matchesWithTheLastMatchBeatmaps.length > 24) {
								tourneysPlayed[i].result = 'Round of 32';
							} else if (matchesWithTheLastMatchBeatmaps.length > 16) {
								tourneysPlayed[i].result = 'Round of 16';
							} else if (matchesWithTheLastMatchBeatmaps.length > 8) {
								tourneysPlayed[i].result = 'Quarter Finals';
							} else if (matchesWithTheLastMatchBeatmaps.length > 4) {
								tourneysPlayed[i].result = 'Semi Finals';
							} else if (matchesWithTheLastMatchBeatmaps.length > 2) {
								tourneysPlayed[i].result = 'Finals';
							} else {
								tourneysPlayed[i].result = 'Grand Finals';
							}
						}
					}

					let team = tourneysPlayed[i].teammates;

					let weeksAgo = new Date();
					weeksAgo.setDate(weeksAgo.getDate() - 14);

					if (tourneysPlayed[i].date > weeksAgo) {
						tourneysPlayed[i].result = 'Ongoing';
					}

					for (let j = 0; j < team.length; j++) {
						team[j] = players.find(player => player.osuUserId === team[j]).osuName;

						if (team[j] === null) {
							team[j] = '<Redacted>';
						}
					}

					if (team.length > 1) {
						tourneysPlayed[i].team = `Team: ${team.join(', ')}`;
					} else if (team.length === 0 && tourneysPlayed[i].matches.length > 1 || team.length === 1) {
						tourneysPlayed[i].team = 'Solo';
					} else {
						let matchesToFindOutFormat = tourneyScores.filter(score => !score.matchName.includes('Qualifiers'));

						if (matchesToFindOutFormat.length > 0) {
							if (matchesToFindOutFormat[0].teamType === 0) {
								tourneysPlayed[i].team = 'Solo';
							}

							tourneysPlayed[i].team = 'Team: unknown';
						} else {
							if (!tourneysPlayed[i].result) {
								tourneysPlayed[i].result = 'No matches past qualifiers found';
							}
						}
					}

					if (!tourneysPlayed[i].team) {
						tourneysPlayed[i].team = 'Format & Team unknown';
					}

					if (!tourneysPlayed[i].result) {
						tourneysPlayed[i].result = 'Unknown';
					}
				}
			} catch (error) {
				console.error(osuUser.osuUserId, acronyms, error);
			}
		}

		if (!onlymatchhistory) {
			mostPlayedWith.sort((a, b) => b.amount - a.amount);

			for (let i = 0; i < mostPlayedWith.length; i++) {
				mostPlayedWith[i].osuName = players.find(player => player.osuUserId === mostPlayedWith[i].osuUserId).osuName;

				if (mostPlayedWith[i].osuName === null) {
					mostPlayedWith[i].osuName = '<Redacted>';
				}
			}

			mostWonAgainst.sort((a, b) => b.amount - a.amount);

			for (let i = 0; i < mostWonAgainst.length; i++) {
				mostWonAgainst[i].osuName = players.find(player => player.osuUserId === mostWonAgainst[i].osuUserId).osuName;

				if (mostWonAgainst[i].osuName === null) {
					mostWonAgainst[i].osuName = '<Redacted>';
				}
			}

			mostLostAgainst.sort((a, b) => b.amount - a.amount);

			for (let i = 0; i < mostLostAgainst.length; i++) {
				mostLostAgainst[i].osuName = players.find(player => player.osuUserId === mostLostAgainst[i].osuUserId).osuName;

				if (mostLostAgainst[i].osuName === null) {
					mostLostAgainst[i].osuName = '<Redacted>';
				}
			}

			tourneyPPPlays.sort((a, b) => parseFloat(b.pp) - parseFloat(a.pp));

			// Get the user's duel ratings
			let duelRating = await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: interaction.client });

			let duelRatings = [{ rating: duelRating.total, date: 'Today' }];

			//Set the date to the end of the last month
			let date = new Date();
			date.setUTCDate(1);
			date.setUTCDate(date.getUTCDate() - 1);
			date.setUTCHours(23, 59, 59, 999);

			logDatabaseQueries(4, 'commands/osu-history.js DBDuelRatingHistory 1');
			let existingDuelRatings = await DBDuelRatingHistory.findAll({
				attributes: ['osuDuelStarRating', 'year', 'month', 'date'],
				where: {
					osuUserId: osuUser.osuUserId,
				},
			});

			// Create rank history graph
			logDatabaseQueries(4, 'commands/osu-history.js DBOsuMultiGameScores duelRatingDevelopment');
			let oldestScore = await DBOsuMultiGameScores.findOne({
				attributes: ['gameEndDate'],
				where: {
					osuUserId: osuUser.osuUserId,
					tourneyMatch: true,
					scoringType: 3,
					mode: 0,
				},
				order: [
					['gameId', 'ASC']
				]
			});

			if (oldestScore) {
				let iterator = 0;
				let startTime = date - oldestScore.gameEndDate;

				while (date > oldestScore.gameEndDate) {
					iterator++;
					if (new Date() - lastUpdate > 15000) {
						await interaction.editReply(`Processing... (${iterator} months deep | ${(100 - (100 / startTime * (date - oldestScore.gameEndDate))).toFixed(2)}%)`);
						lastUpdate = new Date();
					}

					let existingRating = existingDuelRatings.find(rating => rating.year === date.getUTCFullYear() && rating.month === date.getUTCMonth() + 1 && rating.date === date.getUTCDate());

					if (existingRating) {
						duelRatings.push({ rating: parseFloat(existingRating.osuDuelStarRating), date: `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}.${date.getUTCFullYear()}` });
					} else {
						let duelRating = await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: interaction.client, date: date });
						duelRatings.push({ rating: duelRating.total, date: `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}.${date.getUTCFullYear()}` });
					}
					date.setUTCDate(1);
					date.setUTCDate(date.getUTCDate() - 1);
				}
			} else {
				if (duelRating.total) {
					duelRatings.push({ rating: duelRating.total, date: 'Today' });
				}
			}

			let labels = [];

			for (let i = 0; i < duelRatings.length; i++) {
				labels.push(duelRatings[i].date);
			}

			labels.reverse();
			duelRatings.reverse();

			let grandmasterHistory = [];
			let masterHistory = [];
			let diamondHistory = [];
			let platinumHistory = [];
			let goldHistory = [];
			let silverHistory = [];
			let bronzeHistory = [];

			let highestRating = 0;

			for (let i = 0; i < duelRatings.length; i++) {
				if (i === 0 && !duelRatings[i].rating) {
					duelRatings.shift();
					labels.shift();
					i--;
					continue;
				}

				if (duelRatings[i].rating > highestRating) {
					highestRating = duelRatings[i].rating;
				}

				let grandmasterRating = null;
				let masterRating = null;
				let diamondRating = null;
				let platinumRating = null;
				let goldRating = null;
				let silverRating = null;
				let bronzeRating = null;

				if (duelRatings[i].rating > 7.6) {
					grandmasterRating = duelRatings[i].rating;
				} else if (duelRatings[i].rating > 7) {
					masterRating = duelRatings[i].rating;
				} else if (duelRatings[i].rating > 6.4) {
					diamondRating = duelRatings[i].rating;
				} else if (duelRatings[i].rating > 5.8) {
					platinumRating = duelRatings[i].rating;
				} else if (duelRatings[i].rating > 5.2) {
					goldRating = duelRatings[i].rating;
				} else if (duelRatings[i].rating > 4.6) {
					silverRating = duelRatings[i].rating;
				} else {
					bronzeRating = duelRatings[i].rating;
				}

				grandmasterHistory.push(grandmasterRating);
				masterHistory.push(masterRating);
				diamondHistory.push(diamondRating);
				platinumHistory.push(platinumRating);
				goldHistory.push(goldRating);
				silverHistory.push(silverRating);
				bronzeHistory.push(bronzeRating);
			}

			let additionalHeight = 0;

			if (interaction.options.getBoolean('showtournamentdetails')) {
				additionalHeight = tourneysPlayed.length * 70 + 50;
			}

			// Draw the image
			const canvasWidth = 1000;
			const canvasHeight = 775 + additionalHeight;

			Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

			//Create Canvas
			const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

			//Get context and load the image
			const ctx = canvas.getContext('2d');
			const background = await Canvas.loadImage('./other/osu-background.png');

			for (let i = 0; i < canvas.height / background.height; i++) {
				for (let j = 0; j < canvas.width / background.width; j++) {
					ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
				}
			}

			// Write the title of the player
			ctx.font = '35px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.fillText(`osu! history for ${osuUser.osuName}`, 475, 40);

			let lineLength = ctx.measureText(`osu! history for ${osuUser.osuName}`).width;

			// Draw an underline
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#ffffff';
			ctx.moveTo(475 - lineLength / 2, 47);
			ctx.lineTo(475 + lineLength / 2, 47);
			ctx.stroke();

			// Write the title of the player
			ctx.font = '22px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText(`Played tournaments: ${tourneysPlayed.length}`, 50, 140);

			ctx.fillText(`Played matches: ${multiMatches.length}`, 50, 190);
			ctx.font = '18px comfortaa, sans-serif';
			ctx.fillText(`Won: ${matchesWon} / Lost: ${matchesLost}`, 75, 215);

			ctx.font = '22px comfortaa, sans-serif';
			ctx.fillText(`Played maps: ${gamesChecked.length}`, 50, 270);
			ctx.font = '18px comfortaa, sans-serif';
			ctx.fillText(`Won: ${gamesWon} / Lost: ${gamesLost}`, 75, 295);

			let duelLeague = getOsuDuelLeague(highestRating);

			let leagueText = duelLeague.name;
			let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

			ctx.font = '22px comfortaa, sans-serif';
			ctx.fillText('Highest duel rating:', 50, 345);
			ctx.font = '18px comfortaa, sans-serif';
			ctx.fillText(`League: ${leagueText} (${highestRating.toFixed(3)})`, 75, 370);
			ctx.drawImage(leagueImage, 75, 385, 150, 150);

			ctx.textAlign = 'left';
			ctx.fillText(`Top ${Math.min(10, tourneyPPPlays.length)} tournament pp plays:`, 635, 140);
			ctx.font = '11px comfortaa, sans-serif';
			for (let i = 0; i < Math.min(10, tourneyPPPlays.length); i++) {
				tourneyPPPlays[i].beatmap = await getOsuBeatmap({ beatmapId: tourneyPPPlays[i].beatmapId });
				let title = 'Unavailable';
				let artist = 'Unavailable';
				let difficulty = 'Unavailable';
				if (tourneyPPPlays[i].beatmap) {
					title = tourneyPPPlays[i].beatmap.title;
					artist = tourneyPPPlays[i].beatmap.artist;
					difficulty = tourneyPPPlays[i].beatmap.difficulty;
				}
				let mapString = `#${i + 1} ${parseFloat(tourneyPPPlays[i].pp).toFixed(0)}pp | ${artist} - ${title} [${difficulty}]`;
				let cut = false;
				while (ctx.measureText(mapString).width > 340) {
					cut = true;
					mapString = mapString.slice(0, mapString.length - 1);
				}
				if (cut) {
					mapString += '...';
				}

				ctx.fillText(mapString, 635, 158 + i * 16);
			}

			ctx.textAlign = 'center';
			ctx.font = '22px comfortaa, sans-serif';
			ctx.fillText(`Played with ${mostPlayedWith.length} players:`, 800, 375);
			ctx.font = '18px comfortaa, sans-serif';
			for (let i = 0; i < Math.min(5, mostPlayedWith.length); i++) {
				ctx.fillText(`#${i + 1} ${mostPlayedWith[i].osuName} (${mostPlayedWith[i].amount} times)`, 800, 400 + i * 25);
			}

			ctx.textAlign = 'center';
			ctx.font = '22px comfortaa, sans-serif';
			ctx.fillText(`Won against ${mostWonAgainst.length} players:`, 300, 575);
			ctx.font = '18px comfortaa, sans-serif';
			for (let i = 0; i < Math.min(5, mostWonAgainst.length); i++) {
				ctx.fillText(`#${i + 1} ${mostWonAgainst[i].osuName} (${mostWonAgainst[i].amount} times)`, 300, 600 + i * 25);
			}

			ctx.textAlign = 'center';
			ctx.font = '22px comfortaa, sans-serif';
			ctx.fillText(`Lost against ${mostLostAgainst.length} players:`, 700, 575);
			ctx.font = '18px comfortaa, sans-serif';
			for (let i = 0; i < Math.min(5, mostLostAgainst.length); i++) {
				ctx.fillText(`#${i + 1} ${mostLostAgainst[i].osuName} (${mostLostAgainst[i].amount} times)`, 700, 600 + i * 25);
			}

			// Write the title of the player
			ctx.font = '16px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			let today = new Date().toLocaleDateString();
			ctx.fillText(`Made by Elitebotix on ${today}`, 10, canvas.height - 10);

			if (interaction.options.getBoolean('showtournamentdetails')) {
				for (let i = 0; i < tourneysPlayed.length; i++) {
					ctx.font = '22px comfortaa, sans-serif';
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'left';
					ctx.fillText(`${tourneysPlayed[i].acronym} - ${tourneysPlayed[i].result}`, 50, 775 + i * 70, 900);
					ctx.font = '20px comfortaa, sans-serif';
					ctx.fillText(tourneysPlayed[i].team, 50, 800 + i * 70, 900);
				}
			}

			//Get a circle in the middle for inserting the player avatar
			ctx.beginPath();
			ctx.arc(475, 250, 125, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();

			//Draw a shape onto the main canvas in the middle 
			const avatar = await getAvatar(osuUser.osuUserId, interaction.client);
			ctx.drawImage(avatar, 350, 125, 250, 250);

			//Create as an attachment
			files.push(new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-history-${osuUser.osuUserId}.png` }));

			if (interaction.options.getBoolean('showtournamentdetails')) {
				// Save the image locally
				const buffer = canvas.toBuffer('image/png');

				//Check if the maps folder exists and create it if necessary
				if (!fs.existsSync('./historycardswithdetails')) {
					fs.mkdirSync('./historycardswithdetails');
				}

				fs.writeFileSync(`./historycardswithdetails/${osuUser.osuUserId}.png`, buffer);
			} else {
				// Save the image locally
				const buffer = canvas.toBuffer('image/png');

				//Check if the maps folder exists and create it if necessary
				if (!fs.existsSync('./historycards')) {
					fs.mkdirSync('./historycards');
				}

				fs.writeFileSync(`./historycards/${osuUser.osuUserId}.png`, buffer);
			}

			//Create chart
			const width = 1500; //px
			const height = 750; //px
			const canvasRenderService = new ChartJSNodeCanvas({ width, height });

			const data = {
				labels: labels,
				datasets: [
					{
						label: 'Grandmaster',
						data: grandmasterHistory,
						borderColor: 'rgb(88, 28, 255)',
						fill: true,
						backgroundColor: 'rgba(88, 28, 255, 0.6)',
						tension: 0.4
					},
					{
						label: 'Master',
						data: masterHistory,
						borderColor: 'rgb(255, 174, 251)',
						fill: true,
						backgroundColor: 'rgba(255, 174, 251, 0.6)',
						tension: 0.4
					},
					{
						label: 'Diamond',
						data: diamondHistory,
						borderColor: 'rgb(73, 176, 255)',
						fill: true,
						backgroundColor: 'rgba(73, 176, 255, 0.6)',
						tension: 0.4
					},
					{
						label: 'Platinum',
						data: platinumHistory,
						borderColor: 'rgb(29, 217, 165)',
						fill: true,
						backgroundColor: 'rgba(29, 217, 165, 0.6)',
						tension: 0.4
					},
					{
						label: 'Gold',
						data: goldHistory,
						borderColor: 'rgb(255, 235, 71)',
						fill: true,
						backgroundColor: 'rgba(255, 235, 71, 0.6)',
						tension: 0.4
					},
					{
						label: 'Silver',
						data: silverHistory,
						borderColor: 'rgb(181, 181, 181)',
						fill: true,
						backgroundColor: 'rgba(181, 181, 181, 0.6)',
						tension: 0.4
					},
					{
						label: 'Bronze',
						data: bronzeHistory,
						borderColor: 'rgb(240, 121, 0)',
						fill: true,
						backgroundColor: 'rgba(240, 121, 0, 0.6)',
						tension: 0.4
					},
				]
			};

			const configuration = {
				type: 'line',
				data: data,
				options: {
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: 'Duel Rating History (Total)',
							color: '#FFFFFF',
						},
						legend: {
							labels: {
								color: '#FFFFFF',
							}
						},
					},
					interaction: {
						intersect: false,
					},
					scales: {
						x: {
							display: true,
							title: {
								display: true,
								color: '#FFFFFF'
							},
							grid: {
								color: '#8F8F8F'
							},
							ticks: {
								color: '#FFFFFF',
							},
						},
						y: {
							display: true,
							title: {
								display: true,
								text: 'Duel Rating',
								color: '#FFFFFF'
							},
							grid: {
								color: '#8F8F8F'
							},
							ticks: {
								color: '#FFFFFF',
							},
						}
					}
				},
			};

			const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
			files.push(new Discord.AttachmentBuilder(imageBuffer, { name: `duelRatingHistory-${osuUser.osuUserId}.png` }));
		}

		matchesPlayed = new Discord.AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${osuUser.osuUserId}.txt` });
		files.push(matchesPlayed);

		if (!onlymatchhistory) {
			mostPlayedWith = mostPlayedWith.map((user) => {
				return `${user.amount} times - ${user.osuName} (${user.osuUserId})`;
			});

			mostPlayedWith.unshift('Most played with: (Most won against / Most lost against is below)');

			mostWonAgainst = mostWonAgainst.map((user) => {
				return `${user.amount} times - ${user.osuName} (${user.osuUserId})`;
			});

			mostWonAgainst.unshift('Most won against:');
			mostWonAgainst.unshift('');
			mostWonAgainst.unshift('');
			mostWonAgainst.unshift('');

			mostLostAgainst = mostLostAgainst.map((user) => {
				return `${user.amount} times - ${user.osuName} (${user.osuUserId})`;
			});

			mostLostAgainst.unshift('Most lost against:');
			mostLostAgainst.unshift('');
			mostLostAgainst.unshift('');
			mostLostAgainst.unshift('');

			let mostPlayedWonLost = mostPlayedWith.concat(mostWonAgainst, mostLostAgainst);

			mostPlayedWonLost = new Discord.AttachmentBuilder(Buffer.from(mostPlayedWonLost.join('\n'), 'utf-8'), { name: `most-played-won-and-lost-${osuUser.osuUserId}.txt` });
			files.push(mostPlayedWonLost);
		}

		let content = ' ';

		if (interaction.options.getBoolean('showtournamentdetails')) {
			content = 'Tournament details are currently still in development. This is an early but public release.';
		}

		return await interaction.editReply({ content: content, files: files });
	},
};