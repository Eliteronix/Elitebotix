const Discord = require('discord.js');
const osu = require('node-osu');
const { DBDiscordUsers, DBOsuBeatmaps, DBOsuMultiGames, DBOsuMultiGameScores, DBOsuMultiMatches } = require('../dbObjects');
const { getIDFromPotentialOsuLink, logDatabaseQueries, fitTextOnMiddleCanvas, getScoreModpool, humanReadable, getOsuBeatmap, getAvatar, logOsuAPICalls } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const Canvas = require('canvas');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { Op } = require('sequelize');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');
const { Sequelize } = require('sequelize');

module.exports = {
	name: 'osu-matchup',
	description: 'Sends an info card about the matchups between the specified players',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-matchup')
		.setNameLocalizations({
			'de': 'osu-matchup',
			'en-GB': 'osu-matchup',
			'en-US': 'osu-matchup',
		})
		.setDescription('Sends an info card about the matchups between the specified players')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über die Begegnungen zwischen den angegebenen Spielern',
			'en-GB': 'Sends an info card about the matchups between the specified players',
			'en-US': 'Sends an info card about the matchups between the specified players',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('1v1')
				.setNameLocalizations({
					'de': '1v1',
					'en-GB': '1v1',
					'en-US': '1v1',
				})
				.setDescription('Get an info card about the matchups between the specified players')
				.setDescriptionLocalizations({
					'de': 'Sendet eine Info-Karte über die Begegnungen zwischen den angegebenen Spielern',
					'en-GB': 'Sends an info card about the matchups between the specified players',
					'en-US': 'Sends an info card about the matchups between the specified players',
				})
				.addStringOption(option =>
					option
						.setName('username')
						.setNameLocalizations({
							'de': 'nutzername',
							'en-GB': 'username',
							'en-US': 'username',
						})
						.setDescription('The name of a player to compare with')
						.setDescriptionLocalizations({
							'de': 'Der Name eines Spielers, mit dem verglichen werden soll',
							'en-GB': 'The name of a player to compare with',
							'en-US': 'The name of a player to compare with',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('username2')
						.setNameLocalizations({
							'de': 'nutzername2',
							'en-GB': 'username2',
							'en-US': 'username2',
						})
						.setDescription('The name of a player to compare with')
						.setDescriptionLocalizations({
							'de': 'Der Name eines Spielers, mit dem verglichen werden soll',
							'en-GB': 'The name of a player to compare with',
							'en-US': 'The name of a player to compare with',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('timeframe')
						.setNameLocalizations({
							'de': 'zeitraum',
							'en-GB': 'timeframe',
							'en-US': 'timeframe',
						})
						.setDescription('Since when should the scores be taken into account')
						.setDescriptionLocalizations({
							'de': 'Ab wann sollen die Ergebnisse berücksichtigt werden',
							'en-GB': 'Since when should the scores be taken into account',
							'en-US': 'Since when should the scores be taken into account',
						})
						.setRequired(false)
						.addChoices(
							{ name: '1 month', value: '1m' },
							{ name: '3 months', value: '3m' },
							{ name: '6 months', value: '6m' },
							{ name: '1 year', value: '1y' },
							{ name: '2 years', value: '2y' },
							{ name: 'All time', value: 'all' },
						)
				)
				.addStringOption(option =>
					option
						.setName('scores')
						.setNameLocalizations({
							'de': 'scores',
							'en-GB': 'scores',
							'en-US': 'scores',
						})
						.setDescription('Which types of scores should the matchup evaluate?')
						.setDescriptionLocalizations({
							'de': 'Welche Arten von scores soll die Begegnung auswerten?',
							'en-GB': 'Which types of scores should the matchup evaluate?',
							'en-US': 'Which types of scores should the matchup evaluate?',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'Only Score v2', value: 'v2' },
							{ name: 'Only Score v1', value: 'v1' },
							{ name: 'All Scores', value: 'vx' },
						)
				)
				.addBooleanOption(option =>
					option
						.setName('tourney')
						.setNameLocalizations({
							'de': 'turnier',
							'en-GB': 'tourney',
							'en-US': 'tourney',
						})
						.setDescription('Should it only count scores from tournaments?')
						.setDescriptionLocalizations({
							'de': 'Soll es nur Ergebnisse aus Turnieren zählen?',
							'en-GB': 'Should it only count scores from tournaments?',
							'en-US': 'Should it only count scores from tournaments?',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('teamvs')
				.setNameLocalizations({
					'de': 'teamvs',
					'en-GB': 'teamvs',
					'en-US': 'teamvs',
				})
				.setDescription('Get an info card about the matchups between the specified teams')
				.setDescriptionLocalizations({
					'de': 'Erhalte eine Info-Karte über die Begegnungen zwischen den angegebenen Teams',
					'en-GB': 'Get an info card about the matchups between the specified teams',
					'en-US': 'Get an info card about the matchups between the specified teams',
				})
				.addIntegerOption(option =>
					option
						.setName('teamsize')
						.setNameLocalizations({
							'de': 'teamgröße',
							'en-GB': 'teamsize',
							'en-US': 'teamsize',
						})
						.setDescription('The amount of players that are playing against each other on the maps')
						.setDescriptionLocalizations({
							'de': 'Die Anzahl der Spieler, die gegeneinander auf den Karten spielen',
							'en-GB': 'The amount of players that are playing against each other on the maps',
							'en-US': 'The amount of players that are playing against each other on the maps',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('team1player1')
						.setNameLocalizations({
							'de': 'team1spieler1',
							'en-GB': 'team1player1',
							'en-US': 'team1player1',
						})
						.setDescription('The first user of the first team')
						.setDescriptionLocalizations({
							'de': 'Der erste Spieler des ersten Teams',
							'en-GB': 'The first user of the first team',
							'en-US': 'The first user of the first team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team1player2')
						.setNameLocalizations({
							'de': 'team1spieler2',
							'en-GB': 'team1player2',
							'en-US': 'team1player2',
						})
						.setDescription('The second user of the first team')
						.setDescriptionLocalizations({
							'de': 'Der zweite Spieler des ersten Teams',
							'en-GB': 'The second user of the first team',
							'en-US': 'The second user of the first team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team1player3')
						.setNameLocalizations({
							'de': 'team1spieler3',
							'en-GB': 'team1player3',
							'en-US': 'team1player3',
						})
						.setDescription('The third user of the first team')
						.setDescriptionLocalizations({
							'de': 'Der dritte Spieler des ersten Teams',
							'en-GB': 'The third user of the first team',
							'en-US': 'The third user of the first team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team1player4')
						.setNameLocalizations({
							'de': 'team1spieler4',
							'en-GB': 'team1player4',
							'en-US': 'team1player4',
						})
						.setDescription('The fourth user of the first team')
						.setDescriptionLocalizations({
							'de': 'Der vierte Spieler des ersten Teams',
							'en-GB': 'The fourth user of the first team',
							'en-US': 'The fourth user of the first team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team1player5')
						.setNameLocalizations({
							'de': 'team1spieler5',
							'en-GB': 'team1player5',
							'en-US': 'team1player5',
						})
						.setDescription('The fifth user of the first team')
						.setDescriptionLocalizations({
							'de': 'Der fünfte Spieler des ersten Teams',
							'en-GB': 'The fifth user of the first team',
							'en-US': 'The fifth user of the first team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team1player6')
						.setNameLocalizations({
							'de': 'team1spieler6',
							'en-GB': 'team1player6',
							'en-US': 'team1player6',
						})
						.setDescription('The sixth user of the first team')
						.setDescriptionLocalizations({
							'de': 'Der sechste Spieler des ersten Teams',
							'en-GB': 'The sixth user of the first team',
							'en-US': 'The sixth user of the first team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team1player7')
						.setNameLocalizations({
							'de': 'team1spieler7',
							'en-GB': 'team1player7',
							'en-US': 'team1player7',
						})
						.setDescription('The seventh user of the first team')
						.setDescriptionLocalizations({
							'de': 'Der siebte Spieler des ersten Teams',
							'en-GB': 'The seventh user of the first team',
							'en-US': 'The seventh user of the first team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team1player8')
						.setNameLocalizations({
							'de': 'team1spieler8',
							'en-GB': 'team1player8',
							'en-US': 'team1player8',
						})
						.setDescription('The eighth user of the first team')
						.setDescriptionLocalizations({
							'de': 'Der achte Spieler des ersten Teams',
							'en-GB': 'The eighth user of the first team',
							'en-US': 'The eighth user of the first team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team2player1')
						.setNameLocalizations({
							'de': 'team2spieler1',
							'en-GB': 'team2player1',
							'en-US': 'team2player1',
						})
						.setDescription('The first user of the second team')
						.setDescriptionLocalizations({
							'de': 'Der erste Spieler des zweiten Teams',
							'en-GB': 'The first user of the second team',
							'en-US': 'The first user of the second team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team2player2')
						.setNameLocalizations({
							'de': 'team2spieler2',
							'en-GB': 'team2player2',
							'en-US': 'team2player2',
						})
						.setDescription('The second user of the second team')
						.setDescriptionLocalizations({
							'de': 'Der zweite Spieler des zweiten Teams',
							'en-GB': 'The second user of the second team',
							'en-US': 'The second user of the second team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team2player3')
						.setNameLocalizations({
							'de': 'team2spieler3',
							'en-GB': 'team2player3',
							'en-US': 'team2player3',
						})
						.setDescription('The third user of the second team')
						.setDescriptionLocalizations({
							'de': 'Der dritte Spieler des zweiten Teams',
							'en-GB': 'The third user of the second team',
							'en-US': 'The third user of the second team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team2player4')
						.setNameLocalizations({
							'de': 'team2spieler4',
							'en-GB': 'team2player4',
							'en-US': 'team2player4',
						})
						.setDescription('The fourth user of the second team')
						.setDescriptionLocalizations({
							'de': 'Der vierte Spieler des zweiten Teams',
							'en-GB': 'The fourth user of the second team',
							'en-US': 'The fourth user of the second team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team2player5')
						.setNameLocalizations({
							'de': 'team2spieler5',
							'en-GB': 'team2player5',
							'en-US': 'team2player5',
						})
						.setDescription('The fifth user of the second team')
						.setDescriptionLocalizations({
							'de': 'Der fünfte Spieler des zweiten Teams',
							'en-GB': 'The fifth user of the second team',
							'en-US': 'The fifth user of the second team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team2player6')
						.setNameLocalizations({
							'de': 'team2spieler6',
							'en-GB': 'team2player6',
							'en-US': 'team2player6',
						})
						.setDescription('The sixth user of the second team')
						.setDescriptionLocalizations({
							'de': 'Der sechste Spieler des zweiten Teams',
							'en-GB': 'The sixth user of the second team',
							'en-US': 'The sixth user of the second team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team2player7')
						.setNameLocalizations({
							'de': 'team2spieler7',
							'en-GB': 'team2player7',
							'en-US': 'team2player7',
						})
						.setDescription('The seventh user of the second team')
						.setDescriptionLocalizations({
							'de': 'Der siebte Spieler des zweiten Teams',
							'en-GB': 'The seventh user of the second team',
							'en-US': 'The seventh user of the second team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('team2player8')
						.setNameLocalizations({
							'de': 'team2spieler8',
							'en-GB': 'team2player8',
							'en-US': 'team2player8',
						})
						.setDescription('The eighth user of the second team')
						.setDescriptionLocalizations({
							'de': 'Der achte Spieler des zweiten Teams',
							'en-GB': 'The eighth user of the second team',
							'en-US': 'The eighth user of the second team',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('timeframe')
						.setNameLocalizations({
							'de': 'zeitraum',
							'en-GB': 'timeframe',
							'en-US': 'timeframe',
						})
						.setDescription('Since when should the scores be taken into account')
						.setDescriptionLocalizations({
							'de': 'Ab wann sollen die Scores berücksichtigt werden',
							'en-GB': 'Since when should the scores be taken into account',
							'en-US': 'Since when should the scores be taken into account',
						})
						.setRequired(false)
						.addChoices(
							{ name: '1 month', value: '1m' },
							{ name: '3 months', value: '3m' },
							{ name: '6 months', value: '6m' },
							{ name: '1 year', value: '1y' },
							{ name: '2 years', value: '2y' },
							{ name: 'All time', value: 'all' },
						)
				)
				.addStringOption(option =>
					option
						.setName('scores')
						.setNameLocalizations({
							'de': 'scores',
							'en-GB': 'scores',
							'en-US': 'scores',
						})
						.setDescription('Which types of scores should the matchup evaluate?')
						.setDescriptionLocalizations({
							'de': 'Welche Arten von scores soll die Begegnung auswerten?',
							'en-GB': 'Which types of scores should the matchup evaluate?',
							'en-US': 'Which types of scores should the matchup evaluate?',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'Only Score v2', value: 'v2' },
							{ name: 'Only Score v1', value: 'v1' },
							{ name: 'All Scores', value: 'vx' },
						)
				)
				.addBooleanOption(option =>
					option
						.setName('tourney')
						.setNameLocalizations({
							'de': 'turnier',
							'en-GB': 'tourney',
							'en-US': 'tourney',
						})
						.setDescription('Should it only count scores from tournaments?')
						.setDescriptionLocalizations({
							'de': 'Soll es nur Ergebnisse aus Turnieren zählen?',
							'en-GB': 'Should it only count scores from tournaments?',
							'en-US': 'Should it only count scores from tournaments?',
						})
						.setRequired(false)
				)
		),
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

		let teamsize = 1;

		if (interaction.options.getInteger('teamsize')) {
			teamsize = interaction.options.getInteger('teamsize');
		}

		let tourneyMatch = true;

		if (interaction.options.getBoolean('tourney') === false) {
			tourneyMatch = false;
		}

		let timeframe = new Date();
		timeframe = timeframe.setFullYear(timeframe.getFullYear() - 1);
		let timeframeText = 'last 1 year';

		if (interaction.options.getString('timeframe')) {
			let customTimeframe = interaction.options.getString('timeframe');

			if (customTimeframe === '1m') {
				timeframe = new Date();
				timeframe.setMonth(timeframe.getMonth() - 1);
				timeframeText = 'last 1 month';
			} else if (customTimeframe === '3m') {
				timeframe = new Date();
				timeframe.setMonth(timeframe.getMonth() - 3);
				timeframeText = 'last 3 months';
			} else if (customTimeframe === '6m') {
				timeframe = new Date();
				timeframe.setMonth(timeframe.getMonth() - 6);
				timeframeText = 'last 6 months';
			} else if (customTimeframe === '1y') {
				timeframe = new Date();
				timeframe.setFullYear(timeframe.getFullYear() - 1);
				timeframeText = 'last 1 year';
			} else if (customTimeframe === '2y') {
				timeframe = new Date();
				timeframe.setFullYear(timeframe.getFullYear() - 2);
				timeframeText = 'last 2 years';
			} else if (customTimeframe === 'all') {
				timeframe = new Date(0);
				timeframeText = 'all time';
			}
		}

		let scoringType = 'v2';

		if (interaction.options.getString('scores')) {
			scoringType = interaction.options.getString('scores');
		}

		let team1 = [];

		if (interaction.options.getString('username')) {
			team1.push(interaction.options.getString('username'));
		}

		if (interaction.options.getString('team1player1')) {
			team1.push(interaction.options.getString('team1player1'));
		}

		if (interaction.options.getString('team1player2')) {
			team1.push(interaction.options.getString('team1player2'));
		}

		if (interaction.options.getString('team1player3')) {
			team1.push(interaction.options.getString('team1player3'));
		}

		if (interaction.options.getString('team1player4')) {
			team1.push(interaction.options.getString('team1player4'));
		}

		if (interaction.options.getString('team1player5')) {
			team1.push(interaction.options.getString('team1player5'));
		}

		if (interaction.options.getString('team1player6')) {
			team1.push(interaction.options.getString('team1player6'));
		}

		if (interaction.options.getString('team1player7')) {
			team1.push(interaction.options.getString('team1player7'));
		}

		if (interaction.options.getString('team1player8')) {
			team1.push(interaction.options.getString('team1player8'));
		}

		let team2 = [];

		if (interaction.options.getString('username2')) {
			team2.push(interaction.options.getString('username2'));
		}

		if (interaction.options.getString('team2player1')) {
			team2.push(interaction.options.getString('team2player1'));
		}

		if (interaction.options.getString('team2player2')) {
			team2.push(interaction.options.getString('team2player2'));
		}

		if (interaction.options.getString('team2player3')) {
			team2.push(interaction.options.getString('team2player3'));
		}

		if (interaction.options.getString('team2player4')) {
			team2.push(interaction.options.getString('team2player4'));
		}

		if (interaction.options.getString('team2player5')) {
			team2.push(interaction.options.getString('team2player5'));
		}

		if (interaction.options.getString('team2player6')) {
			team2.push(interaction.options.getString('team2player6'));
		}

		if (interaction.options.getString('team2player7')) {
			team2.push(interaction.options.getString('team2player7'));
		}

		if (interaction.options.getString('team2player8')) {
			team2.push(interaction.options.getString('team2player8'));
		}

		//If no players got specified the author wants to see his own matchup
		if (!team2.length) {
			team2.push(team1[0]);

			team1 = [];

			logDatabaseQueries(4, 'commands/osu-matchup.js DBDiscordUsers0');
			const user = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
				where: {
					userId: interaction.user.id,
				}
			});

			if (user && user.osuUserId) {
				team1.push(user.osuUserId);
			} else {
				let username = interaction.user.username;

				if (interaction.guild) {
					let member = interaction.guild.members.cache.get(interaction.user.id);

					if (member) {
						username = member.displayName;
					}
				}

				team1.push(username);
			}
		}

		if (team1.length < teamsize) {
			return await interaction.followUp('You did not specify enough players for team 1.');
		} else if (team2.length < teamsize) {
			return await interaction.editReply('You did not specify enough players for team 2.');
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
						attributes: ['osuUserId'],
						where: {
							userId: team1[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						team1[i] = discordUser.osuUserId;
					} else {
						await interaction.followUp(`\`${team1[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						team1.splice(i, 1);
						i--;
						continue;
					}
				} else {
					team1[i] = getIDFromPotentialOsuLink(team1[i]);
				}

				logOsuAPICalls('commands/osu-matchup.js team1');
				await osuApi.getUser({ u: team1[i] })
					.then(user => {
						team1[i] = user.id;
						team1Names.push(user.name);
					})
					.catch(async (err) => {
						if (err.message === 'Not found') {
							await interaction.followUp(`Could not find user \`${team1[i].replace(/`/g, '')}\`.`);
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
						attributes: ['osuUserId'],
						where: {
							userId: team2[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						team2[i] = discordUser.osuUserId;
					} else {
						await interaction.followUp(`\`${team2[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						team2.splice(i, 1);
						i--;
						continue;
					}
				} else {
					team2[i] = getIDFromPotentialOsuLink(team2[i]);
				}

				logOsuAPICalls('commands/osu-matchup.js team2');
				await osuApi.getUser({ u: team2[i] })
					.then(user => {
						team2[i] = user.id;
						team2Names.push(user.name);
					})
					.catch(async (err) => {
						if (err.message === 'Not found') {
							await interaction.followUp(`Could not find user \`${team2[i].replace(/`/g, '')}\`.`);
							team2.splice(i, 1);
							i--;
						} else {
							console.error(err);
						}
					});
			}
		}

		if (team1.length < teamsize || team2.length < teamsize) {
			return await interaction.followUp('Not enough users left for the matchup.');
		}

		await interaction.editReply(`[\`${team1Names.join(' ')}\` vs \`${team2Names.join(' ')}\`] Processing...`);

		//Add all multiscores from both teams to an array
		let scoresTeam1 = [];
		let scoresTeam2 = [];

		let beatmaps = [];

		// Find the lowest gameId in the timeframe
		logDatabaseQueries(4, 'commands/osu-matchup.js DBOsuMultiGames');
		const lowestGameId = await DBOsuMultiGames.findOne({
			attributes: [
				[Sequelize.fn('MIN', Sequelize.col('gameId')), 'gameId']
			],
			where: {
				gameEndDate: {
					[Op.gte]: timeframe
				}
			}
		});

		//Loop throught team one and get all their multi scores
		for (let i = 0; i < team1.length; i++) {
			logDatabaseQueries(4, `commands/osu-matchup.js DBOsuMultiGameScores 1User${i + 1}`);
			let userScores = await DBOsuMultiGameScores.findAll({
				attributes: [
					'beatmapId',
					'score',
					'scoringType',
					'tourneyMatch',
					'gameRawMods',
					'rawMods',
					'freeMod',
					'osuUserId',
					'gameId',
					'matchId',
				],
				where: {
					osuUserId: team1[i],
					mode: 0,
					score: {
						[Op.gte]: 10000
					},
					warmup: {
						[Op.not]: true
					},
					gameId: {
						[Op.gte]: lowestGameId.gameId
					}
				},
				order: [['gameId', 'DESC']],
			});

			let matchIds = [...new Set(userScores.map(s => s.matchId))];

			//Get the match data for the scores
			logDatabaseQueries(4, `commands/osu-matchup.js DBOsuMultiMatches 1User${i + 1}`);
			let matches = await DBOsuMultiMatches.findAll({
				attributes: [
					'matchId',
					'matchName',
					'matchStartDate',
				],
				where: {
					matchId: {
						[Op.in]: matchIds
					}
				}
			});

			//Add the match data to the scores
			for (let j = 0; j < userScores.length; j++) {
				let match = matches.find(m => m.matchId === userScores[j].matchId);

				if (match) {
					userScores[j].matchName = match.matchName;
					userScores[j].matchStartDate = match.matchStartDate;
				}
			}

			scoresTeam1.push(userScores);

			//Remove userScores which don't fit the criteria
			for (let j = 0; j < scoresTeam1[i].length; j++) {
				if (scoringType === 'v2' && scoresTeam1[i][j].scoringType !== 3
					|| scoringType === 'v1' && scoresTeam1[i][j].scoringType !== 0
					|| tourneyMatch && !scoresTeam1[i][j].tourneyMatch) {
					scoresTeam1[i].splice(j, 1);
					j--;
				}
			}

			//Set the modPool for the scores
			for (let j = 0; j < scoresTeam1[i].length; j++) {
				let modPool = getScoreModpool(scoresTeam1[i][j]);

				let scoreVersion = 'V1';
				if (scoresTeam1[i][j].scoringType === 3) {
					scoreVersion = 'V2';
				}

				//Add the beatmap to the beatmap array
				let beatmap = beatmaps.find(b => b.beatmapId === scoresTeam1[i][j].beatmapId && b.modPool === modPool && b.scoreVersion === scoreVersion);

				if (!beatmap) {
					beatmap = {
						beatmapId: scoresTeam1[i][j].beatmapId,
						modPool: modPool,
						scoreVersion: scoreVersion,
						team1Players: [scoresTeam1[i][j].osuUserId],
						team2Players: [],
						team1Scores: [scoresTeam1[i][j]],
						team2Scores: []
					};
					beatmaps.push(beatmap);
				} else {
					if (!beatmap.team1Players.includes(scoresTeam1[i][j].osuUserId)) {
						beatmap.team1Scores.push(scoresTeam1[i][j]);
						beatmap.team1Players.push(scoresTeam1[i][j].osuUserId);
					}
				}
			}
		}

		beatmaps = beatmaps.filter(b => b.team1Players.length >= teamsize);

		//Loop throught team two and get all their multi scores
		for (let i = 0; i < team2.length; i++) {
			logDatabaseQueries(4, `commands/osu-matchup.js DBOsuMultiGameScores 2User${i + 1}`);
			let userScores = await DBOsuMultiGameScores.findAll({
				attributes: [
					'beatmapId',
					'score',
					'scoringType',
					'tourneyMatch',
					'gameRawMods',
					'rawMods',
					'freeMod',
					'osuUserId',
					'gameId',
					'matchId',
				],
				where: {
					osuUserId: team2[i],
					mode: 0,
					score: {
						[Op.gte]: 10000
					},
					warmup: {
						[Op.not]: true
					},
					gameId: {
						[Op.gte]: lowestGameId.gameId
					},
					beatmapId: {
						[Op.in]: beatmaps.map(b => b.beatmapId)
					}
				},
				order: [['gameId', 'DESC']],
			});

			let matchIds = [...new Set(userScores.map(s => s.matchId))];

			//Get the match data for the scores
			logDatabaseQueries(4, `commands/osu-matchup.js DBOsuMultiMatches 1User${i + 1}`);
			let matches = await DBOsuMultiMatches.findAll({
				attributes: [
					'matchId',
					'matchName',
					'matchStartDate',
				],
				where: {
					matchId: {
						[Op.in]: matchIds
					}
				}
			});

			//Add the match data to the scores
			for (let j = 0; j < userScores.length; j++) {
				let match = matches.find(m => m.matchId === userScores[j].matchId);

				if (match) {
					userScores[j].matchName = match.matchName;
					userScores[j].matchStartDate = match.matchStartDate;
				}
			}

			scoresTeam2.push(userScores);

			//Remove userScores which don't fit the criteria
			for (let j = 0; j < scoresTeam2[i].length; j++) {
				if (scoringType === 'v2' && scoresTeam2[i][j].scoringType !== 3
					|| scoringType === 'v1' && scoresTeam2[i][j].scoringType !== 0
					|| tourneyMatch && !scoresTeam2[i][j].tourneyMatch) {
					scoresTeam2[i].splice(j, 1);
					j--;
				}
			}

			//Set the modPool for the scores
			for (let j = 0; j < scoresTeam2[i].length; j++) {
				let modPool = getScoreModpool(scoresTeam2[i][j]);

				let scoreVersion = 'V1';
				if (scoresTeam2[i][j].scoringType === 3) {
					scoreVersion = 'V2';
				}

				//Add the beatmap to the beatmap array
				let beatmap = beatmaps.find(b => b.beatmapId === scoresTeam2[i][j].beatmapId && b.modPool === modPool && b.scoreVersion === scoreVersion);

				if (beatmap) {
					if (!beatmap.team2Players.includes(scoresTeam2[i][j].osuUserId)) {
						beatmap.team2Scores.push(scoresTeam2[i][j]);
						beatmap.team2Players.push(scoresTeam2[i][j].osuUserId);
					}
				}
			}
		}

		beatmaps = beatmaps.filter(b => b.team2Players.length >= teamsize);

		// Fetch all beatmaps from the database
		logDatabaseQueries(4, 'commands/osu-matchup.js DBOsuBeatmaps');
		let dbBeatmaps = await DBOsuBeatmaps.findAll({
			attributes: [
				'id',
				'beatmapId',
				'beatmapsetId',
				'approvalStatus',
				'mods',
				'updatedAt',
				'starRating',
				'maxCombo',
				'mode',
				'artist',
				'title',
				'difficulty',
			],
			where: {
				beatmapId: {
					[Op.in]: beatmaps.map(b => b.beatmapId)
				},
				mods: 0
			}
		});

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
		let team1Scores = beatmaps.flatMap(b => b.team1Scores);
		let team2Scores = beatmaps.flatMap(b => b.team2Scores);

		//Get a list of all games played by both teams
		let gamesPlayed = [...new Set(team1Scores.map(s => s.gameId).concat(team2Scores.map(s => s.gameId)))];

		//Loop through all games played and check if on both team sides at least teamsize players played the game aswell
		//Loop through all games, get the score for each player and add the teamsize best scores together and compare
		let matchesPlayed = [];

		let hideQualifiers = new Date();
		hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);
		for (let i = 0; i < gamesPlayed.length; i++) {
			let team1GameScores = team1Scores.filter(s => s.gameId === gamesPlayed[i]);

			if (team1GameScores.length < teamsize) {
				gamesPlayed.splice(i, 1);
				i--;
				continue;
			}

			let team2GameScores = team2Scores.filter(s => s.gameId === gamesPlayed[i]);

			if (team2GameScores.length < teamsize) {
				gamesPlayed.splice(i, 1);
				i--;
				continue;
			}

			//Sort the scores for each team
			team1GameScores.sort((a, b) => parseInt(b.score) - parseInt(a.score));
			team2GameScores.sort((a, b) => parseInt(b.score) - parseInt(a.score));

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
			if (team1GameScores[0].scoringType === 3) {
				scoreVersion = 1;
			}

			//Evaluate with which mods the game was played
			let modPool = getScoreModpool(team1GameScores[0]);

			if (modPool === 'NM') {
				directNoModWins[scoreVersion][winner]++;
			} else if (modPool === 'HD') {
				directHiddenWins[scoreVersion][winner]++;
			} else if (modPool === 'HR') {
				directHardRockWins[scoreVersion][winner]++;
			} else if (modPool === 'DT') {
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
		//The beatmaps array contains all maps played by both teams with enough players
		//Loop through all maps, get the most recent score for each player and add the teamsize best scores together and compare
		//For the graph
		let rounds = [];

		//For the maps played txt
		//[won by team1 array[NM[], HD[], HR[], DT[], FM[]], won by team2 array[NM[], HD[], HR[], DT[], FM[]]]]
		//divided by player who won -> divided by modpool
		let mapsPlayedReadable = [[[], [], [], [], []], [[], [], [], [], []]];
		for (let i = 0; i < beatmaps.length; i++) {
			//For the round array
			//Get the earliest date of the map
			let matchId = Infinity;
			let date = null;
			let dateReadable = null;

			//Sort the scores for each team
			beatmaps[i].team1Scores.sort((a, b) => parseInt(b.score) - parseInt(a.score));
			beatmaps[i].team2Scores.sort((a, b) => parseInt(b.score) - parseInt(a.score));

			//Add the best scores together
			let team1Score = 0;
			let team2Score = 0;

			let team1Players = [];
			let team2Players = [];

			for (let j = 0; j < teamsize; j++) {
				team1Score += parseInt(beatmaps[i].team1Scores[j].score);
				team2Score += parseInt(beatmaps[i].team2Scores[j].score);

				team1Players.push(team1Names[team1.indexOf(beatmaps[i].team1Scores[j].osuUserId)]);
				team2Players.push(team2Names[team2.indexOf(beatmaps[i].team2Scores[j].osuUserId)]);

				if (beatmaps[i].team1Scores[j].matchId < matchId) {
					matchId = beatmaps[i].team1Scores[j].matchId;
					date = new Date(beatmaps[i].team1Scores[j].matchStartDate);
					dateReadable = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}`;
				}

				if (beatmaps[i].team2Scores[j].matchId < matchId) {
					matchId = beatmaps[i].team2Scores[j].matchId;
					date = new Date(beatmaps[i].team2Scores[j].matchStartDate);
					dateReadable = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()}`;
				}
			}

			//Compare the scores | Winner is by default team 1 | If team 2 is better, change winner
			let winner = 0;
			if (team1Score < team2Score) {
				winner = 1;
			}

			//Evaluate if it was played with Score v2 or not (0 = v1, 1 = v2)
			let scoreVersion = 0;
			if (beatmaps[i].scoreVersion === 'V2') {
				scoreVersion = 1;
			}

			//Evaluate with which mods the game was played
			if (beatmaps[i].modPool === 'NM') {
				indirectNoModWins[scoreVersion][winner]++;
			} else if (beatmaps[i].modPool === 'HD') {
				indirectHiddenWins[scoreVersion][winner]++;
			} else if (beatmaps[i].modPool === 'HR') {
				indirectHardRockWins[scoreVersion][winner]++;
			} else if (beatmaps[i].modPool === 'DT') {
				indirectDoubleTimeWins[scoreVersion][winner]++;
			} else {
				indirectFreeModWins[scoreVersion][winner]++;
			}

			//For the graph
			rounds.push({
				mod: beatmaps[i].modPool,
				winner: winner,
				score: team1Score / team2Score,
				matchId: matchId,
				date: date,
				dateReadable: dateReadable,
			});

			//For the maps played txt
			let modPoolNumber = 0;
			if (beatmaps[i].modPool === 'NM') {
				modPoolNumber = 0;
			} else if (beatmaps[i].modPool === 'HD') {
				modPoolNumber = 1;
			} else if (beatmaps[i].modPool === 'HR') {
				modPoolNumber = 2;
			} else if (beatmaps[i].modPool === 'DT') {
				modPoolNumber = 3;
			} else if (beatmaps[i].modPool === 'FM') {
				modPoolNumber = 4;
			}

			let dbBeatmap = dbBeatmaps.find((dbBeatmap) => dbBeatmap.beatmapId === beatmaps[i].beatmapId);

			dbBeatmap = await getOsuBeatmap({ beatmapId: beatmaps[i].beatmapId, beatmap: dbBeatmap });

			let beatmapString = `https://osu.ppy.sh/b/${beatmaps[i].beatmapId}`;

			if (dbBeatmap) {
				beatmapString += ` (${dbBeatmap.artist} - ${dbBeatmap.title} [${dbBeatmap.difficulty}])`;
			}

			if (winner === 0) {
				mapsPlayedReadable[winner][modPoolNumber].push(`${dateReadable} - ${scoringType} ${beatmaps[i].modPool} - Won by: ${team1Players.join(', ')} against ${team2Players.join(', ')} (by ${humanReadable(Math.abs(team1Score - team2Score))}) - ${humanReadable(team1Score)} vs ${humanReadable(team2Score)} - ${beatmapString}`);
			} else {
				mapsPlayedReadable[winner][modPoolNumber].push(`${dateReadable} - ${scoringType} ${beatmaps[i].modPool} - Won by: ${team2Players.join(', ')} against ${team1Players.join(', ')} (by ${humanReadable(Math.abs(team1Score - team2Score))}) - ${humanReadable(team1Score)} vs ${humanReadable(team2Score)} - ${beatmapString}`);
			}
		}

		for (let i = 0; i < mapsPlayedReadable.length; i++) {
			for (let j = 0; j < mapsPlayedReadable[i].length; j++) {
				mapsPlayedReadable[i][j].sort((a, b) => {
					return parseInt(`${b.substring(3, 7)}${b.substring(0, 2)}`) - parseInt(`${a.substring(3, 7)}${a.substring(0, 2)}`);
				});
			}
		}

		//Sort the rounds for the graph
		rounds.sort((a, b) => parseInt(b.matchId) - parseInt(a.matchId));

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
		let avatar = await getAvatar(team1[0]);
		ctx.drawImage(avatar, 10, 10, 160, 160);

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
		avatar = await getAvatar(team2[0]);
		ctx.drawImage(avatar, 830, 10, 160, 160);

		let files = [];
		//Create as an attachment
		const matchUpStats = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-matchup-${team1.join('-')}-${team2.join('-')}.png` });

		files.push(matchUpStats);

		let tourneyMatchText = '; Casual & Tourney matches';
		if (tourneyMatch) {
			tourneyMatchText = '; Tourney matches only';
		}

		let content = `Matchup analysis for \`${team1Names.join(' | ')}\` vs \`${team2Names.join(' | ')}\` (Teamsize: ${teamsize}; Score ${scoringType}${tourneyMatchText}; ${timeframeText})`;

		if (beatmaps.length) {
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

		let sentMessage = await interaction.editReply({ content: content, files: files });

		if (team1.length === 1 && team2.length === 1) {
			sentMessage.react('🔵');
			sentMessage.react('🔴');
		}
	},
};

function getColor(array) {
	let color = '#ffffff';
	if (array[0][0] + array[1][0] > array[0][1] + array[1][1]) {
		color = '#3498DB';
	} else if (array[0][0] + array[1][0] < array[0][1] + array[1][1]) {
		color = '#CF252D';
	}

	return color;
}