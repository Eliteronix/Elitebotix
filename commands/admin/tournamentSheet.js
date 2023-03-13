const { DBDiscordUsers, DBOsuSoloScores, DBOsuMultiScores } = require('../../dbObjects.js');
const { getIDFromPotentialOsuLink, getOsuBeatmap, logDatabaseQueries, getMods, getAccuracy, humanReadable, getMapListCover } = require('../../utils.js');
const { Op } = require('sequelize');
const Canvas = require('canvas');
const Discord = require('discord.js');
const osu = require('node-osu');

module.exports = {
	name: 'tournamentSheet',
	usage: '<teamsize> [<players>] [<NM/HD/HR/DT/FM/EZ/HDDT/.../TB> [<mapIds>]]',
	async execute(interaction) {
		const args = interaction.options.getString('argument').split(/ +/);

		let players = [];

		let tourneyMaps = [];

		let currentMod = null;
		let currentModCount = 0;

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let teamsize = Number(args.shift());

		while (args.length) {
			if (currentMod === null) {
				if (args[0] !== 'NM') {
					let username = args.shift();

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
						continue;
					}

					await interaction.followUp(`User \`${username.replace(/`/g, '')}\` has been skipped.`);
					continue;
				} else {
					currentMod = args.shift();
				}
			}

			// Mappool
			// New Modpool
			if (isNaN(args[0])) {
				currentMod = args.shift();
				currentModCount = 0;
				continue;
			}

			// MapId / URL
			let mapId = getIDFromPotentialOsuLink(args.shift());

			let dbBeatmap = await getOsuBeatmap({ beatmapId: mapId });

			currentModCount++;

			dbBeatmap.modPool = currentMod;
			dbBeatmap.modPoolCount = currentModCount;

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

			// TODO: Check since when v2 mod gets added by the multiplayer
			// TODO: Something about multiple maps kills the way this works
			let playerScores = localScores.filter(score => {
				if (score.uploaderId !== players[i].osuUserId) {
					return false;
				}

				let map = tourneyMaps.find(map => map.beatmapHash === score.hash);

				let existingMultiPlayerScore = multiPlayerScores.find(multiScore => multiScore.beatmapId === map.beatmapId && parseInt(multiScore.count50) === score.count50 && parseInt(multiScore.count100) === score.count100 && parseInt(multiScore.count300) === score.count300 && parseInt(multiScore.countMiss) === score.countMiss && parseInt(multiScore.score) === score.score && (parseInt(multiScore.rawMods) + parseInt(multiScore.gameRawMods) === score.mods || parseInt(multiScore.rawMods) + parseInt(multiScore.gameRawMods) + 536870912 === score.mods));

				if (existingMultiPlayerScore) {
					return false;
				}

				return true;
			});

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

			// TODO: If the player has no local v2 scores, use v1 scores

			players[i] = {
				player: players[i],
				scores: playerScores.concat(multiPlayerScores),
			};
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
			ctx.fillText(players[i].player.osuName, 604 + 200 + 400 * i, 75, 375);

			// TODO: Draw the avatar
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