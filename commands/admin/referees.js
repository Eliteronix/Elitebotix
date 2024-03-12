const { DBDiscordUsers, DBOsuMultiMatches, DBOsuMultiGameScores } = require('../../dbObjects');
const { logDatabaseQueries, logOsuAPICalls, getOsuPlayerName, humanReadable } = require('../../utils');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');

module.exports = {
	name: 'referees',
	usage: '<username>',
	async execute(interaction) {
		let username = interaction.options.getString('argument');

		//Get the user from the database if possible
		logDatabaseQueries(4, 'commands/admin/referees.js DBDiscordUsers 1');
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				[Op.or]: {
					osuUserId: username,
					osuName: username,
					userId: username.replace('<@', '').replace('>', '').replace('!', ''),
				}
			}
		});

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
				logOsuAPICalls('commands/admin/referees.js');
				const user = await osuApi.getUser({ u: username });
				osuUser.osuUserId = user.id;
				osuUser.osuName = user.name;
			} catch (error) {
				console.error(error);
				await interaction.followUp({ content: `Could not find user \`${username.replace(/`/g, '')}\`.`, ephemeral: true });
			}
		}

		logDatabaseQueries(4, 'commands/admin/referees.js DBOsuMultiGameScores');
		const playedMatches = await DBOsuMultiGameScores.findAll({
			attributes: ['matchId'],
			where: {
				tourneyMatch: true,
				osuUserId: osuUser.osuUserId,
			},
			group: ['matchId'],
		});

		if (!playedMatches.length) {
			return await interaction.editReply(`No matches found for \`${osuUser.osuName}\`.`);
		}

		logDatabaseQueries(4, 'commands/admin/referees.js DBOsuMultiMatches');
		let referees = await DBOsuMultiMatches.findAll({
			attributes: ['referee', [Sequelize.fn('COUNT', Sequelize.col('referee')), 'amount']],
			where: {
				tourneyMatch: true,
				matchId: {
					[Op.in]: playedMatches.map(match => match.matchId),
				},
				referee: {
					[Op.not]: null,
				},
			},
			group: ['referee'],
			order: [[Sequelize.fn('COUNT', Sequelize.col('referee')), 'DESC']],
		});

		let additionalInfo = '';

		logDatabaseQueries(4, 'commands/admin/referees.js DBOsuMultiMatches count matches with missing referee info');
		const refereesToBeDetermined = await DBOsuMultiMatches.count({
			where: {
				tourneyMatch: true,
				referee: null,
				matchId: {
					[Op.in]: playedMatches.map(match => match.matchId),
				},
			},
		});

		if (refereesToBeDetermined > 0) {
			logDatabaseQueries(4, 'commands/admin/referees.js DBOsuMultiMatches oldest match with missing referee info');
			const oldestMissingMatch = await DBOsuMultiMatches.findOne({
				attributes: [
					'matchStartDate',
				],
				where: {
					tourneyMatch: true,
					referee: null,
					matchId: {
						[Op.in]: playedMatches.map(match => match.matchId),
					},
				},
				order: [
					['matchId', 'ASC'],
				],
			});

			logDatabaseQueries(4, 'commands/admin/referees.js DBOsuMultiMatches youngest match with missing referee info');
			const youngestMissingMatch = await DBOsuMultiMatches.findOne({
				attributes: [
					'matchStartDate',
				],
				where: {
					tourneyMatch: true,
					referee: null,
					matchId: {
						[Op.in]: playedMatches.map(match => match.matchId),
					},
				},
				order: [
					['matchId', 'DESC'],
				],
			});

			additionalInfo = `There are ${humanReadable(refereesToBeDetermined)} matches from <t:${Date.parse(oldestMissingMatch.matchStartDate) / 1000}:f> till <t:${Date.parse(youngestMissingMatch.matchStartDate) / 1000}:f> that are still missing referee info.\n`;
		}

		let unavailableReferee = referees.find(referee => referee.referee === -1);

		if (unavailableReferee) {
			additionalInfo += `There are ${humanReadable(unavailableReferee.dataValues.amount)} matches that don't have their referee info archived.\n`;

			referees = referees.filter(referee => referee.referee !== -1);
		}

		let leaderboardString = `# Referee leaderboard\n${additionalInfo}\`\`\``;

		for (let i = 0; i < referees.length && i < 100; i++) {
			const refereeUsername = await getOsuPlayerName(referees[i].referee);

			let newString = `\n#${i + 1}. ${refereeUsername} (${referees[i].referee}) - ${referees[i].dataValues.amount} matches`;

			if (leaderboardString.length + newString.length + '```'.length > 2000) {
				await interaction.followUp(leaderboardString + '```');
				leaderboardString = '```';
			}

			leaderboardString += newString;
		}

		await interaction.followUp(leaderboardString + '```');
	},
};