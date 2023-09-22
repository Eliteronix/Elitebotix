const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const osu = require('node-osu');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries, getOsuPlayerName, multiToBanchoScore, getUserDuelStarRating, getOsuBeatmap, getOsuDuelLeague, getAvatar, logOsuAPICalls } = require('../utils');
const Canvas = require('canvas');
const Discord = require('discord.js');
const fs = require('fs');

module.exports = {
	name: 'osu-wrapped',
	description: 'Sums up the year in osu! for a user',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-wrapped')
		.setNameLocalizations({
			'de': 'osu-wrapped',
			'en-GB': 'osu-wrapped',
			'en-US': 'osu-wrapped',
		})
		.setDescription('Sums up the year in osu! for a user')
		.setDescriptionLocalizations({
			'de': 'Summiert das Jahr in osu! für einen Benutzer',
			'en-GB': 'Sums up the year in osu! for a user',
			'en-US': 'Sums up the year in osu! for a user',
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
		.addIntegerOption(option => {
			option.setName('year')
				.setNameLocalizations({
					'de': 'jahr',
					'en-GB': 'year',
					'en-US': 'year',
				})
				.setDescription('The year to get the wrapped for')
				.setDescriptionLocalizations({
					'de': 'Das Jahr, für das das Wrapped abgerufen werden soll',
					'en-GB': 'The year to get the wrapped for',
					'en-US': 'The year to get the wrapped for',
				})
				.setRequired(false);

			let wrappedYears = [];

			for (let i = 2018; i <= new Date().getFullYear() - 1; i++) {
				wrappedYears.push({
					name: i.toString(),
					value: i,
				});
			}

			wrappedYears.reverse();

			for (const wrappedYear of wrappedYears) {
				option.addChoices({ name: wrappedYear.name, value: wrappedYear.value });
			}

			return option;
		}
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
			logDatabaseQueries(4, 'commands/osu-wrapped.js DBDiscordUsers 1');
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
			logDatabaseQueries(4, 'commands/osu-wrapped.js DBDiscordUsers 2');
			discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId', 'osuName'],
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
				logOsuAPICalls('commands/osu-wrapped.js');
				const user = await osuApi.getUser({ u: username });
				osuUser.osuUserId = user.id;
				osuUser.osuName = user.name;
			} catch (error) {
				return await interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
			}
		}

		// Gather all the data
		let year = new Date().getFullYear() - 1;

		if (interaction.options.getInteger('year')) {
			year = interaction.options.getInteger('year');
		}

		logDatabaseQueries(4, 'commands/osu-wrapped.js DBOsuMultiScores 1');
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
				warmup: {
					[Op.not]: true,
				}
			},
			group: ['matchId'],
		});

		multiMatches = multiMatches.map(match => match.matchId);

		if (multiMatches.length === 0) {
			return interaction.editReply(`\`${osuUser.osuName}\` didn't play any tournament matches in ${year}.`);
		}

		logDatabaseQueries(4, 'commands/osu-wrapped.js DBOsuMultiScores 2');
		let multiScores = await DBOsuMultiScores.findAll({
			attributes: [
				'id',
				'score',
				'gameRawMods',
				'rawMods',
				'teamType',
				'pp',
				'beatmapId',
				'createdAt',
				'gameStartDate',
				'osuUserId',
				'count50',
				'count100',
				'count300',
				'countGeki',
				'countKatu',
				'countMiss',
				'maxCombo',
				'perfect',
				'matchName',
				'mode',
				'matchId',
				'gameId',
				'matchStartDate',
				'team',
			],
			where: {
				matchId: multiMatches,
				warmup: {
					[Op.not]: true,
				}
			},
			order: [
				['matchStartDate', 'DESC'],
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

		let lastUpdate = new Date();

		let matchScores = multiScores.filter(score => score.matchId === multiScores[0].matchId);
		let gameScores = null;
		let matchId = multiScores[0].matchId;
		let gameId = multiScores[0].gameId;

		for (let i = 0; i < multiScores.length; i++) {
			if (parseInt(multiScores[i].score) <= 10000 || multiScores[i].matchName.toLowerCase().includes('scrim')) {
				continue;
			}

			if (new Date() - lastUpdate > 15000) {
				interaction.editReply(`Processing ${i}/${multiScores.length} scores...`);
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

			if (!matchesChecked.includes(multiScores[i].matchId)) {
				matchesChecked.push(multiScores[i].matchId);

				// Get all the scores for this game
				if (!gameScores) {
					gameScores = multiScores.filter(score => score.gameId === multiScores[i].gameId);
				}

				let ownScore = gameScores.find(score => score.osuUserId === osuUser.osuUserId);

				if (gameScores.length === 2 && gameScores[0].teamType === 'Head to Head' && ownScore) {
					let otherScore = gameScores.find(score => score.osuUserId !== osuUser.osuUserId);

					if (parseInt(ownScore.score) > parseInt(otherScore.score)) {
						matchesWon++;
					} else {
						matchesLost++;
					}
				} else if (gameScores[0].teamType === 'Team vs') {
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
					gameScores = multiScores.filter(score => score.gameId === multiScores[i].gameId);
				}

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

			if (multiScores[i].matchName.startsWith('ETX:') || multiScores[i].matchName.startsWith('ETX Teams:') || multiScores[i].matchName.startsWith('o!mm Ranked:') || multiScores[i].matchName.startsWith('o!mm Team Ranked:') || multiScores[i].matchName.startsWith('o!mm Private:') || multiScores[i].matchName.startsWith('o!mm Team Private:')) {
				continue;
			}

			let inMonths = new Date(multiScores[i].matchStartDate);
			inMonths.setMonth(inMonths.getMonth() + 3);

			let tourneyEntry = tourneysPlayed.find(tourney => tourney.acronym.toLowerCase() === multiScores[i].matchName.replace(/:.*/gm, '').replace(/ (GF|F|SF|QF|RO16|RO32|RO64) \d+/gm, '').replace(/ GS\d+/gm, '').toLowerCase() && tourney.date < inMonths);

			if (!tourneyEntry) {
				tourneysPlayed.push({ acronym: multiScores[i].matchName.replace(/:.*/gm, '').replace(/ (GF|F|SF|QF|RO16|RO32|RO64) \d+/gm, '').replace(/ GS\d+/gm, ''), date: multiScores[i].matchStartDate });
			}
		}

		mostPlayedWith.sort((a, b) => b.amount - a.amount);

		tourneyPPPlays.sort((a, b) => parseFloat(b.pp) - parseFloat(a.pp));

		// Get the user's duel ratings
		let duelRating = await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: interaction.client, date: new Date(`${year}-12-31 23:59:59.999 UTC`) });

		let oldDuelRating = await getUserDuelStarRating({ osuUserId: osuUser.osuUserId, client: interaction.client, date: new Date(`${year - 1}-12-31 23:59:59.999 UTC`) });

		// Draw the image
		const canvasWidth = 1000;
		const canvasHeight = 500;

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

		let duelLeague = getOsuDuelLeague(duelRating.total);

		let leagueImage = await Canvas.loadImage(`./other/borders/${duelLeague.imageName.replace(/_[1-3]/gm, '')}.png`);

		ctx.drawImage(leagueImage, 0, 0, 1000, 500);

		// Write the title of the player
		ctx.font = '35px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText(`${year} osu! wrapped for ${osuUser.osuName}`, 475, 40);

		let lineLength = ctx.measureText(`${year} osu! wrapped for ${osuUser.osuName}`).width;

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
		ctx.fillText(`Played tournaments: ${tourneysPlayed.length}`, 50, 90);

		ctx.fillText(`Played matches: ${multiMatches.length}`, 50, 140);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.fillText(`Won: ${matchesWon} / Lost: ${matchesLost}`, 75, 165);

		ctx.font = '22px comfortaa, sans-serif';
		ctx.fillText(`Played maps: ${gamesChecked.length}`, 50, 220);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.fillText(`Won: ${gamesWon} / Lost: ${gamesLost}`, 75, 245);

		if (isNaN(duelRating.total) || duelRating.total === null) {
			duelRating.total = 0;
		}

		if (isNaN(oldDuelRating.total) || oldDuelRating.total === null) {
			oldDuelRating.total = 0;
		}

		if (isNaN(duelRating.noMod) || duelRating.noMod === null) {
			duelRating.noMod = 0;
		}

		if (isNaN(oldDuelRating.noMod) || oldDuelRating.noMod === null) {
			oldDuelRating.noMod = 0;
		}

		if (isNaN(duelRating.hidden) || duelRating.hidden === null) {
			duelRating.hidden = 0;
		}

		if (isNaN(oldDuelRating.hidden) || oldDuelRating.hidden === null) {
			oldDuelRating.hidden = 0;
		}

		if (isNaN(duelRating.hardRock) || duelRating.hardRock === null) {
			duelRating.hardRock = 0;
		}

		if (isNaN(oldDuelRating.hardRock) || oldDuelRating.hardRock === null) {
			oldDuelRating.hardRock = 0;
		}

		if (isNaN(duelRating.doubleTime) || duelRating.doubleTime === null) {
			duelRating.doubleTime = 0;
		}

		if (isNaN(oldDuelRating.doubleTime) || oldDuelRating.doubleTime === null) {
			oldDuelRating.doubleTime = 0;
		}

		if (isNaN(duelRating.freeMod) || duelRating.freeMod === null) {
			duelRating.freeMod = 0;
		}

		if (isNaN(oldDuelRating.freeMod) || oldDuelRating.freeMod === null) {
			oldDuelRating.freeMod = 0;
		}

		ctx.font = '22px comfortaa, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText('Duel Rating changes:', 50, 300);
		ctx.font = '18px comfortaa, sans-serif';
		ctx.textAlign = 'right';
		ctx.fillText('Total: ', 106, 325);
		ctx.fillText(oldDuelRating.total.toFixed(3), 150, 325);
		ctx.fillText('→', 172, 325);
		ctx.fillText(duelRating.total.toFixed(3), 224, 325);
		ctx.fillText('|', 236, 325);
		if (duelRating.total - oldDuelRating.total < 0) {
			ctx.fillText((duelRating.total - oldDuelRating.total).toFixed(3), 295, 325);
		} else {
			ctx.fillText(`+${(duelRating.total - oldDuelRating.total).toFixed(3)}`, 295, 325);
		}

		ctx.fillText('NM: ', 106, 350);
		ctx.fillText(oldDuelRating.noMod.toFixed(3), 150, 350);
		ctx.fillText('→', 172, 350);
		ctx.fillText(duelRating.noMod.toFixed(3), 224, 350);
		ctx.fillText('|', 236, 350);
		if (duelRating.noMod - oldDuelRating.noMod < 0) {
			ctx.fillText((duelRating.noMod - oldDuelRating.noMod).toFixed(3), 295, 350);
		} else {
			ctx.fillText(`+${(duelRating.noMod - oldDuelRating.noMod).toFixed(3)}`, 295, 350);
		}

		ctx.fillText('HD: ', 106, 375);
		ctx.fillText(oldDuelRating.hidden.toFixed(3), 150, 375);
		ctx.fillText('→', 172, 375);
		ctx.fillText(duelRating.hidden.toFixed(3), 224, 375);
		ctx.fillText('|', 236, 375);
		if (duelRating.hidden - oldDuelRating.hidden < 0) {
			ctx.fillText((duelRating.hidden - oldDuelRating.hidden).toFixed(3), 295, 375);
		} else {
			ctx.fillText(`+${(duelRating.hidden - oldDuelRating.hidden).toFixed(3)}`, 295, 375);
		}

		ctx.fillText('HR: ', 106, 400);
		ctx.fillText(oldDuelRating.hardRock.toFixed(3), 150, 400);
		ctx.fillText('→', 172, 400);
		ctx.fillText(duelRating.hardRock.toFixed(3), 224, 400);
		ctx.fillText('|', 236, 400);
		if (duelRating.hardRock - oldDuelRating.hardRock < 0) {
			ctx.fillText((duelRating.hardRock - oldDuelRating.hardRock).toFixed(3), 295, 400);
		} else {
			ctx.fillText(`+${(duelRating.hardRock - oldDuelRating.hardRock).toFixed(3)}`, 295, 400);
		}

		ctx.fillText('DT: ', 106, 425);
		ctx.fillText(oldDuelRating.doubleTime.toFixed(3), 150, 425);
		ctx.fillText('→', 172, 425);
		ctx.fillText(duelRating.doubleTime.toFixed(3), 224, 425);
		ctx.fillText('|', 236, 425);
		if (duelRating.doubleTime - oldDuelRating.doubleTime < 0) {
			ctx.fillText((duelRating.doubleTime - oldDuelRating.doubleTime).toFixed(3), 295, 425);
		} else {
			ctx.fillText(`+${(duelRating.doubleTime - oldDuelRating.doubleTime).toFixed(3)}`, 295, 425);
		}

		ctx.fillText('FM: ', 106, 450);
		ctx.fillText(oldDuelRating.freeMod.toFixed(3), 150, 450);
		ctx.fillText('→', 172, 450);
		ctx.fillText(duelRating.freeMod.toFixed(3), 224, 450);
		ctx.fillText('|', 236, 450);
		if (duelRating.freeMod - oldDuelRating.freeMod < 0) {
			ctx.fillText((duelRating.freeMod - oldDuelRating.freeMod).toFixed(3), 295, 450);
		} else {
			ctx.fillText(`+${(duelRating.freeMod - oldDuelRating.freeMod).toFixed(3)}`, 295, 450);
		}

		ctx.textAlign = 'center';
		ctx.font = '22px comfortaa, sans-serif';
		ctx.fillText(`Played with ${mostPlayedWith.length} players:`, 800, 90);
		ctx.font = '18px comfortaa, sans-serif';
		for (let i = 0; i < Math.min(5, mostPlayedWith.length); i++) {
			ctx.fillText(`#${i + 1} ${mostPlayedWith[i].osuName} (${mostPlayedWith[i].amount} times)`, 800, 115 + i * 25);
		}

		ctx.textAlign = 'left';
		ctx.fillText(`Top ${Math.min(10, tourneyPPPlays.length)} tournament pp plays:`, 635, 300);
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

			ctx.fillText(mapString, 635, 318 + i * 16);
		}

		// Write the title of the player
		ctx.font = '16px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'left';
		let today = new Date().toLocaleDateString();
		ctx.fillText(`Made by Elitebotix on ${today}`, 10, canvas.height - 10);

		//Get a circle in the middle for inserting the player avatar
		ctx.beginPath();
		ctx.arc(475, canvas.height / 2, canvas.height / 4, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		//Draw a shape onto the main canvas in the middle 
		const avatar = await getAvatar(osuUser.osuUserId);
		ctx.drawImage(avatar, 475 - canvas.height / 4, canvas.height / 4, canvas.height / 2, canvas.height / 2);

		// Save the image locally
		const buffer = canvas.toBuffer('image/png');

		//Check if the folder exists and create it if necessary
		if (!fs.existsSync('./wrappedcards')) {
			fs.mkdirSync('./wrappedcards');
		}

		if (!fs.existsSync(`./wrappedcards/${year}`)) {
			fs.mkdirSync(`./wrappedcards/${year}`);
		}

		fs.writeFileSync(`./wrappedcards/${year}/${osuUser.osuUserId}.png`, buffer);

		//Create as an attachment
		const files = [new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-wrapped-${osuUser.osuUserId}-${year}.png` })];

		return interaction.editReply({ content: ' ', files: files });
	},
};