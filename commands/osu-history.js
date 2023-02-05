const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const osu = require('node-osu');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries, getOsuPlayerName, multiToBanchoScore, getUserDuelStarRating, getOsuBeatmap, getOsuDuelLeague, getIDFromPotentialOsuLink } = require('../utils');
const Canvas = require('canvas');
const Discord = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

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
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		//TODO: all tournaments and their results

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
			logDatabaseQueries(4, 'commands/osu-history.js DBDiscordUsers 1');
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
			logDatabaseQueries(4, 'commands/osu-history.js DBDiscordUsers 2');
			discordUser = await DBDiscordUsers.findOne({
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
		let multiMatches = await DBOsuMultiScores.findAll({
			attributes: ['matchId'],
			where: {
				osuUserId: osuUser.osuUserId,
				tourneyMatch: true,
				matchName: {
					[Op.notLike]: 'MOTD:%',
				},
			},
			group: ['matchId'],
		});

		multiMatches = multiMatches.map(match => match.matchId);

		if (multiMatches.length === 0) {
			return interaction.editReply(`\`${osuUser.osuName}\` didn't play any tournament matches.`);
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
		let mostWonAgainst = [];
		let mostLostAgainst = [];
		let tourneysPlayed = [];

		let lastUpdate = new Date();

		let matchesPlayed = [];

		let hideQualifiers = new Date();
		hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

		for (let i = 0; i < multiScores.length; i++) {
			if (new Date() - lastUpdate > 15000) {
				interaction.editReply(`Processing ${i}/${multiScores.length} scores...`);
				lastUpdate = new Date();
			}

			let date = new Date(multiScores[i].matchStartDate);

			if (date > hideQualifiers && multiScores[i].matchName.toLowerCase().includes('qualifier')) {
				multiScores[i].matchId = `XXXXXXXXX (hidden for ${daysHidingQualifiers} days)`;
			}

			if (!matchesPlayed.includes(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${multiScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${multiScores[i].matchId}`)) {
				matchesPlayed.push(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${multiScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${multiScores[i].matchId}`);
			}

			if (!matchesChecked.includes(multiScores[i].matchId)) {
				matchesChecked.push(multiScores[i].matchId);

				// Get all the scores for this game
				let gameScores = multiScores.filter(score => score.gameId === multiScores[i].gameId);

				let ownScore = gameScores.find(score => score.osuUserId === osuUser.osuUserId);

				if (gameScores.length === 2 && gameScores[0].teamType === 'Head to Head' && ownScore) {
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

				let newMatch = false;

				if (mostPlayedWithPlayer) {
					// Check if this match has already been counted
					if (!mostPlayedWithPlayer.matches.includes(multiScores[i].matchId)) {
						mostPlayedWithPlayer.amount++;
						mostPlayedWithPlayer.matches.push(multiScores[i].matchId);

						newMatch = true;
					}
				} else {
					mostPlayedWith.push({
						osuName: await getOsuPlayerName(multiScores[i].osuUserId),
						osuUserId: multiScores[i].osuUserId,
						amount: 1,
						matches: [multiScores[i].matchId],
					});

					newMatch = true;
				}

				if (newMatch) {
					let matchWonAgainst = false;
					let matchLostAgainst = false;

					// Get all the scores for this game
					let gameScores = multiScores.filter(score => score.gameId === multiScores[i].gameId);

					let ownScore = gameScores.find(score => score.osuUserId === osuUser.osuUserId);

					if (gameScores.length === 2 && gameScores[0].teamType === 'Head to Head' && ownScore) {
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
								osuName: await getOsuPlayerName(multiScores[i].osuUserId),
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
								osuName: await getOsuPlayerName(multiScores[i].osuUserId),
								osuUserId: multiScores[i].osuUserId,
								amount: 1,
								matches: [multiScores[i].matchId],
							});
						}
					}
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

		for (let i = 0; i < mostPlayedWith.length; i++) {
			if (mostPlayedWith[i].osuName === null) {
				mostPlayedWith[i].osuName = '[Redacted]';
			}
		}

		mostWonAgainst.sort((a, b) => b.amount - a.amount);

		for (let i = 0; i < mostWonAgainst.length; i++) {
			if (mostWonAgainst[i].osuName === null) {
				mostWonAgainst[i].osuName = '[Redacted]';
			}
		}

		mostLostAgainst.sort((a, b) => b.amount - a.amount);

		for (let i = 0; i < mostLostAgainst.length; i++) {
			if (mostLostAgainst[i].osuName === null) {
				mostLostAgainst[i].osuName = '[Redacted]';
			}
		}

		tourneyPPPlays.sort((a, b) => parseFloat(b.pp) - parseFloat(a.pp));

		// Create rank history graph
		let oldestScore = await DBOsuMultiScores.findOne({
			where: {
				osuUserId: osuUser.osuUserId,
				tourneyMatch: true,
				scoringType: 'Score v2',
				mode: 'Standard',
			},
			order: [
				['gameEndDate', 'ASC']
			]
		});

		// Get the user's duel ratings
		let duelRating = await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: interaction.client });

		let duelRatings = [{ rating: duelRating.total, date: 'Today' }];

		//Set the date to the end of the last month
		let date = new Date();
		date.setUTCDate(1);
		date.setUTCDate(date.getUTCDate() - 1);
		date.setUTCHours(23, 59, 59, 999);

		let iterator = 0;
		let startTime = date - oldestScore.gameEndDate;

		while (date > oldestScore.gameEndDate) {
			iterator++;
			if (new Date() - lastUpdate > 15000) {
				interaction.editReply(`Processing... (${iterator} months deep | ${(100 - (100 / startTime * (date - oldestScore.gameEndDate))).toFixed(2)}%)`);
				lastUpdate = new Date();
			}
			let duelRating = await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: interaction.client, date: date });
			duelRatings.push({ rating: duelRating.total, date: `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}.${date.getUTCFullYear()}` });
			date.setUTCDate(1);
			date.setUTCDate(date.getUTCDate() - 1);
		}

		let labels = [];

		for (let i = 0; i < duelRatings.length; i++) {
			labels.push(duelRatings[i].date);
		}

		labels.reverse();
		duelRatings.reverse();

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

			let masterRating = null;
			let diamondRating = null;
			let platinumRating = null;
			let goldRating = null;
			let silverRating = null;
			let bronzeRating = null;

			if (duelRatings[i].rating > 7) {
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

			masterHistory.push(masterRating);
			diamondHistory.push(diamondRating);
			platinumHistory.push(platinumRating);
			goldHistory.push(goldRating);
			silverHistory.push(silverRating);
			bronzeHistory.push(bronzeRating);
		}

		// Draw the image
		const canvasWidth = 1000;
		const canvasHeight = 775;

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

		//Get a circle in the middle for inserting the player avatar
		ctx.beginPath();
		ctx.arc(475, 250, 125, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		//Draw a shape onto the main canvas in the middle 
		try {
			const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${osuUser.osuUserId}`);
			ctx.drawImage(avatar, 350, 125, 250, 250);
		} catch (error) {
			const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
			ctx.drawImage(avatar, 350, 125, 250, 250);
		}

		//Create as an attachment
		const files = [new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-history-${osuUser.osuUserId}.png` })];

		//Create chart
		const width = 1500; //px
		const height = 750; //px
		const canvasRenderService = new ChartJSNodeCanvas({ width, height });

		const data = {
			labels: labels,
			datasets: [
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

		// eslint-disable-next-line no-undef
		matchesPlayed = new Discord.AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${osuUser.osuUserId}.txt` });
		files.push(matchesPlayed);

		mostPlayedWith = mostPlayedWith.map((user) => {
			return `${user.amount} times - ${user.osuName} (${user.osuUserId})`;
		});

		mostPlayedWith.unshift('Most played with: (Most won against / Most lost against is below)');

		mostWonAgainst = mostWonAgainst.map((user) => {
			return `${user.amount} times - ${user.osuName} (${user.osuUserId})`;
		});

		mostWonAgainst.unshift('');
		mostWonAgainst.unshift('');
		mostWonAgainst.unshift('');
		mostWonAgainst.unshift('Most won against:');

		mostLostAgainst = mostLostAgainst.map((user) => {
			return `${user.amount} times - ${user.osuName} (${user.osuUserId})`;
		});

		mostLostAgainst.unshift('');
		mostLostAgainst.unshift('');
		mostLostAgainst.unshift('');
		mostLostAgainst.unshift('Most lost against:');

		let mostPlayedWonLost = mostPlayedWith.concat(mostWonAgainst, mostLostAgainst);

		// eslint-disable-next-line no-undef
		mostPlayedWonLost = new Discord.AttachmentBuilder(Buffer.from(mostPlayedWonLost.join('\n'), 'utf-8'), { name: `most-played-won-and-lost-${osuUser.osuUserId}.txt` });
		files.push(mostPlayedWonLost);

		return interaction.editReply({ content: ' ', files: files });
	},
};