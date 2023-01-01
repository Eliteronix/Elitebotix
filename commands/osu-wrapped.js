const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const osu = require('node-osu');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries, getOsuPlayerName, multiToBanchoScore } = require('../utils');

module.exports = {
	name: 'osu-wrapped',
	// aliases: ['developer', 'donate', 'support'],
	description: 'Sums up the year in osu! for a user',
	// usage: '<add/list/remove> <username>',
	// permissions: Permissions.FLAGS.MANAGE_GUILD,
	// permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	// guildOnly: true,
	// args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let username = interaction.options.getString('username');

		let discordUser = null;

		if (username === null) {
			logDatabaseQueries(4, 'commands/osu-wrapped.js DBDiscordUsers 1');
			discordUser = await DBDiscordUsers.findOne({
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
			logDatabaseQueries(4, 'commands/osu-wrapped.js DBDiscordUsers 2');
			discordUser = await DBDiscordUsers.findOne({
				where: {
					[Op.or]: {
						osuUserId: username,
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
			osuUser.osuUserId = discordUser.osuUserId;
			osuUser.osuName = discordUser.osuName;
		}

		//Get the user from the API if needed
		if (!osuUser.osuUserId) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			try {
				const user = await osuApi.getUser({ u: username });
				osuUser.osuUserId = user.id;
				osuUser.osuName = user.name;
			} catch (error) {
				return interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
			}
		}

		// Gather all the data
		let year = new Date().getFullYear() - 1;

		if (interaction.options.getInteger('year')) {
			year = interaction.options.getInteger('year');
		}
		console.log(year);

		let multiMatches = await DBOsuMultiScores.findAll({
			attributes: ['matchId'],
			where: {
				osuUserId: osuUser.osuUserId,
				gameEndDate: {
					[Op.and]: {
						[Op.gte]: new Date(`${year}-01-01`),
						[Op.lte]: new Date(`${year}-12-31 23:59:59.999 UTC`),
					}
				},
				tourneyMatch: true,
			},
			group: ['matchId'],
		});

		multiMatches = multiMatches.map(match => match.matchId);

		console.log('Amount of matches played', multiMatches.length);

		if (multiMatches.length === 0) {
			return interaction.editReply(`\`${osuUser.osuName}\` didn't play any tournament matches in ${year}.`);
		}

		let multiScores = await DBOsuMultiScores.findAll({
			where: {
				matchId: multiMatches,
			},
			order: [
				['gameEndDate', 'DESC'],
			],
		});

		let matchesChecked = [];
		let matchesWon = 0;
		let matchesLost = 0;

		let gamesChecked = [];
		let gamesWon = 0;
		let gamesLost = 0;

		let tourneyPPPlays = [];
		let mostPlayedWith = [];
		let tourneysPlayed = [];

		for (let i = 0; i < multiScores.length; i++) {
			if (!matchesChecked.includes(multiScores[i].matchId)) {
				matchesChecked.push(multiScores[i].matchId);

				// Get all the scores for this game
				let gameScores = multiScores.filter(score => score.gameId === multiScores[i].gameId);

				let ownScore = gameScores.find(score => score.osuUserId === osuUser.osuUserId);

				if (gameScores.length === 2 && gameScores[0].teamType === 'Head to Head' && ownScore) {
					let otherScore = gameScores.find(score => score.osuUserId !== osuUser.osuUserId);

					if (parseInt(ownScore.score) > parseInt(otherScore.score)) {
						matchesWon++;
					} else {
						matchesLost++;
					}
				} else if (gameScores[0].teamType === 'Team vs') {
					let matchScores = multiScores.filter(score => score.matchId === multiScores[i].matchId);

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
				let gameScores = multiScores.filter(score => score.gameId === multiScores[i].gameId);

				let ownScore = gameScores.find(score => score.osuUserId === osuUser.osuUserId);

				if (ownScore) {
					if (gameScores.length === 2 && gameScores[0].teamType === 'Head to Head') {
						let otherScore = gameScores.find(score => score.osuUserId !== osuUser.osuUserId);

						if (parseInt(ownScore.score) > parseInt(otherScore.score)) {
							gamesWon++;
						} else {
							gamesLost++;
						}
					} else if (gameScores[0].teamType === 'Team vs') {
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
				let mostPlayedWithPlayer = mostPlayedWith.find(player => player.osuUserId === multiScores[i].osuUserId);

				if (mostPlayedWithPlayer) {
					// Check if this match has already been counted
					if (!mostPlayedWithPlayer.matches.includes(multiScores[i].matchId)) {
						mostPlayedWithPlayer.amount++;
						mostPlayedWithPlayer.matches.push(multiScores[i].matchId);
					}
				} else {
					mostPlayedWith.push({
						osuName: await getOsuPlayerName(multiScores[i].osuUserId),
						osuUserId: multiScores[i].osuUserId,
						amount: 1,
						matches: [multiScores[i].matchId],
					});
				}
			} else {
				if (parseInt(multiScores[i].score) > 10000 && multiScores[i].teamType !== 'Tag Team vs' && multiScores[i].teamType !== 'Tag Co-op') {
					if (parseInt(multiScores[i].gameRawMods) % 2 === 1) {
						multiScores[i].gameRawMods = parseInt(multiScores[i].gameRawMods) - 1;
					}
					if (parseInt(multiScores[i].rawMods) % 2 === 1) {
						multiScores[i].rawMods = parseInt(multiScores[i].rawMods) - 1;
					}

					let banchoScore = await multiToBanchoScore(multiScores[i]);

					if (banchoScore.pp && parseFloat(banchoScore.pp) < 2000 && parseFloat(banchoScore.pp)) {
						tourneyPPPlays.push(banchoScore);
					}
				}
			}

			if (!tourneysPlayed.includes(multiScores[i].matchName.replace(/:.*/gm, ''))) {
				tourneysPlayed.push(multiScores[i].matchName.replace(/:.*/gm, ''));
			}
		}

		mostPlayedWith.sort((a, b) => b.amount - a.amount);

		tourneyPPPlays.sort((a, b) => parseFloat(b.pp) - parseFloat(a.pp));

		console.log('Amount of matches won', matchesWon);
		console.log('Amount of matches lost', matchesLost);
		console.log('Amount of maps played', gamesChecked.length);
		console.log('Amount of maps won', gamesWon);
		console.log('Amount of maps lost', gamesLost);
		console.log('Most played with players', mostPlayedWith.length);
		console.log('Amount of tourneys played', tourneysPlayed.length);
		console.log('Top tourney pp plays', tourneyPPPlays.length);
		console.log('Duel rating change');
	},
};