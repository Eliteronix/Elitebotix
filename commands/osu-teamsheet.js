const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError, developers } = require('../config.json');
const { DBDiscordUsers, DBOsuMappools, DBOsuSoloScores, DBOsuMultiScores } = require('../dbObjects');
const { pause, getAvatar, logDatabaseQueries, getIDFromPotentialOsuLink, getOsuBeatmap, getMapListCover, getAccuracy, getMods, humanReadable, adjustStarRating } = require('../utils');
const { Op } = require('sequelize');
const Canvas = require('canvas');
const Discord = require('discord.js');
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
		.setDMPermission(true)
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
		.addBooleanOption(option =>
			option.setName('duelratingestimate')
				.setNameLocalizations({
					'de': 'duelratingschätzung',
					'en-GB': 'duelratingestimate',
					'en-US': 'duelratingestimate',
				})
				.setDescription('Whether to fill with an estimate using the duel rating or not')
				.setDescriptionLocalizations({
					'de': 'Ob mit einer Schätzung mittels Duel Ratings gefüllt werden soll oder nicht',
					'en-GB': 'Whether to fill with an estimate using the duel rating or not',
					'en-US': 'Whether to fill with an estimate using the duel rating or not',
				})
				.setRequired(false)
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		let gotResponse = false;

		let cachedUser = discordUsers[interaction.user.id];

		if (!cachedUser) {
			let discordUser = await DBDiscordUsers.findOne({
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
		if (!developers.includes(interaction.user.id)) {
			try {
				return await interaction.reply({ content: 'Only developers may use this command at the moment. As soon as development is finished it will be made public.', ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}
		}

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

		let commandUser = await DBDiscordUsers.findOne({
			where: {
				userId: interaction.user.id
			}
		});

		if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
			return await interaction.editReply('Please connect and verify your account first by using </osu-link connect:1064502370710605836>.');
		}

		let teamsize = interaction.options.getNumber('teamsize');

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

			logDatabaseQueries(4, 'commands/admin/tournamentSheet.js DBDiscordUsers');
			let discordUser = await DBDiscordUsers.findOne({
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
				let discordUser = await DBDiscordUsers.findOne({
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
			where: {
				name: mappoolName,
				creatorId: commandUser.osuUserId
			},
			order: [
				['number', 'ASC']
			]
		});

		if (mappool.length === 0) {
			return await interaction.editReply(`Could not find mappool \`${mappoolName.replace(/`/g, '')}\`.`);
		}

		let tourneyMaps = [];

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
					dbBeatmap.modPool = mods.join('');
				}
			}

			dbBeatmap.modPoolCount = map.modPoolNumber;

			tourneyMaps.push(dbBeatmap);
		}

		logDatabaseQueries(4, 'commands/admin/tournamentSheet.js DBOsuSoloScores');
		let localScores = await DBOsuSoloScores.findAll({
			where: {
				uploaderId: {
					[Op.in]: players.map(player => player.osuUserId),
				},
				beatmapHash: {
					[Op.in]: tourneyMaps.map(map => map.hash),
				},
			},
		});

		let multiScores = await DBOsuMultiScores.findAll({
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

			let playerScores = [];

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
						}

						if (tourneyMaps[i].modPool.includes('HD')) {
							multiplier *= 1.06;
						}

						if (tourneyMaps[i].modPool.includes('HR')) {
							multiplier *= 1.10;
						}

						if (tourneyMaps[i].modPool.includes('EZ')) {
							multiplier *= 0.5;
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

				playerScores = playerScores.concat(soloScoresWithoutMultiScores);
			}

			players[i] = {
				player: players[i],
				scores: playerScores.concat(finalMultiPlayerScores),
			};

			for (let j = 0; j < tourneyMaps.length; j++) {
				let scores = players[i].scores.filter(score => score.beatmapHash === tourneyMaps[j].hash);

				if (scores.length > 0) {
					continue;
				}

				if (!['Graveyard', 'WIP', 'Pending'].includes(tourneyMaps[j].approvalStatus)) {
					// eslint-disable-next-line no-undef
					process.send('osu!API');
					await osuApi.getScores({ b: tourneyMaps[j].beatmapId, u: players[i].player.osuUserId, m: 0 })
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
								}

								if (mods.includes('HD')) {
									multiplier *= 1.06;
								}

								if (mods.includes('HR')) {
									multiplier *= 1.10;
								}

								if (mods.includes('EZ')) {
									multiplier *= 0.5;
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

							players[i].scores = players[i].scores.concat(mapScores);
						})
						.catch(async err => {
							if (err.message !== 'Not found') {
								console.error(err);
							}
						});

					scores = players[i].scores.filter(score => score.beatmapHash === tourneyMaps[j].hash);
				}

				if (scores.length > 0 || !interaction.options.getBoolean('duelratingestimate')) {
					continue;
				}

				let duelRating = null;

				if (tourneyMaps[j].modPool === 'NM') {
					duelRating = players[i].player.osuNoModDuelStarRating;
				} else if (tourneyMaps[j].modPool === 'HD') {
					duelRating = players[i].player.osuHiddenDuelStarRating;
				} else if (tourneyMaps[j].modPool === 'HR') {
					duelRating = players[i].player.osuHardRockDuelStarRating;
				} else if (tourneyMaps[j].modPool === 'DT') {
					duelRating = players[i].player.osuDoubleTimeDuelStarRating;
				} else {
					duelRating = players[i].player.osuFreeModDuelStarRating;
				}

				if (duelRating === null) {
					duelRating = players[i].player.osuDuelStarRating;
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

				players[i].scores.push({
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
			ctx.fillText(players[i].player.osuName, 604 + 240 + 400 * i, 75, 275);

			// Draw the avatar
			let avatar = await getAvatar(players[i].player.osuUserId);
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
			} else if (tourneyMaps[i].modPool === 'FM') {
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
			ctx.fillText(`[${tourneyMaps[i].difficulty}]`, 405, 4 + 100 * (i + 1) + 80, 375);

			let lineup = [];

			// Draw each player's score
			for (let j = 0; j < players.length; j++) {
				// Draw a rectangle
				ctx.fillStyle = '#1E1E1E';
				ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1), 400, 100);

				// Draw the player's score
				let playerScores = players[j].scores.filter(score => score.beatmapHash === tourneyMaps[i].hash);

				playerScores = playerScores.sort((a, b) => b.score - a.score);

				let averageScore = 0;

				for (let k = 0; k < playerScores.length && k < 3; k++) {
					averageScore += Number(playerScores[k].score);

					let score = Number(playerScores[k].score);

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
					} else if (playerScores[k].scoringType === 'Local') {
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
					ctx.textAlign = 'center';
					ctx.fillText(humanReadable(score), 686 + 400 * j, 4 + 100 * (i + 1) + 25 + (k * 33), 100);

					// Draw the border
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 4;
					ctx.strokeRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 150, 33);
				}

				averageScore = Math.round(averageScore / Math.min(playerScores.length, 3));

				if (averageScore) {
					lineup.push({ score: averageScore, player: players[j].player.osuName });

					let colour = getGradientColour(averageScore / 10000);

					ctx.fillStyle = colour;
					ctx.fillRect(754 + 400 * j, 4 + 100 * (i + 1), 250, 100);

					// Draw the player's score
					ctx.fillStyle = '#FFFFFF';
					ctx.font = 'bold 60px comfortaa';
					ctx.textAlign = 'center';
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

		// TODO: Draw a legend for estimated score

		// Create as an attachment
		const files = [new Discord.AttachmentBuilder(canvas.toBuffer(), { name: 'teamsheet.png' })];

		let links = tourneyMaps.map(map => `[${map.modPool}${map.modPoolCount}](<https://osu.ppy.sh/b/${map.beatmapId}>)`);

		let content = '';
		let currentMod = tourneyMaps[0].modPool;

		for (let i = 0; i < links.length; i++) {
			if (tourneyMaps[i].modPool != currentMod || i === 0) {
				currentMod = tourneyMaps[i].modPool;
				content += '\n' + links[i];
			} else {
				content += ' | ' + links[i];
			}
		}

		content += '\n\n Use </osu-scoreupload:1084953371435356291> to upload your local scores.';

		await interaction.followUp({ content: content, files: files });

		//TODO: Reset reaction
		//TODO: Auto update on score upload
		//TODO: Match tracking
		//TODO: Mark which mod was used for FM
	},
};

function getGradientColour(percentage) {
	// #630000 = 0% -> Gradient -> #990000 = 20% -> Gradient -> #b58800 = 50% -> Gradient -> #e2af15 = 59% | #2b6114 = 60% -> Gradient -> #93f06b = 79% | #1155cc is anything above 80%
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
	} else if (percentage < 50) {
		// 99 hex at 20%, b5 hex at 50%
		red = 153 + 42 * ((percentage - 20) / 30);

		// 00 hex at 20%, 88 hex at 50%
		green = 0 + 136 * ((percentage - 20) / 30);

		// 00 hex at 20%, 00 hex at 50%
		blue = 0 + 0 * ((percentage - 20) / 30);
	} else if (percentage < 60) {
		// b5 hex at 40%, e2 hex at 60%
		red = 181 + 27 * ((percentage - 40) / 20);

		// 88 hex at 40%, af hex at 60%
		green = 136 + 47 * ((percentage - 40) / 20);

		// 00 hex at 40%, 15 hex at 60%
		blue = 0 + 21 * ((percentage - 40) / 20);
	} else if (percentage < 80) {
		// 2b hex at 60%, 93 hex at 80%
		red = 43 + 76 * ((percentage - 60) / 20);

		// 61 hex at 60%, f0 hex at 80%
		green = 97 + 111 * ((percentage - 60) / 20);

		// 14 hex at 60%, 6b hex at 80%
		blue = 20 + 75 * ((percentage - 60) / 20);
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

	let modsReadable = getMods(score.mods).filter(mod => mod !== 'V2' && mod !== 'NF').join('');

	if (modsReadable === '') {
		modsReadable = 'NM';
	}

	modsReadable = modsReadable.replace('NC', 'DT');

	if (modsReadable === modPool) {
		return true;
	}

	return false;
}