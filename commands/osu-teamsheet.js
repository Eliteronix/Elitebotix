const { AttachmentBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { DBDiscordUsers, DBOsuMappools, DBOsuSoloScores, DBOsuMultiScores, DBOsuTeamSheets, DBOsuPoolAccess } = require('../dbObjects');
const { pause, getAvatar, logDatabaseQueries, getIDFromPotentialOsuLink, getOsuBeatmap, getMapListCover, getAccuracy, getMods, humanReadable, adjustStarRating } = require('../utils');
const { Op } = require('sequelize');
const Canvas = require('canvas');
const osu = require('node-osu');

const discordUsers = {};
const userMappools = [];

module.exports = {
	name: 'osu-teamsheet',
	description: 'Allows you to create a teamsheet for your team',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-teamsheet')
		.setNameLocalizations({
			'de': 'osu-teamsheet',
			'en-GB': 'osu-teamsheet',
			'en-US': 'osu-teamsheet',
		})
		.setDescription('Allows you to create a teamsheet for your team')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir, eine Teamsheet für dein Team zu erstellen',
			'en-GB': 'Allows you to create a teamsheet for your team',
			'en-US': 'Allows you to create a teamsheet for your team',
		})
		.setDMPermission(false)
		.addNumberOption(option =>
			option.setName('teamsize')
				.setNameLocalizations({
					'de': 'teamsize',
					'en-GB': 'teamsize',
					'en-US': 'teamsize',
				})
				.setDescription('The amount of people playing per map')
				.setDescriptionLocalizations({
					'de': 'Die Anzahl der Spieler pro Map',
					'en-GB': 'The amount of people playing per map',
					'en-US': 'The amount of people playing per map',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('players')
				.setNameLocalizations({
					'de': 'spieler',
					'en-GB': 'players',
					'en-US': 'players',
				})
				.setDescription('The players in your team seperated by a comma')
				.setDescriptionLocalizations({
					'de': 'Die Spieler in deinem Team getrennt durch ein Komma',
					'en-GB': 'The players in your team seperated by a comma',
					'en-US': 'The players in your team seperated by a comma',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('mappool')
				.setNameLocalizations({
					'de': 'mappool',
					'en-GB': 'mappool',
					'en-US': 'mappool',
				})
				.setDescription('The pre-created mappool with /osu-mappool')
				.setDescriptionLocalizations({
					'de': 'Der vorher erstellte Mappool mit /osu-mappool',
					'en-GB': 'The pre-created mappool with /osu-mappool',
					'en-US': 'The pre-created mappool with /osu-mappool',
				})
				.setRequired(true)
				.setAutocomplete(true)
		)
		.addNumberOption(option =>
			option.setName('updatefor')
				.setNameLocalizations({
					'de': 'updatefür',
					'en-GB': 'updatefor',
					'en-US': 'updatefor',
				})
				.setDescription('The amount of time the teamsheet should be automatically updated for')
				.setDescriptionLocalizations({
					'de': 'Die Zeit, für die das Teamsheet automatisch aktualisiert werden soll',
					'en-GB': 'The amount of time the teamsheet should be automatically updated for',
					'en-US': 'The amount of time the teamsheet should be automatically updated for',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Next 3 hours', value: 180 },
					{ name: 'Next 12 hours', value: 720 },
					{ name: 'Next day', value: 1440 },
					{ name: 'Next 3 days', value: 4320 },
					{ name: 'Next week', value: 10080 },
					{ name: 'Next 2 weeks', value: 20160 },
				)
		)
		.addNumberOption(option =>
			option.setName('ezmultiplier')
				.setNameLocalizations({
					'de': 'ezmultiplikator',
					'en-GB': 'ezmultiplier',
					'en-US': 'ezmultiplier',
				})
				.setDescription('The EZ multiplier for the tournament')
				.setDescriptionLocalizations({
					'de': 'Der EZ Multiplikator für das Turnier',
					'en-GB': 'The EZ multiplier for the tournament',
					'en-US': 'The EZ multiplier for the tournament',
				})
				.setRequired(false)
				.setMinValue(0)
				.setMaxValue(5)
		)
		.addNumberOption(option =>
			option.setName('flmultiplier')
				.setNameLocalizations({
					'de': 'flmultiplikator',
					'en-GB': 'flmultiplier',
					'en-US': 'flmultiplier',
				})
				.setDescription('The FL multiplier for the tournament')
				.setDescriptionLocalizations({
					'de': 'Der FL Multiplikator für das Turnier',
					'en-GB': 'The FL multiplier for the tournament',
					'en-US': 'The FL multiplier for the tournament',
				})
				.setRequired(false)
				.setMinValue(0)
				.setMaxValue(5)
		)
		.addStringOption(option =>
			option.setName('bans')
				.setNameLocalizations({
					'de': 'bans',
					'en-GB': 'bans',
					'en-US': 'bans',
				})
				.setDescription('The banned maps seperated by a comma')
				.setDescriptionLocalizations({
					'de': 'Die gebannten Maps getrennt durch ein Komma',
					'en-GB': 'The banned maps seperated by a comma',
					'en-US': 'The banned maps seperated by a comma',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('matchlink')
				.setNameLocalizations({
					'de': 'matchlink',
					'en-GB': 'matchlink',
					'en-US': 'matchlink',
				})
				.setDescription('The link to the match to automatically remove played maps')
				.setDescriptionLocalizations({
					'de': 'Der Link zum Match um gespielte Maps automatisch zu entfernen',
					'en-GB': 'The link to the match to automatically remove played maps',
					'en-US': 'The link to the match to automatically remove played maps',
				})
				.setRequired(false)
		),
	// .addBooleanOption(option =>
	// 	option.setName('duelratingestimate')
	// 		.setNameLocalizations({
	// 			'de': 'duelratingschätzung',
	// 			'en-GB': 'duelratingestimate',
	// 			'en-US': 'duelratingestimate',
	// 		})
	// 		.setDescription('Whether to fill with an estimate using the duel rating or not')
	// 		.setDescriptionLocalizations({
	// 			'de': 'Ob mit einer Schätzung mittels Duel Ratings gefüllt werden soll oder nicht',
	// 			'en-GB': 'Whether to fill with an estimate using the duel rating or not',
	// 			'en-US': 'Whether to fill with an estimate using the duel rating or not',
	// 		})
	// 		.setRequired(false)
	// ),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		let gotResponse = false;

		let cachedUser = discordUsers[interaction.user.id];

		if (!cachedUser) {
			logDatabaseQueries(4, 'commands/osu-teamsheet.js (autocomplete) DBDiscordUsers');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId', 'osuVerified'],
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
				return await interaction.respond({
					name: 'You need to link your osu! account first!',
					value: 'You need to link your osu! account first!',
				});
			}

			discordUsers[interaction.user.id] = discordUser.osuUserId;
			cachedUser = discordUser.osuUserId;
		}

		setTimeout(async () => {
			if (!gotResponse) {
				let filtered = userMappools.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()) && choice.creatorId === cachedUser);

				filtered = filtered.slice(0, 25);

				if (filtered.length === 0) {
					try {
						await interaction.respond([{
							name: 'No results found | Create a mappool with /osu-mappool or wait a few seconds if you just created one',
							value: 'No results found | Create a mappool with /osu-mappool or wait a few seconds if you just created one',
						}]);
					} catch (error) {
						if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
							console.error(error);
						}
					}
					return;
				}

				try {
					await interaction.respond(
						filtered.map(choice => ({ name: choice.name, value: choice.name })),
					);
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
						console.error(error);
					}
				}
			}
		}, 1000);

		logDatabaseQueries(4, 'commands/osu-teamsheet.js (autocomplete) DBOsuMappools');
		const mappools = await DBOsuMappools.findAll({
			attributes: ['name'],
			where: {
				creatorId: cachedUser,
			},
			group: ['name'],
		});

		await pause(5000);

		mappools.forEach(mappool => {
			if (!userMappools.find(m => m.name === mappool.name && m.creatorId === cachedUser)) {
				userMappools.push({
					name: mappool.name,
					creatorId: cachedUser,
				});
			}
		});

		let filtered = mappools.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));

		filtered = filtered.slice(0, 25);

		if (filtered.length === 0) {
			try {
				await interaction.respond([{
					name: 'No results found | Create a mappool with /osu-mappool or wait a few seconds if you just created one',
					value: 'No results found | Create a mappool with /osu-mappool or wait a few seconds if you just created one',
				}]);

				gotResponse = true;
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
					console.error(error);
				}
			}
			return;
		}

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice.name, value: choice.name })),
			);

			gotResponse = true;
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
				console.error(error);
			}
		}
	},
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

		logDatabaseQueries(4, 'commands/osu-teamsheet.js (execute) DBDiscordUsers commandUser');
		let commandUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuVerified'],
			where: {
				userId: interaction.user.id
			}
		});

		if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
			return await interaction.editReply(`Please connect and verify your account first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
		}

		if (interaction.options.getNumber('updatefor') && (interaction.options.getString('bans') || interaction.options.getString('matchlink'))) {
			return await interaction.editReply('You can\'t use the updatefor option with bans or matchlink.');
		}

		let teamsize = interaction.options.getNumber('teamsize');

		let ezmultiplier = 1.75;

		if (interaction.options.getNumber('ezmultiplier')) {
			ezmultiplier = interaction.options.getNumber('ezmultiplier');
		}

		let flmultiplier = 1.5;

		if (interaction.options.getNumber('flmultiplier')) {
			flmultiplier = interaction.options.getNumber('flmultiplier');
		}

		let rawPlayers = interaction.options.getString('players').split(',');

		let players = [];

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		for (let i = 0; i < rawPlayers.length; i++) {
			let username = rawPlayers[i].trim();

			logDatabaseQueries(4, 'commands/admin/tournamentSheet.js DBDiscordUsers findOne');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId', 'osuName'],
				where: {
					[Op.or]: {
						osuUserId: getIDFromPotentialOsuLink(username),
						osuName: username,
						userId: username.replace('<@', '').replace('>', '').replace('!', ''),
					}
				}
			});

			if (discordUser) {
				players.push(discordUser);
				continue;
			}

			// eslint-disable-next-line no-undef
			process.send('osu!API');
			let osuUser = await osuApi.getUser({ u: username })
				.then(osuUser => {
					return osuUser;
				})
				.catch(async (err) => {
					if (err.message === 'Not found') {
						await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
					} else {
						await interaction.followUp('The API ran into an error. Please try again later.');
						console.error(err);
					}
					return null;
				});

			if (osuUser) {
				logDatabaseQueries(4, 'commands/osu-teamsheet.js DBDiscordUsers (osuUser)');
				let discordUser = await DBDiscordUsers.findOne({
					attributes: ['osuUserId', 'osuName'],
					where: {
						osuUserId: osuUser.id,
					}
				});

				if (discordUser) {
					players.push(discordUser);
					continue;
				}

				discordUser = await DBDiscordUsers.create({
					osuUserId: osuUser.id,
					osuName: osuUser.name,
				});

				players.push(discordUser);
			}

			await interaction.followUp(`User \`${username.replace(/`/g, '')}\` has been skipped.`);
		}

		let mappoolName = interaction.options.getString('mappool');

		logDatabaseQueries(4, 'commands/osu-teamsheet.js DBOsuMappools');
		let mappool = await DBOsuMappools.findAll({
			attributes: ['beatmapId', 'modPool', 'tieBreaker', 'freeMod', 'modPoolNumber', 'spreadsheetId'],
			where: {
				name: mappoolName,
				creatorId: commandUser.osuUserId
			},
			order: [
				['number', 'ASC']
			]
		});

		if (mappool.length === 0) {
			return await interaction.editReply(`Could not find mappool \`${mappoolName.replace(/`/g, '')}\`.\nMake sure you have the correct name and that you are the creator of the mappool.\nYou can check your mappools with </osu-mappool list:${interaction.client.slashCommandData.find(command => command.name === 'osu-mappool').id}>.`);
		}

		let spreadsheetId = mappool[0].spreadsheetId;

		if (spreadsheetId) {
			let poolAccesses = await DBOsuPoolAccess.findAll({
				attributes: ['accessGiverId'],
				where: {
					spreadsheetId: spreadsheetId,
					accessTakerId: commandUser.osuUserId,
				}
			});

			for (let i = 0; i < players.length; i++) {
				let player = players[i];

				if (player.osuUserId === commandUser.osuUserId) {
					continue;
				}

				let access = poolAccesses.find(access => access.accessGiverId === player.osuUserId);

				if (!access) {
					return await interaction.followUp(`User \`${player.osuName}\` did not give you access to the scores for the spreadsheet of the mappool \`${mappoolName.replace(/`/g, '')}\`.\nYou can give access by using </osu-scoreaccess grantspreadsheetaccess:${interaction.client.slashCommandData.find(command => command.name === 'osu-scoreaccess').id}>`);
				}
			}
		} else {
			let poolAccesses = await DBOsuPoolAccess.findAll({
				attributes: ['accessGiverId'],
				where: {
					spreadsheetId: null,
					mappoolName: mappoolName,
					accessTakerId: commandUser.osuUserId,
				}
			});

			for (let i = 0; i < players.length; i++) {
				let player = players[i];

				if (player.osuUserId === commandUser.osuUserId) {
					continue;
				}

				let access = poolAccesses.find(access => access.accessGiverId === player.osuUserId);

				if (!access) {
					return await interaction.followUp(`User \`${player.osuName}\` did not give you access to the scores for the mappool \`${mappoolName.replace(/`/g, '')}\`.\nYou can give access by using </osu-scoreaccess grantmappoolaccess:${interaction.client.slashCommandData.find(command => command.name === 'osu-scoreaccess').id}>`);
				}
			}
		}

		let tourneyMaps = [];

		let remove = interaction.options.getString('bans');

		if (remove) {
			remove = [...new Set(remove.split(','))];
		} else {
			remove = [];
		}

		for (let i = 0; i < mappool.length; i++) {
			let map = mappool[i];

			let dbBeatmap = await getOsuBeatmap({ beatmapId: map.beatmapId, modBits: map.modPool });

			if (map.tieBreaker) {
				dbBeatmap.modPool = 'TB';
			} else {
				let mods = getMods(map.modPool);

				if (mods.length === 0 && map.freeMod) {
					dbBeatmap.modPool = 'FM';
				} else if (mods.length === 0) {
					dbBeatmap.modPool = 'NM';
				} else {
					if (map.freeMod) {
						mods.push('FM');
					}

					dbBeatmap.modPool = mods.join('');
				}
			}

			dbBeatmap.modPoolCount = map.modPoolNumber;
			dbBeatmap.scores = [];

			if (remove.includes(`${dbBeatmap.modPool}${dbBeatmap.modPoolCount}`)) {
				continue;
			}

			tourneyMaps.push(dbBeatmap);

			if (dbBeatmap.modPool === 'FM') {
				let dbBeatmapHD = await getOsuBeatmap({ beatmapId: map.beatmapId, modBits: 8 });

				dbBeatmapHD.modPool = 'FMHD';
				dbBeatmapHD.modPoolCount = map.modPoolNumber;
				dbBeatmapHD.scores = [];

				tourneyMaps.push(dbBeatmapHD);

				let dbBeatmapHR = await getOsuBeatmap({ beatmapId: map.beatmapId, modBits: 16 });

				dbBeatmapHR.modPool = 'FMHR';
				dbBeatmapHR.modPoolCount = map.modPoolNumber;
				dbBeatmapHR.scores = [];

				tourneyMaps.push(dbBeatmapHR);
			}
		}

		let beatmapsPlayed = [];

		if (interaction.options.getString('matchlink')) {
			let matchLink = getIDFromPotentialOsuLink(interaction.options.getString('matchlink'));

			try {
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				let match = await osuApi.getMatch({ mp: matchLink });

				for (let i = 0; i < match.games.length; i++) {
					beatmapsPlayed.push(match.games[i].beatmapId);
				}
			} catch (err) {
				console.error(err);
				return await interaction.editReply(`Could not find match for \`${matchLink.replace(/`/g, '')}\`.`);
			}
		}

		beatmapsPlayed = [...new Set(beatmapsPlayed)];

		for (let i = 0; i < tourneyMaps.length; i++) {
			let map = tourneyMaps[i];

			if (beatmapsPlayed.includes(map.beatmapId)) {
				tourneyMaps.splice(i, 1);
				i--;
			}
		}

		logDatabaseQueries(4, 'commands/admin/tournamentSheet.js DBOsuSoloScores');
		let localScores = await DBOsuSoloScores.findAll({
			attributes: [
				'score',
				'mods',
				'beatmapHash',
				'count50',
				'count100',
				'count300',
				'countMiss',
				'uploaderId',
				'maxCombo',
				'timestamp',
			],
			where: {
				uploaderId: {
					[Op.in]: players.map(player => player.osuUserId),
				},
				beatmapHash: {
					[Op.in]: tourneyMaps.map(map => map.hash),
				},
			},
		});

		logDatabaseQueries(4, 'commands/admin/tournamentSheet.js DBOsuMultiScores');
		let multiScores = await DBOsuMultiScores.findAll({
			attributes: [
				'osuUserId',
				'beatmapId',
				'score',
				'gameRawMods',
				'rawMods',
				'scoringType',
				'count50',
				'count100',
				'count300',
				'countMiss',
			],
			where: {
				osuUserId: {
					[Op.in]: players.map(player => player.osuUserId),
				},
				beatmapId: {
					[Op.in]: tourneyMaps.map(map => map.beatmapId),
				},
				scoringType: 'Score v2',
			},
		});

		for (let i = 0; i < players.length; i++) {
			let multiPlayerScores = multiScores.filter(score => score.osuUserId === players[i].osuUserId);

			let finalMultiPlayerScores = multiPlayerScores.map(score => {
				let soloScoreFormat = {
					beatmapId: score.beatmapId,
					score: score.score,
					beatmapHash: tourneyMaps.find(map => map.beatmapId === score.beatmapId).hash,
					mods: parseInt(score.gameRawMods) + parseInt(score.rawMods),
					count50: score.count50,
					count100: score.count100,
					count300: score.count300,
					countMiss: score.countMiss,
					scoringType: score.scoringType,
				};

				return soloScoreFormat;
			});

			finalMultiPlayerScores = finalMultiPlayerScores.filter(score => scoreIsCorrectMods(score, tourneyMaps.find(map => map.beatmapId === score.beatmapId).modPool));

			let soloPlayerScores = localScores.filter(score => {
				if (score.uploaderId === players[i].osuUserId) {
					return true;
				}

				return false;
			});

			for (let j = 0; j < tourneyMaps.length; j++) {
				let soloScores = soloPlayerScores.filter(score => score.beatmapHash === tourneyMaps[j].hash);

				let soloScoresWithoutMultiScores = soloScores.filter(score => {
					let existingMultiPlayerScoresForMap = multiPlayerScores.filter(multiScore => multiScore.beatmapId === tourneyMaps[j].beatmapId);

					let existingMultiPlayerScore = existingMultiPlayerScoresForMap.find(multiScore => parseInt(multiScore.count50) === score.count50 && parseInt(multiScore.count100) === score.count100 && parseInt(multiScore.count300) === score.count300 && parseInt(multiScore.countMiss) === score.countMiss && parseInt(multiScore.score) === score.score && (parseInt(multiScore.rawMods) + parseInt(multiScore.gameRawMods) === score.mods || parseInt(multiScore.rawMods) + parseInt(multiScore.gameRawMods) + 536870912 === score.mods));

					if (existingMultiPlayerScore) {
						return false;
					}

					return true;
				});

				soloScoresWithoutMultiScores = soloScoresWithoutMultiScores.filter(score => scoreIsCorrectMods(score, tourneyMaps[j].modPool));

				soloScoresWithoutMultiScores = soloScoresWithoutMultiScores.map(score => {
					score.scoringType = 'Local';

					if (!getMods(score.mods).includes('V2')) {
						let accuracy = getAccuracy({ counts: { 300: score.count300, 100: score.count100, 50: score.count50, miss: score.countMiss } });

						let multiplier = 1;

						if (tourneyMaps[i].modPool.includes('DT') || tourneyMaps[i].modPool.includes('NC')) {
							multiplier *= 1.2;
						}

						if (tourneyMaps[i].modPool.includes('HT')) {
							multiplier *= 0.3;
						}

						if (tourneyMaps[i].modPool.includes('FL')) {
							multiplier *= 1.12;

							multiplier *= flmultiplier;
						}

						if (tourneyMaps[i].modPool.includes('HD')) {
							multiplier *= 1.06;
						}

						if (tourneyMaps[i].modPool.includes('HR')) {
							multiplier *= 1.10;
						}

						if (tourneyMaps[i].modPool.includes('EZ')) {
							multiplier *= 0.5;

							multiplier *= ezmultiplier;
						}

						if (tourneyMaps[i].modPool.includes('S0')) {
							multiplier *= 0.9;
						}

						score.scoringType = 'Converted';

						score.score = Math.round((700000 * score.maxCombo / tourneyMaps[j].maxCombo) + (300000 * Math.pow(accuracy, 10)) * multiplier);
					}

					return score;
				});

				let localV2Scores = soloScoresWithoutMultiScores.filter(score => score.scoringType === 'Local');

				let existingMultiPlayerScoresForMap = multiPlayerScores.filter(multiScore => multiScore.beatmapId === tourneyMaps[j].beatmapId);

				if (localV2Scores.length > 0 || existingMultiPlayerScoresForMap.length > 0) {
					soloScoresWithoutMultiScores = soloScoresWithoutMultiScores.filter(score => score.scoringType === 'Local');
				}

				let finalMapMultiPlayerScores = finalMultiPlayerScores.filter(score => scoreIsCorrectMods(score, tourneyMaps[j].modPool) && score.beatmapId === tourneyMaps[j].beatmapId);

				let playerMapScores = soloScoresWithoutMultiScores.concat(finalMapMultiPlayerScores);

				tourneyMaps[j].scores.push(playerMapScores);

				let scores = tourneyMaps[j].scores[i].filter(score => score.beatmapHash === tourneyMaps[j].hash);

				if (scores.length > 0) {
					continue;
				}

				if (!['Graveyard', 'WIP', 'Pending'].includes(tourneyMaps[j].approvalStatus)) {
					// eslint-disable-next-line no-undef
					process.send('osu!API');
					await osuApi.getScores({ b: tourneyMaps[j].beatmapId, u: players[i].osuUserId, m: 0 })
						.then(async mapScores => {
							if (mapScores.length === 0) {
								return null;
							}

							for (let k = 0; k < mapScores.length; k++) {
								let multiplier = 1;

								let mods = getMods(mapScores[k].raw_mods);

								if (mods.includes('DT') || mods.includes('NC')) {
									multiplier *= 1.2;
								}

								if (mods.includes('HT')) {
									multiplier *= 0.3;
								}

								if (mods.includes('FL')) {
									multiplier *= 1.12;

									multiplier *= flmultiplier;
								}

								if (mods.includes('HD')) {
									multiplier *= 1.06;
								}

								if (mods.includes('HR')) {
									multiplier *= 1.10;
								}

								if (mods.includes('EZ')) {
									multiplier *= 0.5;

									multiplier *= ezmultiplier;
								}

								if (mods.includes('S0')) {
									multiplier *= 0.9;
								}

								// Score = ((700000 * combo_bonus / max_combo_bonus) + (300000 * ((accuracy_percentage / 100) ^ 10)) * mod_multiplier
								mapScores[k].convertedScore = Math.round((700000 * mapScores[k].maxCombo / tourneyMaps[j].maxCombo) + (300000 * Math.pow(getAccuracy(mapScores[k]), 10)) * multiplier);
							}

							mapScores.sort((a, b) => b.convertedScore - a.convertedScore);

							mapScores = mapScores.map(score => {
								return {
									beatmapId: tourneyMaps[j].beatmapId,
									score: score.convertedScore,
									beatmapHash: tourneyMaps[j].hash,
									mods: score.raw_mods,
									count50: score.counts[50],
									count100: score.counts[100],
									count300: score.counts[300],
									countMiss: score.counts.miss,
									scoringType: 'Converted'
								};
							});

							mapScores = mapScores.filter(score => scoreIsCorrectMods(score, tourneyMaps[j].modPool));

							tourneyMaps[j].scores[i] = tourneyMaps[j].scores[i].concat(mapScores);
						})
						.catch(async err => {
							if (err.message !== 'Not found') {
								console.error(err);
							}
						});

					scores = tourneyMaps[j].scores[i].filter(score => score.beatmapHash === tourneyMaps[j].hash);
				}

				if (scores.length > 0 || !interaction.options.getBoolean('duelratingestimate')) {
					continue;
				}

				let duelRating = null;

				if (tourneyMaps[j].modPool === 'NM') {
					duelRating = players[i].osuNoModDuelStarRating;
				} else if (tourneyMaps[j].modPool === 'HD') {
					duelRating = players[i].osuHiddenDuelStarRating;
				} else if (tourneyMaps[j].modPool === 'HR') {
					duelRating = players[i].osuHardRockDuelStarRating;
				} else if (tourneyMaps[j].modPool === 'DT') {
					duelRating = players[i].osuDoubleTimeDuelStarRating;
				} else {
					duelRating = players[i].osuFreeModDuelStarRating;
				}

				if (duelRating === null) {
					duelRating = players[i].osuDuelStarRating;
				}

				// Get an estimate using the duel rating
				//Get the expected score for the starrating just like the duel rating calculation
				//https://www.desmos.com/calculator/oae69zr9ze
				const a = 120000;
				const b = -1.67;
				const c = 20000;

				let starRating = adjustStarRating(tourneyMaps[j].starRating, tourneyMaps[j].approachRate, tourneyMaps[j].circleSize, tourneyMaps[j].mods);

				let expectedScore = Math.round(a * Math.pow(starRating + (b - duelRating), 2) + c);

				//Set the score to the lowest expected of c if a really high starrating occurs
				if (expectedScore < c) {
					expectedScore = c;
				} else if (expectedScore > 950000) {
					expectedScore = 950000;
				}

				tourneyMaps[j].scores[i].push({
					beatmapId: tourneyMaps[j].beatmapId,
					score: expectedScore,
					beatmapHash: tourneyMaps[j].hash,
					scoringType: 'Duel Rating'
				});
			}
		}

		// Create the sheet
		const canvasWidth = 1408 + 400 * players.length;
		const canvasHeight = 208 + 100 * tourneyMaps.length;

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

		// Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		// Get context and load the image
		const ctx = canvas.getContext('2d');

		const background = await Canvas.loadImage('./other/osu-background.png');

		for (let i = 0; i < canvas.height / background.height; i++) {
			for (let j = 0; j < canvas.width / background.width; j++) {
				ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
			}
		}

		// Draw the header
		// Draw a rectangle
		ctx.fillStyle = '#1E1E1E';
		ctx.fillRect(4, 4, 600, 100);

		// Write the pool name
		ctx.font = 'bold 60px comfortaa';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'center';
		ctx.fillText(mappoolName, 304, 75, 575);

		// Draw a white border
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 4;
		ctx.strokeRect(4, 4, 600, 100);

		for (let i = 0; i < players.length; i++) {
			// Draw a rectangle
			ctx.fillStyle = '#1E1E1E';
			ctx.fillRect(604 + 400 * i, 4, 400, 100);

			// Draw a white border
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(604 + 400 * i, 4, 400, 100);

			// Write the text
			ctx.font = 'bold 60px comfortaa';
			ctx.fillStyle = '#FFFFFF';
			ctx.textAlign = 'center';
			ctx.fillText(players[i].osuName, 604 + 240 + 400 * i, 75, 275);

			// Draw the avatar
			let avatar = await getAvatar(players[i].osuUserId);
			ctx.drawImage(avatar, 604 + 400 * i + 10, 4 + 10, 80, 80);
		}

		// Draw a rectangle
		ctx.fillStyle = '#1E1E1E';
		ctx.fillRect(canvas.width - 804, 4, 400, 100);

		// Draw a white border
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 4;
		ctx.strokeRect(canvas.width - 804, 4, 400, 100);

		// Write the text
		ctx.font = 'bold 60px comfortaa';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'center';
		ctx.fillText('Lineup', canvas.width - 604, 75);

		// Draw a rectangle
		ctx.fillStyle = '#1E1E1E';
		ctx.fillRect(canvas.width - 404, 4, 400, 100);

		// Draw a white border
		ctx.strokeStyle = '#FFFFFF';
		ctx.lineWidth = 4;
		ctx.strokeRect(canvas.width - 404, 4, 400, 100);

		// Write the text
		ctx.font = 'bold 60px comfortaa';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'center';
		ctx.fillText('Score', canvas.width - 204, 75);

		let legendItems = [];

		// Loop through the maps and draw them
		for (let i = 0; i < tourneyMaps.length; i++) {
			let modColour = '#FFFFFF';

			if (tourneyMaps[i].modPool === 'NM') {
				modColour = '#6d9eeb';
			} else if (tourneyMaps[i].modPool === 'HD') {
				modColour = '#ffd966';
			} else if (tourneyMaps[i].modPool === 'HR') {
				modColour = '#e06666';
			} else if (tourneyMaps[i].modPool === 'DT') {
				modColour = '#b4a7d6';
			} else if (tourneyMaps[i].modPool === 'FM' || tourneyMaps[i].modPool === 'FMHD' || tourneyMaps[i].modPool === 'FMHR') {
				modColour = '#93c47d';
			} else if (tourneyMaps[i].modPool === 'TB') {
				modColour = '#76a5af';
			}

			// Draw a rectangle
			ctx.fillStyle = '#1E1E1E';
			ctx.fillRect(4, 4 + 100 * (i + 1), 100, 100);

			// Draw a white border
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(4, 4 + 100 * (i + 1), 100, 100);

			// Write the text
			ctx.font = 'bold 30px comfortaa';
			ctx.fillStyle = modColour;
			ctx.textAlign = 'center';
			ctx.fillText(`${tourneyMaps[i].modPool}${tourneyMaps[i].modPoolCount}`, 54, 66 + 100 * (i + 1), 75);

			// Draw the map image
			const mapImage = await getMapListCover(tourneyMaps[i].beatmapsetId, tourneyMaps[i].beatmapId);
			ctx.drawImage(mapImage, 106, 6 + 100 * (i + 1), 96, 96);

			// Draw a white border
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(104, 4 + 100 * (i + 1), 100, 100);

			// Draw a rectangle
			ctx.fillStyle = '#1E1E1E';
			ctx.fillRect(204, 4 + 100 * (i + 1), 400, 100);

			// Draw a white border
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(204, 4 + 100 * (i + 1), 400, 100);

			// Draw the map title
			ctx.fillStyle = modColour;
			ctx.font = '22px comfortaa';
			ctx.textAlign = 'center';
			ctx.fillText(`${tourneyMaps[i].artist} - ${tourneyMaps[i].title}`, 405, 4 + 100 * (i + 1) + 40, 375);
			if (tourneyMaps[i].modPool === 'FMHD') {
				ctx.fillStyle = '#ffd966';
			} else if (tourneyMaps[i].modPool === 'FMHR') {
				ctx.fillStyle = '#e06666';
			}
			ctx.fillText(`[${tourneyMaps[i].difficulty}]`, 405, 4 + 100 * (i + 1) + 80, 375);

			let lineup = [];

			// Draw each player's score
			for (let j = 0; j < players.length; j++) {
				// Draw a rectangle
				ctx.fillStyle = '#1E1E1E';
				ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1), 400, 100);

				// Draw the player's score
				let playerScores = tourneyMaps[i].scores[j];

				//Apply EZ and FL multipliers
				if (tourneyMaps[i].modPool !== 'FMHD' && tourneyMaps[i].modPool !== 'FMHR') {
					for (let k = 0; k < playerScores.length; k++) {
						let mods = getMods(playerScores[k].mods);

						if (mods.includes('EZ')) {
							playerScores[k].score *= ezmultiplier;
						}

						if (mods.includes('FL')) {
							playerScores[k].score *= flmultiplier;
						}

						playerScores[k].score = Math.round(playerScores[k].score);
					}
				}

				playerScores = playerScores.sort((a, b) => b.score - a.score);

				let averageScore = 0;

				for (let k = 0; k < playerScores.length && k < 3; k++) {
					let score = Number(playerScores[k].score);

					averageScore += score;

					// Draw the background
					let colour = getGradientColour(score / 10000);

					ctx.fillStyle = colour;
					ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 150, 33);

					if (playerScores[k].scoringType === 'Converted') {
						if (!legendItems.includes('Converted')) {
							legendItems.push('Converted');
						}

						// Draw a purple rectangle
						ctx.fillStyle = '#A800FF';
						ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);

						// Draw a white border
						ctx.strokeStyle = '#FFFFFF';
						ctx.lineWidth = 4;
						ctx.strokeRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);
					} else if (playerScores[k].scoringType === 'Score v2') {
						if (!legendItems.includes('Score v2')) {
							legendItems.push('Score v2');
						}

						// Draw a blue rectangle
						ctx.fillStyle = '#0000FF';
						ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);

						// Draw a white border
						ctx.strokeStyle = '#FFFFFF';
						ctx.lineWidth = 4;
						ctx.strokeRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);
					} else if (playerScores[k].scoringType === 'Local' && playerScores[k].timestamp) {
						if (!legendItems.includes('Local')) {
							legendItems.push('Local');
						}

						// Draw a green rectangle
						ctx.fillStyle = '#00FF00';
						ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);

						// Draw a white border
						ctx.strokeStyle = '#FFFFFF';
						ctx.lineWidth = 4;
						ctx.strokeRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);
					} else if (playerScores[k].scoringType === 'Local') {
						if (!legendItems.includes('Guesstimate')) {
							legendItems.push('Guesstimate');
						}

						// Draw a yellow rectangle
						ctx.fillStyle = '#FF0000';
						ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);

						// Draw a white border
						ctx.strokeStyle = '#FFFFFF';
						ctx.lineWidth = 4;
						ctx.strokeRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);
					} else if (playerScores[k].scoringType === 'Duel Rating') {
						if (!legendItems.includes('Duel Rating')) {
							legendItems.push('Duel Rating');
						}

						// Draw a red rectangle
						ctx.fillStyle = '#FF0000';
						ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);

						// Draw a white border
						ctx.strokeStyle = '#FFFFFF';
						ctx.lineWidth = 4;
						ctx.strokeRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 14, 33);
					}

					// Draw the player's score
					ctx.fillStyle = '#FFFFFF';
					ctx.font = 'bold 20px comfortaa';
					ctx.textAlign = 'left';
					ctx.strokeStyle = 'black';
					ctx.lineWidth = 1;
					ctx.strokeText(humanReadable(score), 625 + 400 * j, 4 + 100 * (i + 1) + 25 + (k * 33), 100);
					ctx.fillText(humanReadable(score), 625 + 400 * j, 4 + 100 * (i + 1) + 25 + (k * 33), 100);

					// Draw the border
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 4;
					ctx.strokeRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 150, 33);

					if (tourneyMaps[i].modPool.includes('FM')) {
						const freeModMods = ['HD', 'HR', 'FL', 'EZ'];

						// Draw the mods
						let mods = getMods(playerScores[k].mods).filter(mod => freeModMods.includes(mod));

						for (let l = mods.length - 1; l >= 0; l--) {
							let mod = mods[l];

							let modImage = await Canvas.loadImage(`./other/mods/ingame/${mod}.png`);

							ctx.drawImage(modImage, 604 + 400 * j + 121 - ((mods.length - 1) * 10) + (l * 10), 4 + 100 * (i + 1) + (k * 33) + 4, 25, 25);
						}
					}
				}

				averageScore = Math.round(averageScore / Math.min(playerScores.length, 3));

				if (averageScore) {
					lineup.push({ score: averageScore, player: players[j].osuName });

					let colour = getGradientColour(averageScore / 10000);

					ctx.fillStyle = colour;
					ctx.fillRect(754 + 400 * j, 4 + 100 * (i + 1), 250, 100);

					// Draw the player's score
					ctx.fillStyle = '#FFFFFF';
					ctx.font = 'bold 60px comfortaa';
					ctx.textAlign = 'center';
					ctx.strokeStyle = 'black';
					ctx.lineWidth = 3;
					ctx.strokeText(humanReadable(averageScore), 604 + 275 + 400 * j, 4 + 100 * (i + 1) + 75, 200);
					ctx.fillText(humanReadable(averageScore), 604 + 275 + 400 * j, 4 + 100 * (i + 1) + 75, 200);
				}

				// Draw a white border
				ctx.strokeStyle = '#FFFFFF';
				ctx.lineWidth = 4;
				ctx.strokeRect(754 + 400 * j, 4 + 100 * (i + 1), 250, 100);
			}

			// Draw the lineups
			// Draw the rectangle
			ctx.fillStyle = '#1E1E1E';
			ctx.fillRect(204 + 400 * (players.length + 1), 4 + 100 * (i + 1), 400, 100);

			// Draw the player names
			lineup.sort((a, b) => b.score - a.score);

			let finalLineup = [];
			let finalLineupScore = 0;
			for (let j = 0; j < teamsize && j < lineup.length; j++) {
				finalLineup.push(lineup[j].player);
				finalLineupScore += lineup[j].score;
			}

			// Adjust line up text size and split to different lines if it's too long
			ctx.fillStyle = modColour;
			ctx.textAlign = 'center';

			let finalLineUpStrings = [finalLineup.join(', ')];
			ctx.font = 'bold 60px comfortaa';
			let doesNotFit = ctx.measureText(finalLineup.join(', ')).width > 375;

			// start with a large font size
			let fontsize = 60;

			// lower the font size until the text fits the canvas
			do {
				fontsize--;
				ctx.font = fontsize + 'px comfortaa';

				// split the text into multiple lines
				let metrics = ctx.measureText(finalLineup.join(', '));
				let fontHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

				finalLineUpStrings = [];
				let line = finalLineup[0];
				for (let j = 0; j < finalLineup.length; j++) {
					if (j !== 0) {
						let testNextItemIncluded = line + ', ' + finalLineup[j];

						if (ctx.measureText(testNextItemIncluded).width > 375) {
							finalLineUpStrings.push(line);
							line = finalLineup[j];
						} else {
							line = testNextItemIncluded;
						}
					}

					if (j === finalLineup.length - 1) {
						finalLineUpStrings.push(line);
					}
				}

				doesNotFit = fontHeight * finalLineUpStrings.length > 75;
			} while (doesNotFit);

			// draw the text
			let oneLineMetrics = ctx.measureText(finalLineUpStrings.join(', '));
			let oneLineHeight = oneLineMetrics.actualBoundingBoxAscent + oneLineMetrics.actualBoundingBoxDescent;

			ctx.textBaseline = 'top';
			for (let j = 0; j < finalLineUpStrings.length; j++) {
				ctx.fillText(finalLineUpStrings[j], 204 + 200 + 400 * (players.length + 1), 4 + 100 * (i + 1) + (100 - oneLineHeight * finalLineUpStrings.length) / 2 + oneLineHeight * j, 375);
			}
			ctx.textBaseline = 'alphabetic';

			// Draw a white border
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(204 + 400 * (players.length + 1), 4 + 100 * (i + 1), 400, 100);

			// Draw the rectangle
			ctx.fillStyle = '#1E1E1E';
			ctx.fillRect(204 + 400 * (players.length + 2), 4 + 100 * (i + 1), 400, 100);

			if (finalLineupScore) {
				// Draw the rectangle
				let colour = getGradientColour(finalLineupScore / 10000 / teamsize);

				ctx.fillStyle = colour;
				ctx.fillRect(204 + 400 * (players.length + 2), 4 + 100 * (i + 1), 400, 100);

				// Draw the lineup score
				ctx.fillStyle = '#FFFFFF';
				ctx.font = 'bold 60px comfortaa';
				ctx.textAlign = 'center';
				ctx.strokeStyle = 'black';
				ctx.lineWidth = 3;
				ctx.strokeText(humanReadable(finalLineupScore), 204 + 200 + 400 * (players.length + 2), 4 + 100 * (i + 1) + 75, 375);
				ctx.fillText(humanReadable(finalLineupScore), 204 + 200 + 400 * (players.length + 2), 4 + 100 * (i + 1) + 75, 375);
			}

			// Draw a white border
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(204 + 400 * (players.length + 2), 4 + 100 * (i + 1), 400, 100);
		}

		for (let i = 0; i < players.length; i++) {
			// Draw the border around the whole column on the left side
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(604 + 400 * i, 104, 150, 100 * tourneyMaps.length);
		}

		for (let i = 0; i < legendItems.length; i++) {
			// Draw a legend
			ctx.fillStyle = '#1E1E1E';
			ctx.fillRect(24 + i * 250, 128 + 100 * tourneyMaps.length, 200, 60);

			let text = null;
			let colour = null;

			if (legendItems[i] === 'Converted') {
				text = 'Converted v1 Score';
				colour = '#A800FF';
			} else if (legendItems[i] === 'Estimated') {
				text = 'Estimated by player';
				colour = '#FFA800';
			} else if (legendItems[i] === 'Duel Rating') {
				text = 'Duel Rating Estimate';
				colour = '#FF0000';
			} else if (legendItems[i] === 'Score v2') {
				text = 'Tournament Score';
				colour = '#0000FF';
			} else if (legendItems[i] === 'Local') {
				text = 'Local Score';
				colour = '#00FF00';
			} else if (legendItems[i] === 'Guesstimate') {
				text = 'Guesstimate';
				colour = '#FF0000';
			}

			// Draw the text
			ctx.fillStyle = '#FFFFFF';
			ctx.font = 'bold 18px comfortaa';
			ctx.textAlign = 'center';
			ctx.fillText(text, 31 + 100 + i * 250, 128 + 100 * tourneyMaps.length + 37, 150);

			// Draw a rectangle
			ctx.fillStyle = colour;
			ctx.fillRect(24 + i * 250, 128 + 100 * tourneyMaps.length, 14, 60);

			// Draw a white border
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(24 + i * 250, 128 + 100 * tourneyMaps.length, 14, 60);

			// Draw a white border
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 4;
			ctx.strokeRect(24 + i * 250, 128 + 100 * tourneyMaps.length, 200, 60);
		}

		// Create as an attachment
		const files = [new AttachmentBuilder(canvas.toBuffer(), { name: 'teamsheet.png' })];

		let links = tourneyMaps.map(map => `[${map.modPool}${map.modPoolCount}](<https://osu.ppy.sh/b/${map.beatmapId}>)`);

		let content = '';
		let currentMod = tourneyMaps[0].modPool;
		let currentMap = null;

		for (let i = 0; i < links.length; i++) {
			if (currentMap === tourneyMaps[i].beatmapId) {
				continue;
			}
			currentMap = tourneyMaps[i].beatmapId;

			if (tourneyMaps[i].modPool != currentMod || i === 0) {
				currentMod = tourneyMaps[i].modPool;
				content += '\n' + links[i];
			} else {
				content += ' | ' + links[i];
			}
		}

		content += `\n\nEZ Multiplier: ${ezmultiplier}\nFL Multiplier: ${flmultiplier}\n\n Use </osu-scoreupload fileupload:${interaction.client.slashCommandData.find(command => command.name === 'osu-scoreupload').id}> to upload your local scores. How to find the correct file: <https://i.imgur.com/Sv8FojI.jpeg>\nUse </osu-scoreupload guesstimate:${interaction.client.slashCommandData.find(command => command.name === 'osu-scoreupload').id}> to add a guesstimate.`;

		if (interaction.options.getNumber('updatefor')) {
			if (interaction.id) {
				await interaction.editReply('Sending teamsheet...');
			}

			let sentMessage = await interaction.channel.send({ content: content, files: files });

			let date = new Date();
			date.setMinutes(date.getMinutes() + interaction.options.getNumber('updatefor'));

			await DBOsuTeamSheets.create({
				guildId: interaction.guild.id,
				channelId: interaction.channel.id,
				messageId: sentMessage.id,
				updateUntil: date,
				players: players.map(player => player.osuUserId).join(','),
				poolName: interaction.options.getString('mappool'),
				poolCreatorId: commandUser.osuUserId,
				teamsize: teamsize,
				duelRatingEstimate: interaction.options.getBoolean('duelratingestimate'),
				EZMultiplier: ezmultiplier,
				FLMultiplier: flmultiplier,
			});
		} else if (interaction.options.getString('matchlink')) {
			await interaction.followUp({ content: content, files: files });

			// Wait for the match to be over or for a new map to be played
			let loop = true;

			while (loop) {
				await pause(15000);

				let currentMapsPlayed = [];

				let matchLink = getIDFromPotentialOsuLink(interaction.options.getString('matchlink'));

				try {
					// eslint-disable-next-line no-undef
					process.send('osu!API');
					let match = await osuApi.getMatch({ mp: matchLink });

					for (let i = 0; i < match.games.length; i++) {
						currentMapsPlayed.push(match.games[i].beatmapId);
					}

					currentMapsPlayed = [...new Set(currentMapsPlayed)];

					let sixHoursAgo = new Date();
					sixHoursAgo.setUTCHours(sixHoursAgo.getUTCHours() - 6);

					if (match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
						beatmapsPlayed = currentMapsPlayed;
						loop = false;
						return;
					}

					if (currentMapsPlayed.length > beatmapsPlayed.length || match.raw_end || Date.parse(match.raw_start) < sixHoursAgo) {
						beatmapsPlayed = currentMapsPlayed;
						loop = false;
					}
				} catch (err) {
					console.error(err);
				}
			}

			//Setup artificial interaction
			let newInteraction = {
				id: null,
				channel: interaction.channel,
				client: interaction.client,
				guild: interaction.guild,
				user: interaction.user,
				options: {
					getString: (string) => {
						if (string === 'players') {
							return interaction.options.getString('players');
						} else if (string === 'mappool') {
							return interaction.options.getString('mappool');
						} else if (string === 'bans') {
							return interaction.options.getString('bans');
						} else if (string === 'matchlink') {
							return interaction.options.getString('matchlink');
						}
					},
					getNumber: (string) => {
						if (string === 'teamsize') {
							return interaction.options.getNumber('teamsize');
						} else if (string === 'updatefor') {
							return interaction.options.getNumber('updatefor');
						} else if (string === 'ezmultiplier') {
							return interaction.options.getNumber('ezmultiplier');
						} else if (string === 'flmultiplier') {
							return interaction.options.getNumber('flmultiplier');
						}
					},
					getBoolean: (string) => {
						if (string === 'duelratingestimate') {
							return interaction.options.getBoolean('duelratingestimate');
						}
					}
				},
				deferReply: () => { },
				followUp: async (input) => {
					return await interaction.channel.send(input);
				},
				editReply: async (input) => {
					return await interaction.channel.send(input);
				},
				reply: async (input) => {
					return await interaction.channel.send(input);
				}
			};

			module.exports.execute(null, null, newInteraction);
		}
	},
};

function getGradientColour(percentage) {
	// #630000 = 0% -> Gradient -> #990000 = 20% -> Gradient -> #b58800 = 40% -> Gradient -> #e2af15 = 50% | #224c10 = 50% -> Gradient -> #51b526 = 79% | #1155cc is anything above 80%
	let red = 0;
	let green = 0;
	let blue = 0;

	if (percentage < 20) {
		// 63 hex at 0 score, 99 hex at 20%
		red = 99 + 36 * (percentage / 20);

		// 00 hex at 0 score, 00 hex at 20%
		green = 0 + 0 * (percentage / 20);

		// 00 hex at 0 score, 00 hex at 20%
		blue = 0 + 0 * (percentage / 20);
	} else if (percentage < 40) {
		// 99 hex at 20%, b5 hex at 40%
		red = 153 + 42 * ((percentage - 20) / 20);

		// 00 hex at 20%, 88 hex at 40%
		green = 0 + 136 * ((percentage - 20) / 20);

		// 00 hex at 20%, 00 hex at 40%
		blue = 0 + 0 * ((percentage - 20) / 20);
	} else if (percentage < 50) {
		// b5 hex at 40%, e2 hex at 50%
		red = 181 + 45 * ((percentage - 40) / 10);

		// 88 hex at 40%, af hex at 50%
		green = 136 + 47 * ((percentage - 40) / 10);

		// 00 hex at 40%, 15 hex at 50%
		blue = 0 + 21 * ((percentage - 40) / 10);
	} else if (percentage < 80) {
		// 22 hex at 50%, 51 hex at 79%
		red = 34 + 29 * ((percentage - 50) / 29);

		// 4c hex at 50%, b5 hex at 79%
		green = 76 + 73 * ((percentage - 50) / 29);

		// 10 hex at 50%, 26 hex at 79%
		blue = 16 + 10 * ((percentage - 50) / 29);
	} else {
		// 11 hex
		red = 17;

		// 55 hex
		green = 85;

		// cc hex
		blue = 204;
	}

	red = Math.round(red);
	green = Math.round(green);
	blue = Math.round(blue);

	return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}

function scoreIsCorrectMods(score, modPool) {
	if (modPool === 'FM' || modPool === 'TB') {
		return true;
	}

	let mods = getMods(score.mods);

	if ((modPool === 'FMHD' || modPool === 'FMHR') && (mods.includes('DT') && mods.includes('NC'))) {
		return false;
	}

	if (modPool === 'FMHD' && !mods.includes('HR') && (mods.includes('HD') || mods.includes('EZ'))) {
		return true;
	}

	if (modPool === 'FMHR' && mods.includes('HR')) {
		return true;
	}

	if (modPool === 'FMHD' || modPool === 'FMHR') {
		return false;
	}

	let modsReadable = mods.filter(mod => mod !== 'V2' && mod !== 'NF').join('');

	if (modsReadable === '') {
		modsReadable = 'NM';
	}

	modsReadable = modsReadable.replace('NC', 'DT');

	if (modsReadable === modPool) {
		return true;
	}

	return false;
}