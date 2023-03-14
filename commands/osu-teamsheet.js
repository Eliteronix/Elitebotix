const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError, developers } = require('../config.json');
const { DBDiscordUsers, DBOsuMappools, DBOsuSoloScores, DBOsuMultiScores } = require('../dbObjects');
const { pause, getAvatar, logDatabaseQueries, getIDFromPotentialOsuLink, getOsuBeatmap, getMapListCover, getAccuracy, getMods, humanReadable } = require('../utils');
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
		}, 2000);

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

		let tourneyMaps = [];

		for (let i = 0; i < mappool.length; i++) {
			let map = mappool[i];

			let dbBeatmap = await getOsuBeatmap({ beatmapId: map.beatmapId });

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
			},
		});

		for (let i = 0; i < players.length; i++) {
			let multiPlayerScores = multiScores.filter(score => score.osuUserId === players[i].osuUserId);

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

				playerScores = playerScores.concat(soloScoresWithoutMultiScores);
			}

			multiPlayerScores = multiPlayerScores.filter(score => score.scoringType === 'Score v2');

			multiPlayerScores = multiPlayerScores.map(score => {
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

			players[i] = {
				player: players[i],
				scores: playerScores.concat(multiPlayerScores),
			};

			for (let j = 0; j < tourneyMaps.length; j++) {
				let scores = players[i].scores.filter(score => score.beatmapHash === tourneyMaps[j].hash);

				if (scores.length > 0 || tourneyMaps[j].approvalStatus === 'Graveyard' || tourneyMaps[j].approvalStatus === 'WIP' || tourneyMaps[j].approvalStatus === 'Pending') {
					continue;
				}

				// eslint-disable-next-line no-undef
				process.send('osu!API');
				await osuApi.getScores({ b: tourneyMaps[j].beatmapId, u: players[i].player.osuUserId, m: 0 })
					.then(async scores => {
						if (scores.length === 0) {
							return null;
						}

						for (let k = 0; k < scores.length; k++) {
							// combo*0.7+log(acc^10)*0.3
							scores[k].convertedScore = Math.round(((scores[k].maxCombo / tourneyMaps[j].maxCombo) * 0.7 + Math.log10(getAccuracy(scores[k])) * 10 * 0.3) * 1000000);
						}

						scores.sort((a, b) => b.convertedScore - a.convertedScore);

						let bestScore = scores[0];

						// TODO: Add a flag that its a converted score
						players[i].scores.push({
							beatmapId: tourneyMaps[j].beatmapId,
							score: bestScore.convertedScore,
							beatmapHash: tourneyMaps[j].hash,
							mods: bestScore.raw_mods,
							count50: bestScore.counts[50],
							count100: bestScore.counts[100],
							count300: bestScore.counts[300],
							countMiss: bestScore.counts.miss,
						});
					})
					.catch(async err => {
						if (err.message !== 'Not found') {
							console.error(err);
						}
					});
			}
		}

		// Create the sheet
		const canvasWidth = 1408 + 400 * players.length;
		const canvasHeight = 108 + 100 * tourneyMaps.length;

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

		// Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		// Get context and load the image
		const ctx = canvas.getContext('2d');

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

				let correctModPlayerScores = [];

				if (tourneyMaps[i].modPool === 'FM' || tourneyMaps[i].modPool === 'TB') {
					correctModPlayerScores = playerScores;
				} else {
					for (let k = 0; k < playerScores.length; k++) {
						let modsReadable = getMods(playerScores[k].mods).filter(mod => mod !== 'V2' && mod !== 'NF').join('');

						if (modsReadable === '') {
							modsReadable = 'NM';
						}

						modsReadable = modsReadable.replace('NC', 'DT');

						if (modsReadable === tourneyMaps[i].modPool) {
							correctModPlayerScores.push(playerScores[k]);
						}
					}
				}

				correctModPlayerScores = correctModPlayerScores.filter(score => {
					let accuracy = getAccuracy({ counts: { 300: score.count300, 100: score.count100, 50: score.count50, miss: score.countMiss } });
					return Number(score.score) < 1300000 && accuracy >= 0.9 || Number(score.score) < 1000000 && accuracy < 0.9;
				});

				correctModPlayerScores = correctModPlayerScores.sort((a, b) => b.score - a.score);

				let averageScore = 0;

				for (let k = 0; k < correctModPlayerScores.length && k < 3; k++) {
					averageScore += Number(correctModPlayerScores[k].score);

					let score = Number(correctModPlayerScores[k].score);

					// Draw the background
					let colour = getGradientColour(score / 10000);

					ctx.fillStyle = colour;
					ctx.fillRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 150, 33);

					// Draw the player's score
					ctx.fillStyle = '#FFFFFF';
					ctx.font = 'bold 20px comfortaa';
					ctx.textAlign = 'center';
					ctx.fillText(humanReadable(score), 679 + 400 * j, 4 + 100 * (i + 1) + 25 + (k * 33), 100);

					// Draw the border
					ctx.strokeStyle = '#FFFFFF';
					ctx.lineWidth = 4;
					ctx.strokeRect(604 + 400 * j, 4 + 100 * (i + 1) + (k * 33), 150, 33);
				}

				averageScore = Math.round(averageScore / Math.min(correctModPlayerScores.length, 3));

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

			ctx.fillStyle = modColour;
			ctx.font = 'bold 60px comfortaa';
			ctx.textAlign = 'center';
			ctx.fillText(finalLineup.join(', '), 204 + 200 + 400 * (players.length + 1), 4 + 100 * (i + 1) + 75, 375);

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

		await interaction.followUp({ content: content, files: files });
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