const Discord = require('discord.js');
const osu = require('node-osu');
const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const { getGuildPrefix, getOsuUserServerMode, getIDFromPotentialOsuLink, getMessageUserDisplayname, populateMsgFromInteraction, logDatabaseQueries, fitTextOnMiddleCanvas, getScoreModpool, humanReadable } = require('../utils');
const { Permissions } = require('discord.js');
const Canvas = require('canvas');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

module.exports = {
	name: 'osu-matchup',
	aliases: ['matchup'],
	description: 'Sends an info card about the matchups between the specified players',
	usage: '<username> [username]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Matchup is being processed');

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}
		}
		const guildPrefix = await getGuildPrefix(msg);

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		let users = [];

		if (!args[1]) {//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				users.push(commandUser.osuUserId);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				users.push(userDisplayName);
			}
		}

		//Get profiles by arguments
		for (let i = 0; i < args.length; i++) {
			if (args[i].startsWith('<@') && args[i].endsWith('>')) {
				logDatabaseQueries(4, 'commands/osu-matchup.js DBDiscordUsers');
				const discordUser = await DBDiscordUsers.findOne({
					where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
				});

				if (discordUser && discordUser.osuUserId) {
					users.push(discordUser.osuUserId);
				} else {
					msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
					users.push(args[i]);
				}
			} else {
				users.push(getIDFromPotentialOsuLink(args[i]));
			}
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let usersReadable = [];
		for (let i = 0; i < users.length; i++) {
			await osuApi.getUser({ u: users[i] })
				.then(user => {
					users[i] = user.id;
					usersReadable.push(user.name);
				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user \`${users[i].replace(/`/g, '')}\`. (Use "_" instead of spaces)`);
						users.splice(i, 1);
						i--;
					} else {
						console.log(err);
					}
				});
		}

		if (users.length < 2) {
			return msg.channel.send('Not enough users left for the matchup.');
		}

		let processingMessage = await msg.channel.send(`[${usersReadable[0]} vs ${usersReadable[1]}] Processing...`);

		//Add all multiscores from both players to an array
		let scores = [];
		logDatabaseQueries(4, 'commands/osu-matchup.js DBOsuMultiScores User1');
		scores.push(await DBOsuMultiScores.findAll({
			where: {
				osuUserId: users[0],
				tourneyMatch: true,
				mode: 'Standard'
			}
		}));
		logDatabaseQueries(4, 'commands/osu-matchup.js DBOsuMultiScores User2');
		scores.push(await DBOsuMultiScores.findAll({
			where: {
				osuUserId: users[1],
				tourneyMatch: true,
				mode: 'Standard'
			}
		}));
		quicksort(scores[0]);
		quicksort(scores[1]);

		//Create arrays of standings for each player/Mod/Score
		//[ScoreV1[User1Wins, User2Wins], ScoreV2[User1Wins, User2Wins]]
		let directNoModWins = [[0, 0], [0, 0]];
		let directHiddenWins = [[0, 0], [0, 0]];
		let directHardRockWins = [[0, 0], [0, 0]];
		let directDoubleTimeWins = [[0, 0], [0, 0]];
		let directFreeModWins = [[0, 0], [0, 0]];

		let indirectNoModWins = [[0, 0], [0, 0]];
		let indirectHiddenWins = [[0, 0], [0, 0]];
		let indirectHardRockWins = [[0, 0], [0, 0]];
		let indirectDoubleTimeWins = [[0, 0], [0, 0]];
		let indirectFreeModWins = [[0, 0], [0, 0]];

		let matchesPlayed = [];
		for (let i = 0; i < scores[0].length; i++) {
			for (let j = 0; j < scores[1].length; j++) {
				//Find a score from the same game
				if (scores[0][i].gameId === scores[1][j].gameId) {
					//Push matches for the history txt
					if (!matchesPlayed.includes(`${(scores[0][i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${scores[0][i].matchStartDate.getUTCFullYear()} - ${scores[0][i].matchName} ----- https://osu.ppy.sh/community/matches/${scores[0][i].matchId}`)) {
						matchesPlayed.push(`${(scores[0][i].matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${scores[0][i].matchStartDate.getUTCFullYear()} - ${scores[0][i].matchName} ----- https://osu.ppy.sh/community/matches/${scores[0][i].matchId}`);
					}

					//Evaluate if it was played with Score v2 or not (0 = v1, 1 = v2)
					let scoreVersion = 0;
					if (scores[0][i].scoringType === 'Score v2') {
						scoreVersion = 1;
					}

					//Evaluate which score is better (0 = user1; 1 = user2)
					let winner = 0;
					if (parseInt(scores[0][i].score) < parseInt(scores[1][j].score)) {
						winner = 1;
					}

					//Evaluate with which mods the game was played
					if (!scores[0][i].freeMod && scores[0][i].rawMods === '0' && (scores[0][i].gameRawMods === '0' || scores[0][i].gameRawMods === '1')) {
						directNoModWins[scoreVersion][winner]++;
					} else if (scores[0][i].rawMods === '0' && (scores[0][i].gameRawMods === '8' || scores[0][i].gameRawMods === '9')) {
						directHiddenWins[scoreVersion][winner]++;
					} else if (scores[0][i].rawMods === '0' && (scores[0][i].gameRawMods === '16' || scores[0][i].gameRawMods === '17')) {
						directHardRockWins[scoreVersion][winner]++;
					} else if (scores[0][i].rawMods === '0' && (scores[0][i].gameRawMods === '64' || scores[0][i].gameRawMods === '65' || scores[0][i].gameRawMods === '576' || scores[0][i].gameRawMods === '577')) {
						directDoubleTimeWins[scoreVersion][winner]++;
					} else {
						directFreeModWins[scoreVersion][winner]++;
					}
				}
			}
		}

		//Get an array of all played maps by both players
		let mapsPlayedByFirst = [];
		for (let i = 0; i < scores[0].length; i++) {
			let scoring = 'V1';
			if (scores[0][i].scoringType === 'Score v2') {
				scoring = 'V2';
			}
			let mods = getScoreModpool(scores[0][i]);
			if (!mapsPlayedByFirst.includes(`${scoring}-${mods}-${scores[0][i].beatmapId}`)) {
				mapsPlayedByFirst.push(`${scoring}-${mods}-${scores[0][i].beatmapId}`);
			}
		}

		let mapsPlayedByBoth = [];
		for (let i = 0; i < scores[1].length; i++) {
			let scoring = 'V1';
			if (scores[1][i].scoringType === 'Score v2') {
				scoring = 'V2';
			}
			let mods = getScoreModpool(scores[1][i]);
			if (!mapsPlayedByBoth.includes(`${scoring}-${mods}-${scores[1][i].beatmapId}`) && mapsPlayedByFirst.includes(`${scoring}-${mods}-${scores[1][i].beatmapId}`)) {
				mapsPlayedByBoth.push(`${scoring}-${mods}-${scores[1][i].beatmapId}`);
			}
		}

		for (let i = 0; i < mapsPlayedByBoth.length; i++) {
			//Keep one score for mod evaluation later
			let score = null;

			//Loop throught all the scores of User 1 and get the most recent score on the map
			let scoreUser1 = 0;
			for (let j = 0; j < scores[0].length; j++) {
				let scoring = 'V1';
				if (scores[0][j].scoringType === 'Score v2') {
					scoring = 'V2';
				}
				let mods = getScoreModpool(scores[0][j]);
				if (`${scoring}-${mods}-${scores[0][j].beatmapId}` === mapsPlayedByBoth[i]) {
					scoreUser1 = parseInt(scores[0][j].score);
					score = scores[0][j];
				}
			}

			//Loop throught all the scores of User 2 and get the most recent score on the map
			let scoreUser2 = 0;
			for (let j = 0; j < scores[1].length; j++) {
				let scoring = 'V1';
				if (scores[1][j].scoringType === 'Score v2') {
					scoring = 'V2';
				}
				let mods = getScoreModpool(scores[1][j]);
				if (`${scoring}-${mods}-${scores[1][j].beatmapId}` === mapsPlayedByBoth[i]) {
					scoreUser2 = parseInt(scores[1][j].score);
					score = scores[1][j];
				}
			}

			//Evaluate if it was played with Score v2 or not (0 = v1, 1 = v2)
			let scoreVersion = 0;
			if (score.scoringType === 'Score v2') {
				scoreVersion = 1;
			}

			//Evaluate which score is better (0 = user1; 1 = user2)
			let winner = 0;
			if (scoreUser1 < scoreUser2) {
				winner = 1;
			}

			//Evaluate with which mods the game was played
			if (getScoreModpool(score) === 'NM') {
				indirectNoModWins[scoreVersion][winner]++;
			} else if (getScoreModpool(score) === 'HD') {
				indirectHiddenWins[scoreVersion][winner]++;
			} else if (getScoreModpool(score) === 'HR') {
				indirectHardRockWins[scoreVersion][winner]++;
			} else if (getScoreModpool(score) === 'DT') {
				indirectDoubleTimeWins[scoreVersion][winner]++;
			} else {
				indirectFreeModWins[scoreVersion][winner]++;
			}
		}

		const canvasWidth = 1000;
		const canvasHeight = 700;

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

		//Get context and load the image
		const ctx = canvas.getContext('2d');

		const background = await Canvas.loadImage('./other/osu-background.png');

		for (let i = 0; i < canvas.height / background.height; i++) {
			for (let j = 0; j < canvas.width / background.width; j++) {
				ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
			}
		}

		let today = new Date().toLocaleDateString();

		ctx.font = 'bold 15px comfortaa, sans-serif';
		ctx.fillStyle = '#ffffff';

		ctx.textAlign = 'left';
		ctx.fillText(`UserIDs: ${users[0]} vs ${users[1]}`, canvas.width / 140, canvas.height - canvas.height / 70);

		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.font = 'bold 40px comfortaa, sans-serif';
		fitTextOnMiddleCanvas(ctx, `${usersReadable[0]} vs. ${usersReadable[1]}`, 40, 'comfortaa, sans-serif', 90, 1000, 400);

		ctx.font = 'bold 30px comfortaa, sans-serif';
		ctx.fillText('Direct Matchups', 250, 210);
		ctx.fillText('Indirect Matchups', 750, 210);

		ctx.font = 'bold 10px comfortaa, sans-serif';
		ctx.fillText('(All maps played in the same lobby; Duplicate maps count)', 250, 230);
		ctx.fillText('(All the same maps played in any tournaments; Most recent scores on beatmaps count)', 750, 230);

		ctx.font = 'bold 30px comfortaa, sans-serif';
		ctx.fillText('NM', 175, 275);
		ctx.fillText('HD', 325, 275);
		ctx.fillText('HR', 175, 365);
		ctx.fillText('DT', 325, 365);
		ctx.fillText('FM', 250, 455);
		ctx.fillText('Total', 250, 545);

		ctx.fillStyle = getColor(directNoModWins);
		ctx.fillText(`${directNoModWins[0][0] + directNoModWins[1][0]} - ${directNoModWins[0][1] + directNoModWins[1][1]}`, 175, 310);
		ctx.fillStyle = getColor(directHiddenWins);
		ctx.fillText(`${directHiddenWins[0][0] + directHiddenWins[1][0]} - ${directHiddenWins[0][1] + directHiddenWins[1][1]}`, 325, 310);
		ctx.fillStyle = getColor(directHardRockWins);
		ctx.fillText(`${directHardRockWins[0][0] + directHardRockWins[1][0]} - ${directHardRockWins[0][1] + directHardRockWins[1][1]}`, 175, 400);
		ctx.fillStyle = getColor(directDoubleTimeWins);
		ctx.fillText(`${directDoubleTimeWins[0][0] + directDoubleTimeWins[1][0]} - ${directDoubleTimeWins[0][1] + directDoubleTimeWins[1][1]}`, 325, 400);
		ctx.fillStyle = getColor(directFreeModWins);
		ctx.fillText(`${directFreeModWins[0][0] + directFreeModWins[1][0]} - ${directFreeModWins[0][1] + directFreeModWins[1][1]}`, 250, 490);
		ctx.fillStyle = '#ffffff';
		if (directNoModWins[0][0] + directNoModWins[1][0] + directHiddenWins[0][0] + directHiddenWins[1][0] + directHardRockWins[0][0] + directHardRockWins[1][0] + directDoubleTimeWins[0][0] + directDoubleTimeWins[1][0] + directFreeModWins[0][0] + directFreeModWins[1][0] > directNoModWins[0][1] + directNoModWins[1][1] + directHiddenWins[0][1] + directHiddenWins[1][1] + directHardRockWins[0][1] + directHardRockWins[1][1] + directDoubleTimeWins[0][1] + directDoubleTimeWins[1][1] + directFreeModWins[0][1] + directFreeModWins[1][1]) {
			ctx.fillStyle = '#2299BB';
		} else if (directNoModWins[0][0] + directNoModWins[1][0] + directHiddenWins[0][0] + directHiddenWins[1][0] + directHardRockWins[0][0] + directHardRockWins[1][0] + directDoubleTimeWins[0][0] + directDoubleTimeWins[1][0] + directFreeModWins[0][0] + directFreeModWins[1][0] < directNoModWins[0][1] + directNoModWins[1][1] + directHiddenWins[0][1] + directHiddenWins[1][1] + directHardRockWins[0][1] + directHardRockWins[1][1] + directDoubleTimeWins[0][1] + directDoubleTimeWins[1][1] + directFreeModWins[0][1] + directFreeModWins[1][1]) {
			ctx.fillStyle = '#BB1177';
		}
		ctx.fillText(`${directNoModWins[0][0] + directNoModWins[1][0] + directHiddenWins[0][0] + directHiddenWins[1][0] + directHardRockWins[0][0] + directHardRockWins[1][0] + directDoubleTimeWins[0][0] + directDoubleTimeWins[1][0] + directFreeModWins[0][0] + directFreeModWins[1][0]} - ${directNoModWins[0][1] + directNoModWins[1][1] + directHiddenWins[0][1] + directHiddenWins[1][1] + directHardRockWins[0][1] + directHardRockWins[1][1] + directDoubleTimeWins[0][1] + directDoubleTimeWins[1][1] + directFreeModWins[0][1] + directFreeModWins[1][1]}`, 250, 580);

		ctx.fillStyle = '#ffffff';
		ctx.fillText('NM', 675, 275);
		ctx.fillText('HD', 825, 275);
		ctx.fillText('HR', 675, 365);
		ctx.fillText('DT', 825, 365);
		ctx.fillText('FM', 750, 455);
		ctx.fillText('Total', 750, 545);
		ctx.fillStyle = getColor(indirectNoModWins);
		ctx.fillText(`${indirectNoModWins[0][0] + indirectNoModWins[1][0]} - ${indirectNoModWins[0][1] + indirectNoModWins[1][1]}`, 675, 310);
		ctx.fillStyle = getColor(indirectHiddenWins);
		ctx.fillText(`${indirectHiddenWins[0][0] + indirectHiddenWins[1][0]} - ${indirectHiddenWins[0][1] + indirectHiddenWins[1][1]}`, 825, 310);
		ctx.fillStyle = getColor(indirectHardRockWins);
		ctx.fillText(`${indirectHardRockWins[0][0] + indirectHardRockWins[1][0]} - ${indirectHardRockWins[0][1] + indirectHardRockWins[1][1]}`, 675, 400);
		ctx.fillStyle = getColor(indirectDoubleTimeWins);
		ctx.fillText(`${indirectDoubleTimeWins[0][0] + indirectDoubleTimeWins[1][0]} - ${indirectDoubleTimeWins[0][1] + indirectDoubleTimeWins[1][1]}`, 825, 400);
		ctx.fillStyle = getColor(indirectFreeModWins);
		ctx.fillText(`${indirectFreeModWins[0][0] + indirectFreeModWins[1][0]} - ${indirectFreeModWins[0][1] + indirectFreeModWins[1][1]}`, 750, 490);
		ctx.fillStyle = '#ffffff';
		if (indirectNoModWins[0][0] + indirectNoModWins[1][0] + indirectHiddenWins[0][0] + indirectHiddenWins[1][0] + indirectHardRockWins[0][0] + indirectHardRockWins[1][0] + indirectDoubleTimeWins[0][0] + indirectDoubleTimeWins[1][0] + indirectFreeModWins[0][0] + indirectFreeModWins[1][0] > indirectNoModWins[0][1] + indirectNoModWins[1][1] + indirectHiddenWins[0][1] + indirectHiddenWins[1][1] + indirectHardRockWins[0][1] + indirectHardRockWins[1][1] + indirectDoubleTimeWins[0][1] + indirectDoubleTimeWins[1][1] + indirectFreeModWins[0][1] + indirectFreeModWins[1][1]) {
			ctx.fillStyle = '#2299BB';
		} else if (indirectNoModWins[0][0] + indirectNoModWins[1][0] + indirectHiddenWins[0][0] + indirectHiddenWins[1][0] + indirectHardRockWins[0][0] + indirectHardRockWins[1][0] + indirectDoubleTimeWins[0][0] + indirectDoubleTimeWins[1][0] + indirectFreeModWins[0][0] + indirectFreeModWins[1][0] < indirectNoModWins[0][1] + indirectNoModWins[1][1] + indirectHiddenWins[0][1] + indirectHiddenWins[1][1] + indirectHardRockWins[0][1] + indirectHardRockWins[1][1] + indirectDoubleTimeWins[0][1] + indirectDoubleTimeWins[1][1] + indirectFreeModWins[0][1] + indirectFreeModWins[1][1]) {
			ctx.fillStyle = '#BB1177';
		}
		ctx.fillText(`${indirectNoModWins[0][0] + indirectNoModWins[1][0] + indirectHiddenWins[0][0] + indirectHiddenWins[1][0] + indirectHardRockWins[0][0] + indirectHardRockWins[1][0] + indirectDoubleTimeWins[0][0] + indirectDoubleTimeWins[1][0] + indirectFreeModWins[0][0] + indirectFreeModWins[1][0]} - ${indirectNoModWins[0][1] + indirectNoModWins[1][1] + indirectHiddenWins[0][1] + indirectHiddenWins[1][1] + indirectHardRockWins[0][1] + indirectHardRockWins[1][1] + indirectDoubleTimeWins[0][1] + indirectDoubleTimeWins[1][1] + indirectFreeModWins[0][1] + indirectFreeModWins[1][1]}`, 750, 580);

		//Save old context
		ctx.save();

		//Add a stroke around the level by how much it is completed
		ctx.beginPath();
		ctx.arc(90, 90, 85, 0, Math.PI * 2);
		ctx.strokeStyle = '#2299BB';
		ctx.lineWidth = 5;
		ctx.stroke();

		//Get a circle for inserting the player avatar
		ctx.beginPath();
		ctx.arc(90, 90, 80, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		//Draw a shape onto the main canvas
		try {
			const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${users[0]}`);
			ctx.drawImage(avatar, 10, 10, 160, 160);
		} catch (error) {
			const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
			ctx.drawImage(avatar, 10, 10, 160, 160);
		}

		//Restore old context
		ctx.restore();

		//Add a stroke around the level by how much it is completed
		ctx.beginPath();
		ctx.arc(910, 90, 85, 0, Math.PI * 2);
		ctx.strokeStyle = '#BB1177';
		ctx.lineWidth = 5;
		ctx.stroke();

		//Get a circle for inserting the player avatar
		ctx.beginPath();
		ctx.arc(910, 90, 80, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		//Draw a shape onto the main canvas
		try {
			const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${users[1]}`);
			ctx.drawImage(avatar, 830, 10, 160, 160);
		} catch (error) {
			const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
			ctx.drawImage(avatar, 830, 10, 160, 160);
		}

		let files = [];
		//Create as an attachment
		const matchUpStats = new Discord.MessageAttachment(canvas.toBuffer(), `osu-matchup-${users[0]}-${users[1]}.png`);

		files.push(matchUpStats);

		let content = `Matchup analysis for \`${usersReadable[0]}\` vs \`${usersReadable[1]}\``;

		if (mapsPlayedByBoth.length) {
			content += `\nWinrate chart for \`${usersReadable[0]}\` against \`${usersReadable[1]}\` attached.`;
			//Loop through all maps played by both players and fill an array of rounds won with timestamp
			let rounds = [];
			for (let i = 0; i < mapsPlayedByBoth.length; i++) {
				let scoreUser1 = null;
				let scoreUser2 = null;

				//Loop through all scores of player 1
				for (let j = 0; j < scores[0].length; j++) {
					//If the score is for the map played by both players
					let scoring = 'V1';
					if (scores[0][j].scoringType === 'Score v2') {
						scoring = 'V2';
					}
					let mods = getScoreModpool(scores[0][j]);
					if (`${scoring}-${mods}-${scores[0][j].beatmapId}` === mapsPlayedByBoth[i]) {
						scoreUser1 = scores[0][j];
					}
				}

				//Loop through all scores of player 2
				for (let j = 0; j < scores[1].length; j++) {
					//If the score is for the map played by both players
					let scoring = 'V1';
					if (scores[1][j].scoringType === 'Score v2') {
						scoring = 'V2';
					}
					let mods = getScoreModpool(scores[1][j]);
					if (`${scoring}-${mods}-${scores[1][j].beatmapId}` === mapsPlayedByBoth[i]) {
						scoreUser2 = scores[1][j];
					}
				}

				//Evaluate with which modPool the game was played
				let modPool = getScoreModpool(scoreUser1);

				//Set winner (0 = user1; 1 = user2)
				let winner = 0;
				if (parseInt(scoreUser1.score) < parseInt(scoreUser2.score)) {
					winner = 1;
				}

				let matchId = scoreUser1.matchId;
				let date = scoreUser1.matchStartDate;
				let dateReadable = `${(scoreUser1.matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${scoreUser1.matchStartDate.getUTCFullYear()}`;
				if (parseInt(scoreUser1.matchId) < parseInt(scoreUser2.matchId)) {
					matchId = scoreUser2.matchId;
					date = scoreUser2.matchStartDate;
					dateReadable = `${(scoreUser2.matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${scoreUser2.matchStartDate.getUTCFullYear()}`;
				}

				rounds.push({
					mod: modPool,
					winner: winner,
					matchId: matchId,
					date: date,
					dateReadable: dateReadable,
				});
			}

			quicksort(rounds);

			//Fill an array of labels for the rounds won
			let labels = [];
			for (let i = 0; i < rounds.length; i++) {
				if (!labels.includes(rounds[rounds.length - 1 - i].dateReadable)) {
					labels.push(rounds[rounds.length - 1 - i].dateReadable);
				}
			}

			//Get cumulated winrate out of rounds array for each label
			let NMWinrates = [];
			let HDWinrates = [];
			let HRWinrates = [];
			let DTWinrates = [];
			let FMWinrates = [];
			let totalWinrates = [];
			for (let i = 0; i < labels.length; i++) {
				//[Wins, Rounds played]
				let NMRounds = [0, 0];
				let HDRounds = [0, 0];
				let HRRounds = [0, 0];
				let DTRounds = [0, 0];
				let FMRounds = [0, 0];
				let totalRounds = [0, 0];

				//Loop through all rounds
				for (let j = 0; j < rounds.length; j++) {
					//If totalRounds[1] is bigger than one we already looped throught the first match under this label
					if (totalRounds[1] > 0 || rounds[j].dateReadable === labels[i]) {
						//Increase total amounts
						totalRounds[1]++;
						if (rounds[j].winner === 0) {
							totalRounds[0]++;
						}

						//Increase amounts for the modPool
						if (rounds[j].mod === 'NM') {
							NMRounds[1]++;
							if (rounds[j].winner === 0) {
								NMRounds[0]++;
							}
						} else if (rounds[j].mod === 'HD') {
							HDRounds[1]++;
							if (rounds[j].winner === 0) {
								HDRounds[0]++;
							}
						} else if (rounds[j].mod === 'HR') {
							HRRounds[1]++;
							if (rounds[j].winner === 0) {
								HRRounds[0]++;
							}
						} else if (rounds[j].mod === 'DT') {
							DTRounds[1]++;
							if (rounds[j].winner === 0) {
								DTRounds[0]++;
							}
						} else if (rounds[j].mod === 'FM') {
							FMRounds[1]++;
							if (rounds[j].winner === 0) {
								FMRounds[0]++;
							}
						}
					}
				}

				//Calculate winrates
				let NMWinrate = null;
				if (NMRounds[1] > 0) {
					NMWinrate = (NMRounds[0] / NMRounds[1]) * 100;
				}
				NMWinrates.push(NMWinrate);

				let HDWinrate = null;
				if (HDRounds[1] > 0) {
					HDWinrate = (HDRounds[0] / HDRounds[1]) * 100;
				}
				HDWinrates.push(HDWinrate);

				let HRWinrate = null;
				if (HRRounds[1] > 0) {
					HRWinrate = (HRRounds[0] / HRRounds[1]) * 100;
				}
				HRWinrates.push(HRWinrate);

				let DTWinrate = null;
				if (DTRounds[1] > 0) {
					DTWinrate = (DTRounds[0] / DTRounds[1]) * 100;
				}
				DTWinrates.push(DTWinrate);

				let FMWinrate = null;
				if (FMRounds[1] > 0) {
					FMWinrate = (FMRounds[0] / FMRounds[1]) * 100;
				}
				FMWinrates.push(FMWinrate);

				let totalWinrate = null;
				if (totalRounds[1] > 0) {
					totalWinrate = (totalRounds[0] / totalRounds[1]) * 100;
				}
				totalWinrates.push(totalWinrate);
			}

			if (labels.length === 1) {
				labels.push(labels[0]);
				totalWinrates.push(totalWinrates[0]);
				NMWinrates.push(NMWinrates[0]);
				HDWinrates.push(HDWinrates[0]);
				HRWinrates.push(HRWinrates[0]);
				DTWinrates.push(DTWinrates[0]);
				FMWinrates.push(FMWinrates[0]);
			}

			const width = 1500; //px
			const height = 750; //px
			const canvasRenderService = new ChartJSNodeCanvas({ width, height });

			const data = {
				labels: labels,
				datasets: [
					{
						label: 'Cumulated Winrate (All Mods)',
						data: totalWinrates,
						borderColor: 'rgb(201, 203, 207)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Winrate (NM only)',
						data: NMWinrates,
						borderColor: 'rgb(54, 162, 235)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Winrate (HD only)',
						data: HDWinrates,
						borderColor: 'rgb(255, 205, 86)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Winrate (HR only)',
						data: HRWinrates,
						borderColor: 'rgb(255, 99, 132)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Winrate (DT only)',
						data: DTWinrates,
						borderColor: 'rgb(153, 102, 255)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Winrate (FM only)',
						data: FMWinrates,
						borderColor: 'rgb(75, 192, 192)',
						fill: false,
						tension: 0.4
					}
				]
			};

			const configuration = {
				type: 'line',
				data: data,
				options: {
					spanGaps: true,
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: 'Cumulated winrate for indirect matchups',
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
								text: 'Month',
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
								text: `Winrate for ${usersReadable[0]} in %`,
								color: '#FFFFFF'
							},
							grid: {
								color: '#8F8F8F'
							},
							ticks: {
								color: '#FFFFFF',
							},
							suggestedMin: 0,
							suggestedMax: 100
						}
					}
				},
			};

			const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

			const matchupWinrateChart = new Discord.MessageAttachment(imageBuffer, `osu-matchup-${users[0]}-vs-${users[1]}.png`);

			files.push(matchupWinrateChart);

			//[won by user1 array[NM[], HD[], HR[], DT[], FM[]], won by user2 array[NM[], HD[], HR[], DT[], FM[]]]]
			//divided by player who won -> divided by modpool
			let mapsPlayedByBothReadable = [[[], [], [], [], []], [[], [], [], [], []]];

			for (let i = 0; i < mapsPlayedByBoth.length; i++) {
				let scoreUser1 = null;
				let scoreUser2 = null;

				//Loop through all scores of player 1
				for (let j = 0; j < scores[0].length; j++) {
					//If the score is for the map played by both players
					let scoring = 'V1';
					if (scores[0][j].scoringType === 'Score v2') {
						scoring = 'V2';
					}
					let mods = getScoreModpool(scores[0][j]);
					if (`${scoring}-${mods}-${scores[0][j].beatmapId}` === mapsPlayedByBoth[i]) {
						scoreUser1 = scores[0][j];
						scores[0].splice(j, 1);
						j--;
					}
				}

				//Loop through all scores of player 2
				for (let j = 0; j < scores[1].length; j++) {
					//If the score is for the map played by both players
					let scoring = 'V1';
					if (scores[1][j].scoringType === 'Score v2') {
						scoring = 'V2';
					}
					let mods = getScoreModpool(scores[1][j]);
					if (`${scoring}-${mods}-${scores[1][j].beatmapId}` === mapsPlayedByBoth[i]) {
						scoreUser2 = scores[1][j];
						scores[1].splice(j, 1);
						j--;
					}
				}

				let dateReadable = `${(scoreUser1.matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${scoreUser1.matchStartDate.getUTCFullYear()}`;
				if (parseInt(scoreUser1.matchId) < parseInt(scoreUser2.matchId)) {
					dateReadable = `${(scoreUser2.matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${scoreUser2.matchStartDate.getUTCFullYear()}`;
				}

				//Evaluate which score is better (0 = user1; 1 = user2)
				let winner = 0;
				if (parseInt(scoreUser1.score) < parseInt(scoreUser2.score)) {
					winner = 1;
				}

				let modPoolNumber = 0;
				if (getScoreModpool(scoreUser1) === 'NM') {
					modPoolNumber = 0;
				} else if (getScoreModpool(scoreUser1) === 'HD') {
					modPoolNumber = 1;
				} else if (getScoreModpool(scoreUser1) === 'HR') {
					modPoolNumber = 2;
				} else if (getScoreModpool(scoreUser1) === 'DT') {
					modPoolNumber = 3;
				} else if (getScoreModpool(scoreUser1) === 'FM') {
					modPoolNumber = 4;
				}

				let scoringType = 'V1';
				if (scoreUser1.scoringType === 'Score v2') {
					scoringType = 'V2';
				}

				mapsPlayedByBothReadable[winner][modPoolNumber].push(`${dateReadable} - ${scoringType} ${getScoreModpool(scoreUser1)} https://osu.ppy.sh/b/${scoreUser1.beatmapId} - Won by: ${usersReadable[winner]} (by ${humanReadable(Math.abs(parseInt(scoreUser1.score) - parseInt(scoreUser2.score)))}) - ${humanReadable(scoreUser1.score)} vs ${humanReadable(scoreUser2.score)}`);
			}

			//Convert modpool arrays into strings
			for (let i = 0; i < mapsPlayedByBothReadable.length; i++) {
				for (let j = 0; j < mapsPlayedByBothReadable[i].length; j++) {
					if (mapsPlayedByBothReadable[i][j].length) {
						mapsPlayedByBothReadable[i][j] = mapsPlayedByBothReadable[i][j].join('\n');
					} else {
						mapsPlayedByBothReadable[i].splice(j, 1);
						j--;
					}
				}
			}

			//Convert player arrays into strings
			for (let i = 0; i < mapsPlayedByBothReadable.length; i++) {
				if (mapsPlayedByBothReadable[i].length) {
					mapsPlayedByBothReadable[i] = mapsPlayedByBothReadable[i].join('\n\n');
				} else {
					mapsPlayedByBothReadable[i].push('No maps won');
				}
			}

			//Add the player names in front of both strings
			for (let i = 0; i < mapsPlayedByBothReadable.length; i++) {
				mapsPlayedByBothReadable[i] = `----------${usersReadable[i]}----------\n${mapsPlayedByBothReadable[i]}`;
			}

			// eslint-disable-next-line no-undef
			mapsPlayedByBothReadable = new Discord.MessageAttachment(Buffer.from(mapsPlayedByBothReadable.join('\n\n\n\n'), 'utf-8'), `indirect-matchups-${users[0]}-vs-${users[1]}.txt`);
			files.push(mapsPlayedByBothReadable);
		}

		if (matchesPlayed.length) {
			// eslint-disable-next-line no-undef
			matchesPlayed = new Discord.MessageAttachment(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), `multi-matches-${users[0]}-vs-${users[1]}.txt`);
			files.push(matchesPlayed);
		}

		await processingMessage.delete();

		let sentMessage;
		if (msg.id) {
			if (msg.id === 1) {
				sentMessage = await msg.channel.send({ content: content, files: files });
			} else {
				sentMessage = await msg.reply({ content: content, files: files });
			}
		} else {
			sentMessage = await interaction.followUp({ content: content, files: files });
		}

		sentMessage.react('🔵');
		sentMessage.react('🔴');
		return;
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].matchId) >= parseFloat(pivot.matchId)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}

function getColor(array) {
	let color = '#ffffff';
	if (array[0][0] + array[1][0] > array[0][1] + array[1][1]) {
		color = '#2299BB';
	} else if (array[0][0] + array[1][0] < array[0][1] + array[1][1]) {
		color = '#BB1177';
	}

	return color;
}