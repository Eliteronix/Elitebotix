const { DBDiscordUsers, DBDuelRatingHistory, DBOsuMultiGames, DBOsuMultiGameScores } = require('../dbObjects');
const { developers, salesmen, showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries, getOsuBeatmap, getIDFromPotentialOsuLink } = require('../utils');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'earlyaccess',
	description: 'Has some early access features for patreons if possible',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('earlyaccess')
		.setNameLocalizations({
			'de': 'earlyaccess',
			'en-GB': 'earlyaccess',
			'en-US': 'earlyaccess',
		})
		.setDescription('Has some early access features for patreons if possible')
		.setDescriptionLocalizations({
			'de': 'Hat einige frühe Zugriffsfunktionen für Patreons, wenn möglich',
			'en-GB': 'Has some early access features for patreons if possible',
			'en-US': 'Has some early access features for patreons if possible',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tournamentdifficulty')
				.setNameLocalizations({
					'de': 'turnierschwierigkeit',
					'en-GB': 'tournamentdifficulty',
					'en-US': 'tournamentdifficulty',
				})
				.setDescription('Gets the difficulty of a map for a tournament')
				.setDescriptionLocalizations({
					'de': 'Gibt die Schwierigkeit einer map für ein Turnier an',
					'en-GB': 'Gets the difficulty of a map for a tournament',
					'en-US': 'Gets the difficulty of a map for a tournament',
				})
				.addStringOption(option =>
					option.setName('beatmapid')
						.setDescription('The beatmap ID')
						.setDescriptionLocalizations({
							'de': 'Die Beatmap ID',
							'en-GB': 'The beatmap ID',
							'en-US': 'The beatmap ID',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('modpool')
						.setDescription('The modpool')
						.setDescriptionLocalizations({
							'de': 'Der Modpool',
							'en-GB': 'The modpool',
							'en-US': 'The modpool',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'NM', value: 'NM' },
							{ name: 'HD', value: 'HD' },
							{ name: 'HR', value: 'HR' },
							{ name: 'DT', value: 'DT' },
						)
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
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

		logDatabaseQueries(4, 'commands/earlyaccess.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: interaction.user.id,
				patreon: true
			}
		});

		if (interaction && !developers.includes(interaction.user.id) && !salesmen.includes(interaction.user.id) && !discordUser) {
			return await interaction.editReply('Earlyaccess commands are reserved for developers and patreons. As soon as they are up to standard for release you will be able to use them.');
		}

		if (interaction && interaction.options.getSubcommand() === 'tournamentdifficulty') {
			let beatmapId = getIDFromPotentialOsuLink(interaction.options.getString('beatmapid'));
			let modpool = interaction.options.getString('modpool');

			let modBits = 0;

			if (modpool === 'HD') {
				modBits = 8;
			} else if (modpool === 'HR') {
				modBits = 16;
			} else if (modpool === 'DT') {
				modBits = 64;
			}

			let beatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: modBits });

			if (!beatmap) {
				return await interaction.editReply('Beatmap not found');
			}

			//Get all the scores for the map
			logDatabaseQueries(4, 'commands/earlyaccess.js DBOsuMultiGameScores tournamentDifficulty');
			let scores = await DBOsuMultiGameScores.findAll({
				attributes: ['osuUserId', 'score', 'rawMods', 'gameRawMods', 'warmup', 'gameId'],
				where: {
					beatmapId: beatmapId,
					freeMod: false,
				}
			});

			logDatabaseQueries(4, 'commands/earlyaccess.js DBOsuMultiGames tournamentDifficulty');
			let games = await DBOsuMultiGames.findAll({
				attributes: ['gameId', 'gameStartDate'],
				where: {
					gameId: {
						[Op.in]: scores.map(s => s.gameId),
					},
				}
			});

			// add the game start date to the scores
			for (let i = 0; i < scores.length; i++) {
				let game = games.find(g => g.gameId === scores[i].gameId);

				scores[i].gameStartDate = game.gameStartDate;
			}

			let plays = [];

			// grab the player IDs, scores, mods, and month
			for (let i = 0; i < scores.length; i++) {
				if (scores[i].warmup) {
					continue;
				}

				if (parseInt(scores[i].gameRawMods) % 2 === 1) {
					scores[i].gameRawMods = parseInt(scores[i].gameRawMods) - 1;
				}
				if (parseInt(scores[i].rawMods) % 2 === 1) {
					scores[i].rawMods = parseInt(scores[i].rawMods) - 1;
				}

				if (parseInt(modBits) !== parseInt(scores[i].rawMods) + parseInt(scores[i].gameRawMods)) {
					continue;
				}

				plays.push({
					osuUserId: scores[i].osuUserId,
					score: scores[i].score,
					month: new Date(scores[i].gameStartDate).getUTCMonth(),
					year: new Date(scores[i].gameStartDate).getUTCFullYear(),
				});
			}

			logDatabaseQueries(4, 'commands/earlyaccess.js DBDuelRatingHistory tournamentDifficulty');
			let allDuelRatingHistories = await DBDuelRatingHistory.findAll({
				attributes: [
					'osuUserId',
					'osuNoModDuelStarRating',
					'osuHiddenDuelStarRating',
					'osuHardRockDuelStarRating',
					'osuDoubleTimeDuelStarRating',
					'month',
					'year'],
				where: {
					osuUserId: {
						[Op.in]: plays.map(p => p.osuUserId),
					},
				}
			});

			for (let i = 0; i < plays.length; i++) {
				let duelRatingHistory = allDuelRatingHistories.find(d => d.osuUserId === plays[i].osuUserId && d.month === plays[i].month && d.year === plays[i].year);

				if (!duelRatingHistory) {
					plays.splice(i, 1);
					i--;
					continue;
				}

				if (modpool === 'NM') {
					plays[i].score = plays[i].score / 1;
					plays[i].duelRating = duelRatingHistory.osuNoModDuelStarRating;
				} else if (modpool === 'HD') {
					plays[i].score = plays[i].score / 1.06;
					plays[i].duelRating = duelRatingHistory.osuHiddenDuelStarRating;
				} else if (modpool === 'HR') {
					plays[i].score = plays[i].score / 1.1;
					plays[i].duelRating = duelRatingHistory.osuHardRockDuelStarRating;
				} else if (modpool === 'DT') {
					plays[i].score = plays[i].score / 1.2;
					plays[i].duelRating = duelRatingHistory.osuDoubleTimeDuelStarRating;
				}

				if (!plays[i].duelRating) {
					plays.splice(i, 1);
					i--;
					continue;
				}

				plays[i].duelRating = parseFloat(plays[i].duelRating);

				if (plays[i].score < 20000) {
					plays[i].score = 20000;
				}

				// calculate the expected SR
				// y=a (x + (b-r))²+c
				// r = (ab+sqrt(-a(c-y))+ax)/a
				// y = plays[i].score
				// x = plays[i].duelRating
				// r = ? (the expected duel rating)
				const a = 120000;
				const b = -1.67;
				const c = 20000;

				let helpRating = (a * b + Math.sqrt(-a * (c - plays[i].score)) + a * plays[i].duelRating) / a;

				plays[i].expectedDuelRating = plays[i].duelRating - (helpRating - plays[i].duelRating);
			}

			if (plays.length === 0) {
				return await interaction.editReply('No plays found');
			}

			// Get the average expected duel rating
			let averageExpectedDuelRating = 0;
			for (let i = 0; i < plays.length; i++) {
				averageExpectedDuelRating += plays[i].expectedDuelRating;
			}
			averageExpectedDuelRating /= plays.length;

			return await interaction.editReply(`The tournament difficulty for ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] with ${modpool} is ${averageExpectedDuelRating.toFixed(2)} based on ${plays.length} plays.`);
		}
	},
};