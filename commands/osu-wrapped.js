const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const osu = require('node-osu');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries, getOsuPlayerName, multiToBanchoScore, getUserDuelStarRating, getOsuBeatmap } = require('../utils');
const Canvas = require('canvas');
const Discord = require('discord.js');

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

		let lastUpdate = new Date();

		for (let i = 0; i < multiScores.length; i++) {
			if (new Date() - lastUpdate > 15000) {
				interaction.editReply(`Processing ${i}/${multiScores.length} scores...`);
				lastUpdate = new Date();
			}

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

		// let duelLeague = getOsuDuelLeague(duelRating.total);

		// let leagueText = duelLeague.name;
		// let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName.replace(/[2-3]/gm, '1')}.png`);

		// ctx.drawImage(leagueImage, -250, -500, 1500, 1500);

		// Write the title of the player
		ctx.font = '35px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText(`${year} osu! wrapped for ${osuUser.osuName}`, canvas.width / 2, 40);

		// Write the title of the player
		ctx.font = '22px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.fillText(`Played tournaments: ${tourneysPlayed.length}`, 190, 90);

		ctx.fillText(`Played matches: ${multiMatches.length}`, 190, 140);
		ctx.fillText(`Won: ${matchesWon} / Lost: ${matchesLost}`, 190, 170);

		ctx.fillText(`Played maps: ${gamesChecked.length}`, 190, 220);
		ctx.fillText(`Won: ${gamesWon} / Lost: ${gamesLost}`, 190, 250);

		ctx.fillText(`Played with ${mostPlayedWith.length} players:`, 190, 300);
		for (let i = 0; i < Math.min(5, mostPlayedWith.length); i++) {
			ctx.fillText(`#${i + 1} ${mostPlayedWith[i].osuName} (${mostPlayedWith[i].amount} times)`, 190, 330 + i * 30);
		}

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

		ctx.fillText('Duel Rating changes:', 810, 90);
		ctx.textAlign = 'right';
		ctx.fillText('Total: ', 730, 120);
		ctx.fillText(oldDuelRating.total.toFixed(3), 792, 120);
		ctx.fillText('→', 820, 120);
		ctx.fillText(duelRating.total.toFixed(3), 884, 120);
		ctx.fillText('|', 900, 120);
		if (duelRating.total - oldDuelRating.total < 0) {
			ctx.fillText((duelRating.total - oldDuelRating.total).toFixed(3), 975, 120);
		} else {
			ctx.fillText(`+${(duelRating.total - oldDuelRating.total).toFixed(3)}`, 975, 120);
		}

		ctx.fillText('NM: ', 730, 145);
		ctx.fillText(oldDuelRating.noMod.toFixed(3), 792, 145);
		ctx.fillText('→', 820, 145);
		ctx.fillText(duelRating.noMod.toFixed(3), 884, 145);
		ctx.fillText('|', 900, 145);
		if (duelRating.noMod - oldDuelRating.noMod < 0) {
			ctx.fillText((duelRating.noMod - oldDuelRating.noMod).toFixed(3), 975, 145);
		} else {
			ctx.fillText(`+${(duelRating.noMod - oldDuelRating.noMod).toFixed(3)}`, 975, 145);
		}

		ctx.fillText('HD: ', 730, 170);
		ctx.fillText(oldDuelRating.hidden.toFixed(3), 792, 170);
		ctx.fillText('→', 820, 170);
		ctx.fillText(duelRating.hidden.toFixed(3), 884, 170);
		ctx.fillText('|', 900, 170);
		if (duelRating.hidden - oldDuelRating.hidden < 0) {
			ctx.fillText((duelRating.hidden - oldDuelRating.hidden).toFixed(3), 975, 170);
		} else {
			ctx.fillText(`+${(duelRating.hidden - oldDuelRating.hidden).toFixed(3)}`, 975, 170);
		}

		ctx.fillText('HR: ', 730, 195);
		ctx.fillText(oldDuelRating.hardRock.toFixed(3), 792, 195);
		ctx.fillText('→', 820, 195);
		ctx.fillText(duelRating.hardRock.toFixed(3), 884, 195);
		ctx.fillText('|', 900, 195);
		if (duelRating.hardRock - oldDuelRating.hardRock < 0) {
			ctx.fillText((duelRating.hardRock - oldDuelRating.hardRock).toFixed(3), 975, 195);
		} else {
			ctx.fillText(`+${(duelRating.hardRock - oldDuelRating.hardRock).toFixed(3)}`, 975, 195);
		}

		ctx.fillText('DT: ', 730, 220);
		ctx.fillText(oldDuelRating.doubleTime.toFixed(3), 792, 220);
		ctx.fillText('→', 820, 220);
		ctx.fillText(duelRating.doubleTime.toFixed(3), 884, 220);
		ctx.fillText('|', 900, 220);
		if (duelRating.doubleTime - oldDuelRating.doubleTime < 0) {
			ctx.fillText((duelRating.doubleTime - oldDuelRating.doubleTime).toFixed(3), 975, 220);
		} else {
			ctx.fillText(`+${(duelRating.doubleTime - oldDuelRating.doubleTime).toFixed(3)}`, 975, 220);
		}

		ctx.fillText('FM: ', 730, 245);
		ctx.fillText(oldDuelRating.freeMod.toFixed(3), 792, 245);
		ctx.fillText('→', 820, 245);
		ctx.fillText(duelRating.freeMod.toFixed(3), 884, 245);
		ctx.fillText('|', 900, 245);
		if (duelRating.freeMod - oldDuelRating.freeMod < 0) {
			ctx.fillText((duelRating.freeMod - oldDuelRating.freeMod).toFixed(3), 975, 245);
		} else {
			ctx.fillText(`+${(duelRating.freeMod - oldDuelRating.freeMod).toFixed(3)}`, 975, 245);
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
		ctx.textAlign = 'right';
		let today = new Date().toLocaleDateString();
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

		//Get a circle in the middle for inserting the player avatar
		ctx.beginPath();
		ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 4, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		//Draw a shape onto the main canvas in the middle 
		try {
			const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${osuUser.osuUserId}`);
			ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 4, canvas.height / 4, canvas.height / 2, canvas.height / 2);
		} catch (error) {
			const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
			ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 4, canvas.height / 4, canvas.height / 2, canvas.height / 2);
		}

		//Create as an attachment
		const files = [new Discord.MessageAttachment(canvas.toBuffer(), `osu-wrapped-${osuUser.osuUserId}-${year}.png`)];

		return interaction.editReply({ content: ' ', files: files });
	},
};