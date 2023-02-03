const Discord = require('discord.js');
const osu = require('node-osu');
const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const { getOsuUserServerMode, getIDFromPotentialOsuLink, getMessageUserDisplayname, populateMsgFromInteraction, logDatabaseQueries, fitTextOnMiddleCanvas, getScoreModpool, humanReadable, getOsuBeatmap } = require('../utils');
const { PermissionsBitField } = require('discord.js');
const Canvas = require('canvas');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { Op } = require('sequelize');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');

module.exports = {
	name: 'osu-matchup',
	description: 'Sends an info card about the matchups between the specified players',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		let teamsize = 1;
		let team1 = [];
		let team2 = [];
		let timeframe = new Date();
		timeframe = timeframe.setFullYear(timeframe.getFullYear() - 1);
		let timeframeText = 'last 1 year';

		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			try {//TODO: Deferreply
				//await interaction.deferReply();
				await interaction.reply('Processing...');
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			args = [];

			if (interaction.options._hoistedOptions && interaction.options.getSubcommand() === '1v1') {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'tourney') {
						if (interaction.options._hoistedOptions[i].value) {
							args.push('--tourney');
						} else {
							args.push('--all');
						}
					} else if (interaction.options._hoistedOptions[i].name === 'timeframe') {
						if (interaction.options._hoistedOptions[i].value === '1m') {
							timeframe = new Date();
							timeframe.setMonth(timeframe.getMonth() - 1);
							timeframeText = 'last 1 month';
						} else if (interaction.options._hoistedOptions[i].value === '3m') {
							timeframe = new Date();
							timeframe.setMonth(timeframe.getMonth() - 3);
							timeframeText = 'last 3 months';
						} else if (interaction.options._hoistedOptions[i].value === '6m') {
							timeframe = new Date();
							timeframe.setMonth(timeframe.getMonth() - 6);
							timeframeText = 'last 6 months';
						} else if (interaction.options._hoistedOptions[i].value === '1y') {
							timeframe = new Date();
							timeframe.setFullYear(timeframe.getFullYear() - 1);
							timeframeText = 'last 1 year';
						} else if (interaction.options._hoistedOptions[i].value === '2y') {
							timeframe = new Date();
							timeframe.setFullYear(timeframe.getFullYear() - 2);
							timeframeText = 'last 2 years';
						} else if (interaction.options._hoistedOptions[i].value === 'all') {
							timeframe = new Date(0);
							timeframeText = 'all time';
						}
					} else {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			} else if (interaction.options._hoistedOptions && interaction.options.getSubcommand() === 'teamvs') {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'teamsize') {
						teamsize = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name.startsWith('team1')) {
						team1.push(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'tourney') {
						if (interaction.options._hoistedOptions[i].value) {
							args.push('--tourney');
						} else {
							args.push('--all');
						}
					} else if (interaction.options._hoistedOptions[i].name === 'scores') {
						args.push(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'timeframe') {
						if (interaction.options._hoistedOptions[i].value === '1m') {
							timeframe = new Date();
							timeframe.setMonth(timeframe.getMonth() - 1);
							timeframeText = 'last 1 month';
						} else if (interaction.options._hoistedOptions[i].value === '3m') {
							timeframe = new Date();
							timeframe.setMonth(timeframe.getMonth() - 3);
							timeframeText = 'last 3 months';
						} else if (interaction.options._hoistedOptions[i].value === '6m') {
							timeframe = new Date();
							timeframe.setMonth(timeframe.getMonth() - 6);
							timeframeText = 'last 6 months';
						} else if (interaction.options._hoistedOptions[i].value === '1y') {
							timeframe = new Date();
							timeframe.setFullYear(timeframe.getFullYear() - 1);
							timeframeText = 'last 1 year';
						} else if (interaction.options._hoistedOptions[i].value === '2y') {
							timeframe = new Date();
							timeframe.setFullYear(timeframe.getFullYear() - 2);
							timeframeText = 'last 2 years';
						} else if (interaction.options._hoistedOptions[i].value === 'all') {
							timeframe = new Date(0);
							timeframeText = 'all time';
						}
					} else {
						team2.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];

		let scoringType = 'v2';
		let tourneyMatch = true;
		for (let i = 0; i < args.length; i++) {
			if (args[i].toLowerCase().startsWith('--v2')) {
				scoringType = 'v2';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--v1')) {
				scoringType = 'v1';
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--tourney')) {
				tourneyMatch = true;
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--all')) {
				tourneyMatch = false;
				args.splice(i, 1);
				i--;
			} else if (args[i].toLowerCase().startsWith('--vx')) {
				scoringType = 'vx';
				args.splice(i, 1);
				i--;
			}
		}

		//Teamvs subcommand is the only occasion that args is empty
		if (!interaction || interaction && interaction.options.getSubcommand() !== 'teamvs') {
			//If only one player got specified the author wants to see the matchup between them and themselves
			if (!args[1]) {
				if (commandUser && commandUser.osuUserId) {
					team1.push(commandUser.osuUserId);
				} else {
					const userDisplayName = await getMessageUserDisplayname(msg);
					team1.push(userDisplayName);
				}

				team2.push(args[0]);
			} else {
				//If two players got specified the author wants to see the matchup between them
				team1.push(args[0]);
				team2.push(args[1]);
			}
		}

		if (team1.length < teamsize) {
			return msg.channel.send('You did not specify enough players for team 1.');
		} else if (team2.length < teamsize) {
			return msg.channel.send('You did not specify enough players for team 2.');
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		//Define 2 new arrays to store the name of the players while we fill the others with the ID exclusively
		const team1Names = [];
		const team2Names = [];

		//Loop through team one and get the user Ids if they were mentions
		//Get profiles by arguments
		for (let i = 0; i < team1.length; i++) {
			if (team1[i]) {
				if (team1[i].startsWith('<@') && team1[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-matchup.js DBDiscordUsers1');
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: team1[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						team1[i] = discordUser.osuUserId;
					} else {
						msg.channel.send(`\`${team1[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:1064502370710605836>.`);
						team1.splice(i, 1);
						i--;
						continue;
					}
				} else {
					team1[i] = getIDFromPotentialOsuLink(team1[i]);
				}

				await osuApi.getUser({ u: team1[i] })
					.then(user => {
						team1[i] = user.id;
						team1Names.push(user.name);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find user \`${team1[i].replace(/`/g, '')}\`.`);
							team1.splice(i, 1);
							i--;
						} else {
							console.error(err);
						}
					});
			}
		}

		//Do the same for team2
		for (let i = 0; i < team2.length; i++) {
			if (team2[i]) {
				if (team2[i].startsWith('<@') && team2[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-matchup.js DBDiscordUsers2');
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: team2[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						team2[i] = discordUser.osuUserId;
					} else {
						msg.channel.send(`\`${team2[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:1064502370710605836>.`);
						team2.splice(i, 1);
						i--;
						continue;
					}
				} else {
					team2[i] = getIDFromPotentialOsuLink(team2[i]);
				}

				await osuApi.getUser({ u: team2[i] })
					.then(user => {
						team2[i] = user.id;
						team2Names.push(user.name);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find user \`${team2[i].replace(/`/g, '')}\`.`);
							team2.splice(i, 1);
							i--;
						} else {
							console.error(err);
						}
					});
			}
		}

		if (team1.length < teamsize || team2.length < teamsize) {
			return msg.channel.send('Not enough users left for the matchup.');
		}

		let processingMessage = await msg.channel.send(`[\`${team1Names.join(' ')}\` vs \`${team2Names.join(' ')}\`] Processing...`);

		//Add all multiscores from both teams to an array
		let scoresTeam1 = [];
		let scoresTeam2 = [];

		//Loop throught team one and get all their multi scores
		for (let i = 0; i < team1.length; i++) {
			logDatabaseQueries(4, `commands/osu-matchup.js DBOsuMultiScores 1User${i + 1}`);
			scoresTeam1.push(await DBOsuMultiScores.findAll({
				where: {
					osuUserId: team1[i],
					mode: 'Standard',
					score: {
						[Op.gte]: 10000
					},
					[Op.or]: [
						{ warmup: false },
						{ warmup: null }
					],
					gameEndDate: {
						[Op.gte]: timeframe
					}
				}
			}));

			//Remove userScores which don't fit the criteria
			for (let j = 0; j < scoresTeam1[i].length; j++) {
				if (parseInt(scoresTeam1[i][j].score) <= 10000
					|| scoringType === 'v2' && scoresTeam1[i][j].scoringType !== 'Score v2'
					|| scoringType === 'v1' && scoresTeam1[i][j].scoringType !== 'Score'
					|| tourneyMatch && !scoresTeam1[i][j].tourneyMatch) {
					scoresTeam1[i].splice(j, 1);
					j--;
				}
			}

			quicksort(scoresTeam1[i]);
		}

		//Loop throught team two and get all their multi scores
		for (let i = 0; i < team2.length; i++) {
			logDatabaseQueries(4, `commands/osu-matchup.js DBOsuMultiScores 2User${i + 1}`);
			scoresTeam2.push(await DBOsuMultiScores.findAll({
				where: {
					osuUserId: team2[i],
					mode: 'Standard',
					score: {
						[Op.gte]: 10000
					},
					[Op.or]: [
						{ warmup: false },
						{ warmup: null }
					],
					gameEndDate: {
						[Op.gte]: timeframe
					}
				}
			}));

			//Remove userScores which don't fit the criteria
			for (let j = 0; j < scoresTeam2[i].length; j++) {
				if (parseInt(scoresTeam2[i][j].score) <= 10000
					|| scoringType === 'v2' && scoresTeam2[i][j].scoringType !== 'Score v2'
					|| scoringType === 'v1' && scoresTeam2[i][j].scoringType !== 'Score'
					|| tourneyMatch && !scoresTeam2[i][j].tourneyMatch) {
					scoresTeam2[i].splice(j, 1);
					j--;
				}
			}

			quicksort(scoresTeam2[i]);
		}

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

		//Direct matchups
		//Get a list of all games played by both teams
		let gamesPlayed = [];
		for (let i = 0; i < scoresTeam1.length; i++) {
			for (let j = 0; j < scoresTeam1[i].length; j++) {
				if (gamesPlayed.indexOf(scoresTeam1[i][j].gameId) === -1) {
					gamesPlayed.push(scoresTeam1[i][j].gameId);
				}
			}
		}

		for (let i = 0; i < scoresTeam2.length; i++) {
			for (let j = 0; j < scoresTeam2[i].length; j++) {
				if (gamesPlayed.indexOf(scoresTeam2[i][j].gameId) === -1) {
					gamesPlayed.push(scoresTeam2[i][j].gameId);
				}
			}
		}

		//Loop through all games played and check if on both team sides at least teamsize players played the game aswell
		for (let i = 0; i < gamesPlayed.length; i++) {
			let team1Count = 0;
			let team2Count = 0;

			for (let j = 0; j < scoresTeam1.length; j++) {
				for (let k = 0; k < scoresTeam1[j].length; k++) {
					if (scoresTeam1[j][k].gameId === gamesPlayed[i]) {
						team1Count++;
					}
				}
			}

			for (let j = 0; j < scoresTeam2.length; j++) {
				for (let k = 0; k < scoresTeam2[j].length; k++) {
					if (scoresTeam2[j][k].gameId === gamesPlayed[i]) {
						team2Count++;
					}
				}
			}

			if (team1Count < teamsize || team2Count < teamsize) {
				gamesPlayed.splice(i, 1);
				i--;
			}
		}

		//Loop through all games, get the score for each player and add the teamsize best scores together and compare
		let matchesPlayed = [];

		let hideQualifiers = new Date();
		hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);
		for (let i = 0; i < gamesPlayed.length; i++) {
			let team1GameScores = [];
			let team2GameScores = [];

			//Get all game scores for team 1
			for (let j = 0; j < scoresTeam1.length; j++) {
				for (let k = 0; k < scoresTeam1[j].length; k++) {
					if (scoresTeam1[j][k].gameId === gamesPlayed[i]) {
						team1GameScores.push(scoresTeam1[j][k]);
					}
				}
			}

			//Get all game scores for team 2
			for (let j = 0; j < scoresTeam2.length; j++) {
				for (let k = 0; k < scoresTeam2[j].length; k++) {
					if (scoresTeam2[j][k].gameId === gamesPlayed[i]) {
						team2GameScores.push(scoresTeam2[j][k]);
					}
				}
			}

			//Sort the scores for each team
			quicksortScore(team1GameScores);
			quicksortScore(team2GameScores);

			//Add the best scores together
			let team1Score = 0;
			let team2Score = 0;

			for (let j = 0; j < teamsize; j++) {
				team1Score += parseInt(team1GameScores[j].score);
				team2Score += parseInt(team2GameScores[j].score);
			}

			//Compare the scores | Winner is by default team 1 | If team 2 is better, change winner
			let winner = 0;
			if (team1Score < team2Score) {
				winner = 1;
			}

			//Evaluate if it was played with Score v2 or not (0 = v1, 1 = v2)
			let scoreVersion = 0;
			if (team1GameScores[0].scoringType === 'Score v2') {
				scoreVersion = 1;
			}

			//Evaluate with which mods the game was played
			if (getScoreModpool(team1GameScores[0]) === 'NM') {
				directNoModWins[scoreVersion][winner]++;
			} else if (getScoreModpool(team1GameScores[0]) === 'HD') {
				directHiddenWins[scoreVersion][winner]++;
			} else if (getScoreModpool(team1GameScores[0]) === 'HR') {
				directHardRockWins[scoreVersion][winner]++;
			} else if (getScoreModpool(team1GameScores[0]) === 'DT') {
				directDoubleTimeWins[scoreVersion][winner]++;
			} else {
				directFreeModWins[scoreVersion][winner]++;
			}

			//Push matches for the history txt
			let date = new Date(team1GameScores[0].matchStartDate);

			if (date > hideQualifiers && team1GameScores[0].matchName.toLowerCase().includes('qualifier')) {
				team1GameScores[0].matchId = `XXXXXXXXX (hidden for ${daysHidingQualifiers} days)`;
			}

			if (!matchesPlayed.includes(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${team1GameScores[0].matchName} ----- https://osu.ppy.sh/community/matches/${team1GameScores[0].matchId}`)) {
				matchesPlayed.push(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${team1GameScores[0].matchName} ----- https://osu.ppy.sh/community/matches/${team1GameScores[0].matchId}`);
			}
		}

		//Indirect matchups
		//Get a list of all maps played for each modPool by all players from both teams
		let mapsPlayed = [];
		for (let i = 0; i < scoresTeam1.length; i++) {
			for (let j = 0; j < scoresTeam1[i].length; j++) {
				let scoreVersion = 'V1';
				if (scoresTeam1[i][j].scoringType === 'Score v2') {
					scoreVersion = 'V2';
				}
				if (mapsPlayed.indexOf(`${scoreVersion}${getScoreModpool(scoresTeam1[i][j])}${scoresTeam1[i][j].beatmapId}`) === -1) {
					mapsPlayed.push(`${scoreVersion}${getScoreModpool(scoresTeam1[i][j])}${scoresTeam1[i][j].beatmapId}`);
				}
			}
		}

		for (let i = 0; i < scoresTeam2.length; i++) {
			for (let j = 0; j < scoresTeam2[i].length; j++) {
				let scoreVersion = 'V1';
				if (scoresTeam2[i][j].scoringType === 'Score v2') {
					scoreVersion = 'V2';
				}
				if (mapsPlayed.indexOf(`${scoreVersion}${getScoreModpool(scoresTeam2[i][j])}${scoresTeam2[i][j].beatmapId}`) === -1) {
					mapsPlayed.push(`${scoreVersion}${getScoreModpool(scoresTeam2[i][j])}${scoresTeam2[i][j].beatmapId}`);
				}
			}
		}

		//Loop through all maps played and check if on both team sides at least teamsize players played the map aswell
		for (let i = 0; i < mapsPlayed.length; i++) {
			let team1Count = 0;
			let team2Count = 0;

			for (let j = 0; j < scoresTeam1.length && team1Count < teamsize; j++) {
				for (let k = 0; k < scoresTeam1[j].length; k++) {
					let scoreVersion = 'V1';
					if (scoresTeam1[j][k].scoringType === 'Score v2') {
						scoreVersion = 'V2';
					}
					if (`${scoreVersion}${getScoreModpool(scoresTeam1[j][k])}${scoresTeam1[j][k].beatmapId}` === mapsPlayed[i]) {
						team1Count++;
						break;
					}
				}
			}

			if (team1Count < teamsize) {
				mapsPlayed.splice(i, 1);
				i--;
				continue;
			}

			for (let j = 0; j < scoresTeam2.length && team2Count < teamsize; j++) {
				for (let k = 0; k < scoresTeam2[j].length; k++) {
					let scoreVersion = 'V1';
					if (scoresTeam2[j][k].scoringType === 'Score v2') {
						scoreVersion = 'V2';
					}
					if (`${scoreVersion}${getScoreModpool(scoresTeam2[j][k])}${scoresTeam2[j][k].beatmapId}` === mapsPlayed[i]) {
						team2Count++;
						break;
					}
				}
			}

			if (team2Count < teamsize) {
				mapsPlayed.splice(i, 1);
				i--;
				continue;
			}
		}

		//Loop through all maps, get the most recent score for each player and add the teamsize best scores together and compare
		//For the graph
		let rounds = [];

		//For the maps played txt
		//[won by team1 array[NM[], HD[], HR[], DT[], FM[]], won by team2 array[NM[], HD[], HR[], DT[], FM[]]]]
		//divided by player who won -> divided by modpool
		let mapsPlayedReadable = [[[], [], [], [], []], [[], [], [], [], []]];
		for (let i = 0; i < mapsPlayed.length; i++) {
			let team1MapScores = [];
			let team2MapScores = [];

			//For the round array
			let matchId = null;
			let date = null;
			let dateReadable = null;

			//Get all map scores for team 1 | Scores are already sorted by matchID descending so the first score is the most recent
			for (let j = 0; j < scoresTeam1.length; j++) {
				for (let k = 0; k < scoresTeam1[j].length; k++) {
					let scoreVersion = 'V1';
					if (scoresTeam1[j][k].scoringType === 'Score v2') {
						scoreVersion = 'V2';
					}
					if (`${scoreVersion}${getScoreModpool(scoresTeam1[j][k])}${scoresTeam1[j][k].beatmapId}` === mapsPlayed[i]) {
						team1MapScores.push(scoresTeam1[j][k]);
						if (!matchId || matchId < scoresTeam1[j][k].matchId) {
							matchId = scoresTeam1[j][k].matchId;
							date = new Date(scoresTeam1[j][k].matchStartDate);
							dateReadable = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}`;
						}
						break;
					}
				}
			}

			//Get all map scores for team 2 | Scores are already sorted by matchID descending so the first score is the most recent
			for (let j = 0; j < scoresTeam2.length; j++) {
				for (let k = 0; k < scoresTeam2[j].length; k++) {
					let scoreVersion = 'V1';
					if (scoresTeam2[j][k].scoringType === 'Score v2') {
						scoreVersion = 'V2';
					}
					if (`${scoreVersion}${getScoreModpool(scoresTeam2[j][k])}${scoresTeam2[j][k].beatmapId}` === mapsPlayed[i]) {
						team2MapScores.push(scoresTeam2[j][k]);
						if (!matchId || parseInt(matchId) < parseInt(scoresTeam2[j][k].matchId)) {
							matchId = scoresTeam2[j][k].matchId;
							date = new Date(scoresTeam2[j][k].matchStartDate);
							dateReadable = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}`;
						}
						break;
					}
				}
			}

			//Sort the scores for each team
			quicksortScore(team1MapScores);
			quicksortScore(team2MapScores);

			//Add the best scores together
			let team1Score = 0;
			let team2Score = 0;

			let team1Players = [];
			let team2Players = [];

			for (let j = 0; j < teamsize; j++) {
				team1Score += parseInt(team1MapScores[j].score);
				team2Score += parseInt(team2MapScores[j].score);

				team1Players.push(team1Names[team1.indexOf(team1MapScores[j].osuUserId)]);
				team2Players.push(team2Names[team2.indexOf(team2MapScores[j].osuUserId)]);
			}

			//Compare the scores | Winner is by default team 1 | If team 2 is better, change winner
			let winner = 0;
			if (team1Score < team2Score) {
				winner = 1;
			}

			//Evaluate if it was played with Score v2 or not (0 = v1, 1 = v2)
			let scoreVersion = 0;
			if (team1MapScores[0].scoringType === 'Score v2') {
				scoreVersion = 1;
			}

			//Evaluate with which mods the game was played
			if (getScoreModpool(team1MapScores[0]) === 'NM') {
				indirectNoModWins[scoreVersion][winner]++;
			} else if (getScoreModpool(team1MapScores[0]) === 'HD') {
				indirectHiddenWins[scoreVersion][winner]++;
			} else if (getScoreModpool(team1MapScores[0]) === 'HR') {
				indirectHardRockWins[scoreVersion][winner]++;
			} else if (getScoreModpool(team1MapScores[0]) === 'DT') {
				indirectDoubleTimeWins[scoreVersion][winner]++;
			} else {
				indirectFreeModWins[scoreVersion][winner]++;
			}

			//For the graph
			rounds.push({
				mod: getScoreModpool(team1MapScores[0]),
				winner: winner,
				score: team1Score / team2Score,
				matchId: matchId,
				date: date,
				dateReadable: dateReadable,
			});

			//For the maps played txt
			let modPoolNumber = 0;
			if (getScoreModpool(team1MapScores[0]) === 'NM') {
				modPoolNumber = 0;
			} else if (getScoreModpool(team1MapScores[0]) === 'HD') {
				modPoolNumber = 1;
			} else if (getScoreModpool(team1MapScores[0]) === 'HR') {
				modPoolNumber = 2;
			} else if (getScoreModpool(team1MapScores[0]) === 'DT') {
				modPoolNumber = 3;
			} else if (getScoreModpool(team1MapScores[0]) === 'FM') {
				modPoolNumber = 4;
			}

			let scoringType = 'V1';
			if (team1MapScores[0].scoringType === 'Score v2') {
				scoringType = 'V2';
			}

			let dbBeatmap = await getOsuBeatmap({ beatmapId: team1MapScores[0].beatmapId });

			let beatmapString = `https://osu.ppy.sh/b/${team1MapScores[0].beatmapId}`;

			if (dbBeatmap) {
				beatmapString += ` (${dbBeatmap.artist} - ${dbBeatmap.title} [${dbBeatmap.difficulty}])`;
			}

			if (winner === 0) {
				mapsPlayedReadable[winner][modPoolNumber].push(`${dateReadable} - ${scoringType} ${getScoreModpool(team1MapScores[0])} - Won by: ${team1Players.join(', ')} against ${team2Players.join(', ')} (by ${humanReadable(Math.abs(team1Score - team2Score))}) - ${humanReadable(team1Score)} vs ${humanReadable(team2Score)} - ${beatmapString}`);
			} else {
				mapsPlayedReadable[winner][modPoolNumber].push(`${dateReadable} - ${scoringType} ${getScoreModpool(team1MapScores[0])} - Won by: ${team2Players.join(', ')} against ${team1Players.join(', ')} (by ${humanReadable(Math.abs(team1Score - team2Score))}) - ${humanReadable(team1Score)} vs ${humanReadable(team2Score)} - ${beatmapString}`);
			}
		}

		for (let i = 0; i < mapsPlayedReadable.length; i++) {
			for (let j = 0; j < mapsPlayedReadable[i].length; j++) {
				quicksortMapsPlayedReadable(mapsPlayedReadable[i][j]);
			}
		}

		//Sort the rounds for the graph
		quicksortMatchId(rounds);

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
		ctx.fillText(`UserIDs: ${team1.join('|')} vs ${team2.join('|')}`, canvas.width / 140, canvas.height - canvas.height / 70);

		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - canvas.height / 70);

		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.font = 'bold 40px comfortaa, sans-serif';
		fitTextOnMiddleCanvas(ctx, team1Names.join(' | '), 40, 'comfortaa, sans-serif', 55, 1000, 400);
		fitTextOnMiddleCanvas(ctx, 'vs.', 40, 'comfortaa, sans-serif', 100, 1000, 400);
		fitTextOnMiddleCanvas(ctx, team2Names.join(' | '), 40, 'comfortaa, sans-serif', 145, 1000, 400);

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
			ctx.fillStyle = '#3498DB';
		} else if (directNoModWins[0][0] + directNoModWins[1][0] + directHiddenWins[0][0] + directHiddenWins[1][0] + directHardRockWins[0][0] + directHardRockWins[1][0] + directDoubleTimeWins[0][0] + directDoubleTimeWins[1][0] + directFreeModWins[0][0] + directFreeModWins[1][0] < directNoModWins[0][1] + directNoModWins[1][1] + directHiddenWins[0][1] + directHiddenWins[1][1] + directHardRockWins[0][1] + directHardRockWins[1][1] + directDoubleTimeWins[0][1] + directDoubleTimeWins[1][1] + directFreeModWins[0][1] + directFreeModWins[1][1]) {
			ctx.fillStyle = '#CF252D';
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
			ctx.fillStyle = '#3498DB';
		} else if (indirectNoModWins[0][0] + indirectNoModWins[1][0] + indirectHiddenWins[0][0] + indirectHiddenWins[1][0] + indirectHardRockWins[0][0] + indirectHardRockWins[1][0] + indirectDoubleTimeWins[0][0] + indirectDoubleTimeWins[1][0] + indirectFreeModWins[0][0] + indirectFreeModWins[1][0] < indirectNoModWins[0][1] + indirectNoModWins[1][1] + indirectHiddenWins[0][1] + indirectHiddenWins[1][1] + indirectHardRockWins[0][1] + indirectHardRockWins[1][1] + indirectDoubleTimeWins[0][1] + indirectDoubleTimeWins[1][1] + indirectFreeModWins[0][1] + indirectFreeModWins[1][1]) {
			ctx.fillStyle = '#CF252D';
		}
		ctx.fillText(`${indirectNoModWins[0][0] + indirectNoModWins[1][0] + indirectHiddenWins[0][0] + indirectHiddenWins[1][0] + indirectHardRockWins[0][0] + indirectHardRockWins[1][0] + indirectDoubleTimeWins[0][0] + indirectDoubleTimeWins[1][0] + indirectFreeModWins[0][0] + indirectFreeModWins[1][0]} - ${indirectNoModWins[0][1] + indirectNoModWins[1][1] + indirectHiddenWins[0][1] + indirectHiddenWins[1][1] + indirectHardRockWins[0][1] + indirectHardRockWins[1][1] + indirectDoubleTimeWins[0][1] + indirectDoubleTimeWins[1][1] + indirectFreeModWins[0][1] + indirectFreeModWins[1][1]}`, 750, 580);

		//Save old context
		ctx.save();

		//Add a stroke around
		ctx.beginPath();
		ctx.arc(90, 90, 85, 0, Math.PI * 2);
		ctx.strokeStyle = '#3498DB';
		ctx.lineWidth = 5;
		ctx.stroke();

		//Get a circle for inserting the player avatar
		ctx.beginPath();
		ctx.arc(90, 90, 80, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		//Draw a shape onto the main canvas
		try {
			const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${team1[0]}`);
			ctx.drawImage(avatar, 10, 10, 160, 160);
		} catch (error) {
			const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
			ctx.drawImage(avatar, 10, 10, 160, 160);
		}

		//Restore old context
		ctx.restore();

		//Add a stroke around
		ctx.beginPath();
		ctx.arc(910, 90, 85, 0, Math.PI * 2);
		ctx.strokeStyle = '#CF252D';
		ctx.lineWidth = 5;
		ctx.stroke();

		//Get a circle for inserting the player avatar
		ctx.beginPath();
		ctx.arc(910, 90, 80, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		//Draw a shape onto the main canvas
		try {
			const avatar = await Canvas.loadImage(`http://s.ppy.sh/a/${team2[0]}`);
			ctx.drawImage(avatar, 830, 10, 160, 160);
		} catch (error) {
			const avatar = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest@2x.png');
			ctx.drawImage(avatar, 830, 10, 160, 160);
		}

		let files = [];
		//Create as an attachment
		const matchUpStats = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-matchup-${team1.join('-')}-${team2.join('-')}.png` });

		files.push(matchUpStats);

		let tourneyMatchText = '; Casual & Tourney matches';
		if (tourneyMatch) {
			tourneyMatchText = '; Tourney matches only';
		}

		let content = `Matchup analysis for \`${team1Names.join(' | ')}\` vs \`${team2Names.join(' | ')}\` (Teamsize: ${teamsize}; Score ${scoringType}${tourneyMatchText}; ${timeframeText})`;

		if (mapsPlayed.length) {
			content += `\nWinrate chart for \`${team1Names.join(' | ')}\` against \`${team2Names.join(' | ')}\` (Teamsize: ${teamsize}) attached.`;

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

			//Get cumulated scores out of rounds array for each label
			let NMScores = [];
			let HDScores = [];
			let HRScores = [];
			let DTScores = [];
			let FMScores = [];
			let totalScores = [];

			for (let i = 0; i < labels.length; i++) {
				//[Wins, Rounds played, Score against opponent]
				let NMRounds = [0, 0, 0];
				let HDRounds = [0, 0, 0];
				let HRRounds = [0, 0, 0];
				let DTRounds = [0, 0, 0];
				let FMRounds = [0, 0, 0];
				let totalRounds = [0, 0, 0];

				//Loop through all rounds
				for (let j = 0; j < rounds.length; j++) {
					//If totalRounds[1] is bigger than one we already looped throught the first match under this label
					if (totalRounds[1] > 0 || rounds[j].dateReadable === labels[i]) {
						//Increase total amounts
						totalRounds[1]++;
						totalRounds[2] += rounds[j].score;
						if (rounds[j].winner === 0) {
							totalRounds[0]++;
						}

						//Increase amounts for the modPool
						if (rounds[j].mod === 'NM') {
							NMRounds[1]++;
							NMRounds[2] += rounds[j].score;
							if (rounds[j].winner === 0) {
								NMRounds[0]++;
							}
						} else if (rounds[j].mod === 'HD') {
							HDRounds[1]++;
							HDRounds[2] += rounds[j].score;
							if (rounds[j].winner === 0) {
								HDRounds[0]++;
							}
						} else if (rounds[j].mod === 'HR') {
							HRRounds[1]++;
							HRRounds[2] += rounds[j].score;
							if (rounds[j].winner === 0) {
								HRRounds[0]++;
							}
						} else if (rounds[j].mod === 'DT') {
							DTRounds[1]++;
							DTRounds[2] += rounds[j].score;
							if (rounds[j].winner === 0) {
								DTRounds[0]++;
							}
						} else if (rounds[j].mod === 'FM') {
							FMRounds[1]++;
							FMRounds[2] += rounds[j].score;
							if (rounds[j].winner === 0) {
								FMRounds[0]++;
							}
						}
					}
				}

				//Calculate winrates and scores
				let NMWinrate = null;
				let NMScore = null;
				if (NMRounds[1] > 0) {
					NMWinrate = (NMRounds[0] / NMRounds[1]) * 100;
					NMScore = (NMRounds[2] / NMRounds[1]);
				}
				NMWinrates.push(NMWinrate);
				NMScores.push(NMScore);

				let HDWinrate = null;
				let HDScore = null;
				if (HDRounds[1] > 0) {
					HDWinrate = (HDRounds[0] / HDRounds[1]) * 100;
					HDScore = (HDRounds[2] / HDRounds[1]);
				}
				HDWinrates.push(HDWinrate);
				HDScores.push(HDScore);

				let HRWinrate = null;
				let HRScore = null;
				if (HRRounds[1] > 0) {
					HRWinrate = (HRRounds[0] / HRRounds[1]) * 100;
					HRScore = (HRRounds[2] / HRRounds[1]);
				}
				HRWinrates.push(HRWinrate);
				HRScores.push(HRScore);

				let DTWinrate = null;
				let DTScore = null;
				if (DTRounds[1] > 0) {
					DTWinrate = (DTRounds[0] / DTRounds[1]) * 100;
					DTScore = (DTRounds[2] / DTRounds[1]);
				}
				DTWinrates.push(DTWinrate);
				DTScores.push(DTScore);

				let FMWinrate = null;
				let FMScore = null;
				if (FMRounds[1] > 0) {
					FMWinrate = (FMRounds[0] / FMRounds[1]) * 100;
					FMScore = (FMRounds[2] / FMRounds[1]);
				}
				FMWinrates.push(FMWinrate);
				FMScores.push(FMScore);

				let totalWinrate = null;
				let totalScore = null;
				if (totalRounds[1] > 0) {
					totalWinrate = (totalRounds[0] / totalRounds[1]) * 100;
					totalScore = (totalRounds[2] / totalRounds[1]);
				}
				totalWinrates.push(totalWinrate);
				totalScores.push(totalScore);
			}

			if (labels.length === 1) {
				labels.push(labels[0]);
				totalWinrates.push(totalWinrates[0]);
				NMWinrates.push(NMWinrates[0]);
				HDWinrates.push(HDWinrates[0]);
				HRWinrates.push(HRWinrates[0]);
				DTWinrates.push(DTWinrates[0]);
				FMWinrates.push(FMWinrates[0]);
				totalScores.push(totalScores[0]);
				NMScores.push(NMScores[0]);
				HDScores.push(HDScores[0]);
				HRScores.push(HRScores[0]);
				DTScores.push(DTScores[0]);
				FMScores.push(FMScores[0]);
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
								text: `Winrate for ${team1Names.join(' | ')} in %`,
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

			const matchupWinrateChart = new Discord.AttachmentBuilder(imageBuffer, { name: `osu-matchup-${team1.join('-')}-vs-${team2.join('-')}.png` });

			files.push(matchupWinrateChart);

			const scoresData = {
				labels: labels,
				datasets: [
					{
						label: 'Cumulated Scores (All Mods)',
						data: totalScores,
						borderColor: 'rgb(201, 203, 207)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Scores (NM only)',
						data: NMScores,
						borderColor: 'rgb(54, 162, 235)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Scores (HD only)',
						data: HDScores,
						borderColor: 'rgb(255, 205, 86)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Scores (HR only)',
						data: HRScores,
						borderColor: 'rgb(255, 99, 132)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Scores (DT only)',
						data: DTScores,
						borderColor: 'rgb(153, 102, 255)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Cumulated Scores (FM only)',
						data: FMScores,
						borderColor: 'rgb(75, 192, 192)',
						fill: false,
						tension: 0.4
					}
				]
			};

			const scoresConfiguration = {
				type: 'line',
				data: scoresData,
				options: {
					spanGaps: true,
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: 'Cumulated scores for indirect matchups',
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
								text: `Scores for ${team1Names.join(' | ')}`,
								color: '#FFFFFF'
							},
							grid: {
								color: '#8F8F8F'
							},
							ticks: {
								color: '#FFFFFF',
							},
							suggestedMin: 0,
							suggestedMax: 1
						}
					}
				},
			};

			const scoresImageBuffer = await canvasRenderService.renderToBuffer(scoresConfiguration);

			const scoresMatchupWinrateChart = new Discord.AttachmentBuilder(scoresImageBuffer, { name: `osu-matchup-${team1.join('-')}-vs-${team2.join('-')}.png` });

			files.push(scoresMatchupWinrateChart);

			//Convert modpool arrays into strings
			for (let i = 0; i < mapsPlayedReadable.length; i++) {
				for (let j = 0; j < mapsPlayedReadable[i].length; j++) {
					if (mapsPlayedReadable[i][j].length) {
						mapsPlayedReadable[i][j] = mapsPlayedReadable[i][j].join('\n');
					} else {
						mapsPlayedReadable[i].splice(j, 1);
						j--;
					}
				}
			}

			//Convert player arrays into strings
			for (let i = 0; i < mapsPlayedReadable.length; i++) {
				if (mapsPlayedReadable[i].length) {
					mapsPlayedReadable[i] = mapsPlayedReadable[i].join('\n\n');
				} else {
					mapsPlayedReadable[i].push('No maps won');
				}
			}

			//Add the player names in front of both strings
			mapsPlayedReadable[0] = `----------${team1Names.join(' ')}----------\n${mapsPlayedReadable[0]}`;
			mapsPlayedReadable[1] = `----------${team2Names.join(' ')}----------\n${mapsPlayedReadable[1]}`;

			// eslint-disable-next-line no-undef
			mapsPlayedReadable = new Discord.AttachmentBuilder(Buffer.from(mapsPlayedReadable.join('\n\n\n\n'), 'utf-8'), { name: `indirect-matchups-${team1.join('-')}-vs-${team2.join('-')}.txt` });
			files.push(mapsPlayedReadable);
		}

		if (matchesPlayed.length) {
			// eslint-disable-next-line no-undef
			matchesPlayed = new Discord.AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${team1.join('-')}-vs-${team2.join('-')}.txt` });
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
			sentMessage = await interaction.editReply({ content: content, files: files });
		}

		if (!interaction || interaction && interaction.options.getSubcommand() !== 'teamvs') {
			sentMessage.react('🔵');
			sentMessage.react('🔴');
		}
		return;
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].gameId) >= parseFloat(pivot.gameId)) {
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

function partitionMatchId(list, start, end) {
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

function quicksortMatchId(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionMatchId(list, start, end);
		quicksortMatchId(list, start, p - 1);
		quicksortMatchId(list, p + 1, end);
	}
	return list;
}

function partitionScore(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseInt(list[j].score) >= parseInt(pivot.score)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortScore(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionScore(list, start, end);
		quicksortScore(list, start, p - 1);
		quicksortScore(list, p + 1, end);
	}
	return list;
}

function partitionMapsPlayedReadable(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseInt(`${list[j].substring(3, 7)}${list[j].substring(0, 2)}`) >= parseInt(`${pivot.substring(3, 7)}${pivot.substring(0, 2)}`)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksortMapsPlayedReadable(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionMapsPlayedReadable(list, start, end);
		quicksortMapsPlayedReadable(list, start, p - 1);
		quicksortMapsPlayedReadable(list, p + 1, end);
	}
	return list;
}

function getColor(array) {
	let color = '#ffffff';
	if (array[0][0] + array[1][0] > array[0][1] + array[1][1]) {
		color = '#3498DB';
	} else if (array[0][0] + array[1][0] < array[0][1] + array[1][1]) {
		color = '#CF252D';
	}

	return color;
}