const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');
const osu = require('node-osu');
const { logDatabaseQueries, getOsuUserServerMode, populateMsgFromInteraction, pause, getMessageUserDisplayname, getIDFromPotentialOsuLink, getUserDuelStarRating, createLeaderboard, getOsuDuelLeague, createDuelMatch, updateQueueChannels, getDerankStats, humanReadable, getOsuPlayerName, getAdditionalOsuInfo, getBadgeImage, getAvatar } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { Op } = require('sequelize');
const { leaderboardEntriesPerPage } = require('../config.json');
const Canvas = require('canvas');
const Discord = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { showUnknownInteractionError, daysHidingQualifiers } = require('../config.json');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');

module.exports = {
	name: 'osu-duel',
	description: 'Lets you play a match which is being reffed by the bot',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-duel')
		.setNameLocalizations({
			'de': 'osu-duel',
			'en-GB': 'osu-duel',
			'en-US': 'osu-duel',
		})
		.setDescription('Lets you play a match which is being reffed by the bot')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir ein Match zu spielen, welches von dem Bot geleitet wird',
			'en-GB': 'Lets you play a match which is being reffed by the bot',
			'en-US': 'Lets you play a match which is being reffed by the bot',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('queue1v1')
				.setNameLocalizations({
					'de': 'queue1v1',
					'en-GB': 'queue1v1',
					'en-US': 'queue1v1',
				})
				.setDescription('Lets you queue up for a Bo7 match against an opponent')
				.setDescriptionLocalizations({
					'de': 'Lässt dich in eine Bo7 Warteschlange einreihen',
					'en-GB': 'Lets you queue up for a Bo7 match against an opponent',
					'en-US': 'Lets you queue up for a Bo7 match against an opponent',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('queue1v1-leave')
				.setNameLocalizations({
					'de': 'queue1v1-leave',
					'en-GB': 'queue1v1-leave',
					'en-US': 'queue1v1-leave',
				})
				.setDescription('Lets you leave the queue for Bo7 matches')
				.setDescriptionLocalizations({
					'de': 'Lässt dich die Bo7 Warteschlange verlassen',
					'en-GB': 'Lets you leave the queue for Bo7 matches',
					'en-US': 'Lets you leave the queue for Bo7 matches',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('match')
				.setNameLocalizations({
					'de': 'match',
					'en-GB': 'match',
					'en-US': 'match',
				})
				.setDescription('Create a match hosted by the bot')
				.setDescriptionLocalizations({
					'de': 'Erstelle ein Match das vom Bot gehostet wird',
					'en-GB': 'Create a match hosted by the bot',
					'en-US': 'Create a match hosted by the bot',
				})
				.addUserOption(option =>
					option
						.setName('firstopponent')
						.setNameLocalizations({
							'de': 'erstergegner',
							'en-GB': 'firstopponent',
							'en-US': 'firstopponent',
						})
						.setDescription('An opponent')
						.setDescriptionLocalizations({
							'de': 'Ein Gegner',
							'en-GB': 'An opponent',
							'en-US': 'An opponent',
						})
						.setRequired(true)
				)
				.addUserOption(option =>
					option
						.setName('firstteammate')
						.setNameLocalizations({
							'de': 'ersterpartner',
							'en-GB': 'firstteammate',
							'en-US': 'firstteammate',
						})
						.setDescription('A teammate')
						.setDescriptionLocalizations({
							'de': 'Ein Partner',
							'en-GB': 'A teammate',
							'en-US': 'A teammate',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('secondteammate')
						.setNameLocalizations({
							'de': 'zweiterpartner',
							'en-GB': 'secondteammate',
							'en-US': 'secondteammate',
						})
						.setDescription('A teammate')
						.setDescriptionLocalizations({
							'de': 'Ein Partner',
							'en-GB': 'A teammate',
							'en-US': 'A teammate',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('thirdteammate')
						.setNameLocalizations({
							'de': 'dritterpartner',
							'en-GB': 'thirdteammate',
							'en-US': 'thirdteammate',
						})
						.setDescription('A teammate')
						.setDescriptionLocalizations({
							'de': 'Ein Partner',
							'en-GB': 'A teammate',
							'en-US': 'A teammate',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('fourthteammate')
						.setNameLocalizations({
							'de': 'vierterpartner',
							'en-GB': 'fourthteammate',
							'en-US': 'fourthteammate',
						})
						.setDescription('A teammate')
						.setDescriptionLocalizations({
							'de': 'Ein Partner',
							'en-GB': 'A teammate',
							'en-US': 'A teammate',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('fifthteammate')
						.setNameLocalizations({
							'de': 'fünfterpartner',
							'en-GB': 'fifthteammate',
							'en-US': 'fifthteammate',
						})
						.setDescription('A teammate')
						.setDescriptionLocalizations({
							'de': 'Ein Partner',
							'en-GB': 'A teammate',
							'en-US': 'A teammate',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('sixthteammate')
						.setNameLocalizations({
							'de': 'sechsterpartner',
							'en-GB': 'sixthteammate',
							'en-US': 'sixthteammate',
						})
						.setDescription('A teammate')
						.setDescriptionLocalizations({
							'de': 'Ein Partner',
							'en-GB': 'A teammate',
							'en-US': 'A teammate',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('seventhteammate')
						.setNameLocalizations({
							'de': 'siebterpartner',
							'en-GB': 'seventhteammate',
							'en-US': 'seventhteammate',
						})
						.setDescription('A teammate')
						.setDescriptionLocalizations({
							'de': 'Ein Partner',
							'en-GB': 'A teammate',
							'en-US': 'A teammate',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('secondopponent')
						.setNameLocalizations({
							'de': 'zweitergegner',
							'en-GB': 'secondopponent',
							'en-US': 'secondopponent',
						})
						.setDescription('An opponent')
						.setDescriptionLocalizations({
							'de': 'Ein Gegner',
							'en-GB': 'An opponent',
							'en-US': 'An opponent',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('thirdopponent')
						.setNameLocalizations({
							'de': 'drittergegner',
							'en-GB': 'thirdopponent',
							'en-US': 'thirdopponent',
						})
						.setDescription('An opponent')
						.setDescriptionLocalizations({
							'de': 'Ein Gegner',
							'en-GB': 'An opponent',
							'en-US': 'An opponent',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('fourthopponent')
						.setNameLocalizations({
							'de': 'viertergegner',
							'en-GB': 'fourthopponent',
							'en-US': 'fourthopponent',
						})
						.setDescription('An opponent')
						.setDescriptionLocalizations({
							'de': 'Ein Gegner',
							'en-GB': 'An opponent',
							'en-US': 'An opponent',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('fifthopponent')
						.setNameLocalizations({
							'de': 'fünftergegner',
							'en-GB': 'fifthopponent',
							'en-US': 'fifthopponent',
						})
						.setDescription('An opponent')
						.setDescriptionLocalizations({
							'de': 'Ein Gegner',
							'en-GB': 'An opponent',
							'en-US': 'An opponent',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('sixthopponent')
						.setNameLocalizations({
							'de': 'sechstergegner',
							'en-GB': 'sixthopponent',
							'en-US': 'sixthopponent',
						})
						.setDescription('An opponent')
						.setDescriptionLocalizations({
							'de': 'Ein Gegner',
							'en-GB': 'An opponent',
							'en-US': 'An opponent',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('seventhopponent')
						.setNameLocalizations({
							'de': 'siebtergegner',
							'en-GB': 'seventhopponent',
							'en-US': 'seventhopponent',
						})
						.setDescription('An opponent')
						.setDescriptionLocalizations({
							'de': 'Ein Gegner',
							'en-GB': 'An opponent',
							'en-US': 'An opponent',
						})
						.setRequired(false)
				)
				.addUserOption(option =>
					option
						.setName('eighthopponent')
						.setNameLocalizations({
							'de': 'achtergegner',
							'en-GB': 'eighthopponent',
							'en-US': 'eighthopponent',
						})
						.setDescription('An opponent')
						.setDescriptionLocalizations({
							'de': 'Ein Gegner',
							'en-GB': 'An opponent',
							'en-US': 'An opponent',
						})
						.setRequired(false)
				)
				.addNumberOption(option =>
					option
						.setName('starrating')
						.setNameLocalizations({
							'de': 'sterne',
							'en-GB': 'starrating',
							'en-US': 'starrating',
						})
						.setDescription('The star rating to play on')
						.setDescriptionLocalizations({
							'de': 'Die Sterne die du spielen willst',
							'en-GB': 'The star rating to play on',
							'en-US': 'The star rating to play on',
						})
						.setRequired(false)
				)
				.addIntegerOption(option =>
					option
						.setName('bestof')
						.setNameLocalizations({
							'de': 'bestof',
							'en-GB': 'bestof',
							'en-US': 'bestof',
						})
						.setDescription('The best of')
						.setDescriptionLocalizations({
							'de': 'Das Best of',
							'en-GB': 'The best of',
							'en-US': 'The best of',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'Best of 13', value: 13 },
							{ name: 'Best of 11', value: 11 },
							{ name: 'Best of 9', value: 9 },
							{ name: 'Best of 7 (Default)', value: 7 },
							{ name: 'Best of 5', value: 5 },
							{ name: 'Best of 3', value: 3 },
							{ name: 'Best of 1', value: 1 },
						)
				)
				.addBooleanOption(option =>
					option
						.setName('ranked')
						.setNameLocalizations({
							'de': 'ranked',
							'en-GB': 'ranked',
							'en-US': 'ranked',
						})
						.setDescription('Should only ranked maps be played?')
						.setDescriptionLocalizations({
							'de': 'Sollen nur ranked Maps gespielt werden?',
							'en-GB': 'Should only ranked maps be played?',
							'en-US': 'Should only ranked maps be played?',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('rating')
				.setNameLocalizations({
					'de': 'wertung',
					'en-GB': 'rating',
					'en-US': 'rating',
				})
				.setDescription('Get shown what a users rating is')
				.setDescriptionLocalizations({
					'de': 'Zeigt dir die Wertung eines Spielers an',
					'en-GB': 'Get shown what a users rating is',
					'en-US': 'Get shown what a users rating is',
				})
				.addStringOption(option =>
					option
						.setName('username')
						.setNameLocalizations({
							'de': 'nutzername',
							'en-GB': 'username',
							'en-US': 'username',
						})
						.setDescription('The username of the player')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername des Spielers',
							'en-GB': 'The username of the player',
							'en-US': 'The username of the player',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('historical')
						.setNameLocalizations({
							'de': 'historie',
							'en-GB': 'historical',
							'en-US': 'historical',
						})
						.setDescription('The amount of historical data to be shown.')
						.setDescriptionLocalizations({
							'de': 'Die Menge an historischen Daten die angezeigt werden soll.',
							'en-GB': 'The amount of historical data to be shown.',
							'en-US': 'The amount of historical data to be shown.',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'Only the current data', value: '0' },
							{ name: 'Including last year', value: '1' },
							{ name: 'All historical data', value: '99' },
						)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('rating-leaderboard')
				.setNameLocalizations({
					'de': 'wertungs-rangliste',
					'en-GB': 'rating-leaderboard',
					'en-US': 'rating-leaderboard',
				})
				.setDescription('Get a leaderboard of the duel star ratings')
				.setDescriptionLocalizations({
					'de': 'Zeigt eine Rangliste der Duel Star Ratings an',
					'en-GB': 'Get a leaderboard of the duel star ratings',
					'en-US': 'Get a leaderboard of the duel star ratings',
				})
				.addIntegerOption(option =>
					option
						.setName('page')
						.setNameLocalizations({
							'de': 'seite',
							'en-GB': 'page',
							'en-US': 'page',
						})
						.setDescription('The page of the leaderboard to display')
						.setDescriptionLocalizations({
							'de': 'Die Seite der Rangliste die angezeigt werden soll',
							'en-GB': 'The page of the leaderboard to display',
							'en-US': 'The page of the leaderboard to display',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option
						.setName('csv')
						.setNameLocalizations({
							'de': 'csv',
							'en-GB': 'csv',
							'en-US': 'csv',
						})
						.setDescription('Should a csv file be attached')
						.setDescriptionLocalizations({
							'de': 'Soll eine csv Datei angehängt werden',
							'en-GB': 'Should a csv file be attached',
							'en-US': 'Should a csv file be attached',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('data')
				.setNameLocalizations({
					'de': 'daten',
					'en-GB': 'data',
					'en-US': 'data',
				})
				.setDescription('Get shown what a users rating is based on')
				.setDescriptionLocalizations({
					'de': 'Zeigt auf was die Wertung eines Spielers basiert',
					'en-GB': 'Get shown what a users rating is based on',
					'en-US': 'Get shown what a users rating is based on',
				})
				.addStringOption(option =>
					option
						.setName('username')
						.setNameLocalizations({
							'de': 'nutzername',
							'en-GB': 'username',
							'en-US': 'username',
						})
						.setDescription('The username, id or link')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link',
							'en-GB': 'The username, id or link',
							'en-US': 'The username, id or link',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('rating-spread')
				.setNameLocalizations({
					'de': 'wertungs-aufteilung',
					'en-GB': 'rating-spread',
					'en-US': 'rating-spread',
				})
				.setDescription('See the rank spread across all connected users')
				.setDescriptionLocalizations({
					'de': 'Zeigt wie die Ränge auf alle verbundenen Nutzer verteilt sind',
					'en-GB': 'See the rank spread across all connected users',
					'en-US': 'See the rank spread across all connected users',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('rating-updates')
				.setNameLocalizations({
					'de': 'wertungs-updates',
					'en-GB': 'rating-updates',
					'en-US': 'rating-updates',
				})
				.setDescription('Get notified on rating changes')
				.setDescriptionLocalizations({
					'de': 'Werde benachrichtigt wenn sich deine Wertung ändert',
					'en-GB': 'Get notified on rating changes',
					'en-US': 'Get notified on rating changes',
				})
				.addBooleanOption(option =>
					option
						.setName('enabled')
						.setNameLocalizations({
							'de': 'aktiviert',
							'en-GB': 'enabled',
							'en-US': 'enabled',
						})
						.setDescription('Change if updates should be sent or not')
						.setDescriptionLocalizations({
							'de': 'Ändert ob Updates gesendet werden sollen oder nicht',
							'en-GB': 'Change if updates should be sent or not',
							'en-US': 'Change if updates should be sent or not',
						})
						.setRequired(true)
				)
		),
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			if (interaction.options._subcommand === 'match1v1' ||
				interaction.options._subcommand === 'match2v2' ||
				interaction.options._subcommand === 'match3v3' ||
				interaction.options._subcommand === 'match4v4' ||
				interaction.options._subcommand === 'match5v5' ||
				interaction.options._subcommand === 'match6v6' ||
				interaction.options._subcommand === 'match7v7' ||
				interaction.options._subcommand === 'match8v8' ||
				interaction.options._subcommand === 'match') {
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

				msg = await populateMsgFromInteraction(interaction);

				// Get the best of
				let bestOf = 7;

				if (interaction.options.getInteger('bestof')) {
					bestOf = interaction.options.getInteger('bestof');
				}

				// Get the ranked flag
				let onlyRanked = false;

				if (interaction.options.getBoolean('ranked')) {
					onlyRanked = interaction.options.getBoolean('ranked');
				}

				// Get the star rating
				let averageStarRating = null;

				if (interaction.options.getNumber('starrating')) {
					averageStarRating = interaction.options.getNumber('starrating');

					if (averageStarRating < 3) {
						return await interaction.editReply('You can\'t play a match with a star rating lower than 3');
					} else if (averageStarRating > 10) {
						return await interaction.editReply('You can\'t play a match with a star rating higher than 10');
					}
				}

				// Get the teammates
				let teammates = [];

				if (interaction.options.getUser('teammate')) {
					teammates.push(interaction.options.getUser('teammate').id);
				}

				if (interaction.options.getUser('firstteammate')) {
					teammates.push(interaction.options.getUser('firstteammate').id);
				}

				if (interaction.options.getUser('secondteammate')) {
					teammates.push(interaction.options.getUser('secondteammate').id);
				}

				if (interaction.options.getUser('thirdteammate')) {
					teammates.push(interaction.options.getUser('thirdteammate').id);
				}

				if (interaction.options.getUser('fourthteammate')) {
					teammates.push(interaction.options.getUser('fourthteammate').id);
				}

				if (interaction.options.getUser('fifthteammate')) {
					teammates.push(interaction.options.getUser('fifthteammate').id);
				}

				if (interaction.options.getUser('sixthteammate')) {
					teammates.push(interaction.options.getUser('sixthteammate').id);
				}

				if (interaction.options.getUser('seventhteammate')) {
					teammates.push(interaction.options.getUser('seventhteammate').id);
				}

				// Get the opponents
				let opponents = [];

				if (interaction.options.getUser('opponent')) {
					opponents.push(interaction.options.getUser('opponent').id);
				}

				if (interaction.options.getUser('firstopponent')) {
					opponents.push(interaction.options.getUser('firstopponent').id);
				}

				if (interaction.options.getUser('secondopponent')) {
					opponents.push(interaction.options.getUser('secondopponent').id);
				}

				if (interaction.options.getUser('thirdopponent')) {
					opponents.push(interaction.options.getUser('thirdopponent').id);
				}

				if (interaction.options.getUser('fourthopponent')) {
					opponents.push(interaction.options.getUser('fourthopponent').id);
				}

				if (interaction.options.getUser('fifthopponent')) {
					opponents.push(interaction.options.getUser('fifthopponent').id);
				}

				if (interaction.options.getUser('sixthopponent')) {
					opponents.push(interaction.options.getUser('sixthopponent').id);
				}

				if (interaction.options.getUser('seventhopponent')) {
					opponents.push(interaction.options.getUser('seventhopponent').id);
				}

				if (interaction.options.getUser('eigthopponent')) {
					opponents.push(interaction.options.getUser('eigthopponent').id);
				}

				if (teammates.length + 1 !== opponents.length) {
					return await interaction.editReply('You need to have the same amount of teammates and opponents');
				}

				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.editReply(`You don't have your osu! account connected and verified.\nPlease connect your account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
				}

				//Cross check that commandUser.userId, teammates and opponents are all unique
				const allUsers = [commandUser.userId, ...teammates, ...opponents];
				const uniqueUsers = [...new Set(allUsers)];
				const everyUser = [];

				if (allUsers.length !== uniqueUsers.length) {
					return await interaction.editReply('You can\'t play a match with the same user twice');
				}

				// Collect the star ratings to calculate the average & update the duel ratings for the users
				const starRatings = [];

				for (let i = 0; i < allUsers.length; i++) {
					let starRating = 4;
					let discordUser = null;

					logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers');
					discordUser = await DBDiscordUsers.findOne({
						attributes: [
							'osuUserId',
							'osuName',
							'userId',
							'osuDuelStarRating',
							'osuNoModDuelStarRating',
							'osuHiddenDuelStarRating',
							'osuHardRockDuelStarRating',
							'osuDoubleTimeDuelStarRating',
							'osuFreeModDuelStarRating',
						],
						where: {
							userId: allUsers[i],
							osuVerified: true
						}
					});

					if (discordUser && discordUser.osuUserId) {
						everyUser.push(discordUser);
						if (!averageStarRating) {
							try {
								await interaction.editReply(`Processing Duel Rating for ${discordUser.osuName}...`);
								starRating = await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
							} catch (e) {
								if (e !== 'No standard plays') {
									console.error(e);
								}
							}
							starRatings.push(starRating.total);
						} else {
							getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: interaction.client });
						}
					} else {
						return await interaction.editReply(`<@${allUsers[i]}> doesn't have their osu! account connected and verified.\nPlease have them connect their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
					}
				}

				if (!averageStarRating) {
					let totalStarRating = 0;
					for (let i = 0; i < starRatings.length; i++) {
						totalStarRating += starRatings[i];
					}
					averageStarRating = totalStarRating / starRatings.length;
				}

				let lowerBound = averageStarRating - 0.125;
				let upperBound = averageStarRating + 0.125;

				let sentMessage = await interaction.editReply(`<@${commandUser.userId}> wants to play a match with <@${teammates.join('>, <@')}> against <@${opponents.join('>, <@')}>. (SR: ${Math.round(averageStarRating * 100) / 100}*)\nReact with ✅ to accept.\nReact with ❌ to decline.`.replace('with <@> ', ''));

				let pingMessage = await interaction.channel.send(`<@${teammates.join('>, <@')}>, <@${opponents.join('>, <@')}>`.replace('<@>, ', ''));
				await sentMessage.react('✅');
				await sentMessage.react('❌');
				pingMessage.delete();

				let responded = false;
				let accepted = [];
				let declined = false;
				let decliner = null;

				const collector = sentMessage.createReactionCollector({ time: 300000 });

				collector.on('collect', (reaction, user) => {
					if (reaction.emoji.name === '✅' && [...teammates, ...opponents].includes(user.id)) {
						if (!accepted.includes(user.id)) {
							accepted.push(user.id);

							if (accepted.length === teammates.length + opponents.length) {
								collector.stop();
							}
						}
					} else if (reaction.emoji.name === '❌' && [...teammates, ...opponents].includes(user.id)) {
						decliner = user.id;
						collector.stop();
					}
				});

				collector.on('end', () => {
					if (accepted.length < teammates.length + opponents.length) {
						declined = true;
					}
					responded = true;
				});

				while (!responded) {
					await pause(1000);
				}

				sentMessage.reactions.removeAll().catch(() => { });

				if (declined) {
					if (decliner) {
						return await interaction.editReply(`<@${decliner}> declined.`);
					} else {
						return await interaction.editReply('Someone didn\'t respond in time.');
					}
				}

				//Remove the users from the queue
				logDatabaseQueries(4, 'commands/osu-duel.js DBProcessQueue existingQueueTasks');
				let existingQueueTasks = await DBProcessQueue.findAll({
					attributes: ['id', 'additions'],
					where: {
						task: 'duelQueue1v1',
					},
				});

				for (let i = 0; i < existingQueueTasks.length; i++) {
					const osuUserId = existingQueueTasks[i].additions.split(';')[0];

					for (let j = 0; j < everyUser.length; j++) {
						if (everyUser[j].osuUserId === osuUserId) {
							await existingQueueTasks[i].destroy();
							await interaction.followUp(`<@${everyUser[j].userId}> you have been removed from the queue for a 1v1 duel.`);
							break;
						}
					}
				}

				updateQueueChannels(interaction.client);

				createDuelMatch(additionalObjects[0], additionalObjects[1], interaction, averageStarRating, lowerBound, upperBound, bestOf, onlyRanked, everyUser);
			} else if (interaction.options._subcommand === 'rating') {
				let processingMessage = null;
				if (interaction.id) {
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
				} else {
					let playerName = await getOsuPlayerName(interaction.options._hoistedOptions[0].value);
					processingMessage = await interaction.channel.send(`Processing league ratings for ${playerName}...`);
				}

				let osuUser = {
					id: null,
					name: null,
				};

				let username = null;
				let historical = null;

				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'username') {
						username = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'historical') {
						historical = parseInt(interaction.options._hoistedOptions[i].value);
					}
				}

				if (historical === null) {
					historical = 1;
				}

				if (username) {
					//Get the user by the argument given
					if (username.startsWith('<@') && username.endsWith('>')) {
						logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating');
						const discordUser = await DBDiscordUsers.findOne({
							attributes: ['osuUserId', 'osuName'],
							where: {
								userId: username.replace('<@', '').replace('>', '').replace('!', '')
							},
						});

						if (discordUser && discordUser.osuUserId) {
							osuUser.id = discordUser.osuUserId;
							osuUser.name = discordUser.osuName;
						} else {
							return await interaction.editReply({ content: `\`${username.replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`, ephemeral: true });
						}
					} else {
						osuUser.name = getIDFromPotentialOsuLink(username);
					}
				} else {
					//Try to get the user by the message if no argument given
					msg = await populateMsgFromInteraction(interaction);
					const commandConfig = await getOsuUserServerMode(msg, []);
					const commandUser = commandConfig[0];

					if (commandUser && commandUser.osuUserId) {
						osuUser.id = commandUser.osuUserId;
						osuUser.name = commandUser.osuName;
					} else {
						const userDisplayName = await getMessageUserDisplayname(msg);
						osuUser.name = userDisplayName;
					}
				}

				if (!osuUser.id) {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					// eslint-disable-next-line no-undef
					process.send('osu!API');
					const user = await osuApi.getUser({ u: osuUser.name, m: 0 })
						.catch(err => {
							if (err.message !== 'Not found') {
								console.error(err);
							}
						});

					if (!user) {
						if (interaction.id) {
							return await interaction.editReply({ content: `Could not find user \`${osuUser.name.replace(/`/g, '')}\`.`, ephemeral: true });
						} else {
							return processingMessage.edit(`Could not find user \`${osuUser.name.replace(/`/g, '')}\`.`);
						}
					}

					osuUser.id = user.id;
					osuUser.name = user.name;
				}

				let seasonEnd = new Date();
				seasonEnd.setUTCFullYear(seasonEnd.getUTCFullYear() - 1);
				seasonEnd.setUTCMonth(11);
				seasonEnd.setUTCDate(31);
				seasonEnd.setUTCHours(23);
				seasonEnd.setUTCMinutes(59);
				seasonEnd.setUTCSeconds(59);
				seasonEnd.setUTCMilliseconds(999);

				let historicalUserDuelStarRatings = [];

				while (seasonEnd.getUTCFullYear() > 2014 && historical) {
					let historicalDataset = {
						seasonEnd: `${seasonEnd.getUTCMonth() + 1}/${seasonEnd.getUTCFullYear()}`,
						ratings: await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client, date: seasonEnd })
					};

					if (historicalUserDuelStarRatings.length === 0 && historicalDataset.ratings.total || historicalUserDuelStarRatings.length && historicalDataset.ratings.total && historicalDataset.ratings.total !== historicalUserDuelStarRatings[historicalUserDuelStarRatings.length - 1].ratings.total) {
						historicalUserDuelStarRatings.push(historicalDataset);
					}

					seasonEnd.setUTCMonth(seasonEnd.getUTCMonth() - 12);
					historical--;
				}

				const canvasWidth = 700;
				const canvasHeight = 575 + historicalUserDuelStarRatings.length * 250;

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

				//Footer
				let today = new Date().toLocaleDateString();

				ctx.font = 'bold 15px comfortaa, sans-serif';
				ctx.fillStyle = '#ffffff';

				ctx.textAlign = 'left';
				ctx.fillText(`UserID: ${osuUser.id}`, 10, canvas.height - 10);

				ctx.textAlign = 'right';
				ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 10, canvas.height - 10);

				//Title
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'center';
				ctx.font = 'bold 30px comfortaa, sans-serif';
				ctx.fillText(`League Ratings for ${osuUser.name}`, 350, 40);

				//Set Duel Rating and League Rank
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'center';
				ctx.font = 'bold 25px comfortaa, sans-serif';
				//Current Total Rating
				ctx.fillText('Current Total Rating', 475, 100);
				let userDuelStarRating = null;
				for (let i = 0; i < 5 && !userDuelStarRating; i++) {
					try {
						userDuelStarRating = await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client });
					} catch (e) {
						if (i === 4) {
							if (e === 'No standard plays') {
								if (interaction.id) {
									return interaction.editReply(`Could not find any standard plays for user \`${osuUser.name.replace(/`/g, '')}\`.\nPlease try again later.`);
								} else {
									return processingMessage.edit(`Could not find any standard plays for user \`${osuUser.name.replace(/`/g, '')}\`.\nPlease try again later.`);
								}
							} else {
								if (interaction.id) {
									return interaction.editReply('The API seems to be running into errors right now.\nPlease try again later.');
								} else {
									return processingMessage.edit('The API seems to be running into errors right now.\nPlease try again later.');
								}
							}
						} else {
							await pause(15000);
						}
					}
				}

				let duelLeague = getOsuDuelLeague(userDuelStarRating.total);

				let leagueText = duelLeague.name;
				let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 400, 100, 150, 150);

				if (userDuelStarRating.provisional) {
					leagueText = 'Provisional: ' + leagueText;
				} else if (userDuelStarRating.outdated) {
					leagueText = 'Outdated: ' + leagueText;
				}

				ctx.fillText(leagueText, 475, 275);
				ctx.fillText(`(${Math.round(userDuelStarRating.total * 1000) / 1000}*)`, 475, 300);

				ctx.font = 'bold 18px comfortaa, sans-serif';

				//Current NoMod Rating
				ctx.fillText('NoMod', 100, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.noMod);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 50, 350, 100, 100);

				ctx.fillText(leagueText, 100, 475);
				if (userDuelStarRating.noMod !== null) {
					let limited = '';
					if (userDuelStarRating.noModLimited) {
						limited = '~';
					}
					ctx.fillText(`(${limited}${Math.round(userDuelStarRating.noMod * 1000) / 1000}*)`, 100, 500);
				}

				//Current Hidden Rating
				ctx.fillText('Hidden', 225, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.hidden);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 175, 350, 100, 100);

				ctx.fillText(leagueText, 225, 475);
				if (userDuelStarRating.hidden !== null) {
					let limited = '';
					if (userDuelStarRating.hiddenLimited) {
						limited = '~';
					}
					ctx.fillText(`(${limited}${Math.round(userDuelStarRating.hidden * 1000) / 1000}*)`, 225, 500);
				}

				//Current HardRock Rating
				ctx.fillText('HardRock', 350, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.hardRock);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 300, 350, 100, 100);

				ctx.fillText(leagueText, 350, 475);
				if (userDuelStarRating.hardRock !== null) {
					let limited = '';
					if (userDuelStarRating.hardRockLimited) {
						limited = '~';
					}
					ctx.fillText(`(${limited}${Math.round(userDuelStarRating.hardRock * 1000) / 1000}*)`, 350, 500);
				}

				//Current DoubleTime Rating
				ctx.fillText('DoubleTime', 475, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.doubleTime);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 425, 350, 100, 100);

				ctx.fillText(leagueText, 475, 475);
				if (userDuelStarRating.doubleTime !== null) {
					let limited = '';
					if (userDuelStarRating.doubleTimeLimited) {
						limited = '~';
					}
					ctx.fillText(`(${limited}${Math.round(userDuelStarRating.doubleTime * 1000) / 1000}*)`, 475, 500);
				}

				//Current FreeMod Rating
				ctx.fillText('FreeMod', 600, 350);
				duelLeague = getOsuDuelLeague(userDuelStarRating.freeMod);

				leagueText = duelLeague.name;
				leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

				ctx.drawImage(leagueImage, 550, 350, 100, 100);

				ctx.fillText(leagueText, 600, 475);
				if (userDuelStarRating.freeMod !== null) {
					let limited = '';
					if (userDuelStarRating.freeModLimited) {
						limited = '~';
					}
					ctx.fillText(`(${limited}${Math.round(userDuelStarRating.freeMod * 1000) / 1000}*)`, 600, 500);
				}

				for (let i = 0; i < historicalUserDuelStarRatings.length; i++) {
					ctx.beginPath();
					ctx.moveTo(20, 545 + i * 250);
					ctx.lineTo(680, 545 + i * 250);
					ctx.strokeStyle = 'white';
					ctx.stroke();

					//Set Duel Rating and League Rank
					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'center';
					ctx.font = 'bold 20px comfortaa, sans-serif';
					//Season Total Rating
					ctx.fillText(`${historicalUserDuelStarRatings[i].seasonEnd} Total Rating`, 125, 575 + i * 250);
					let duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.total);

					let leagueText = duelLeague.name;
					let leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 50, 575 + i * 250, 150, 150);

					if (historicalUserDuelStarRatings[i].ratings.provisional) {
						leagueText = 'Provisional: ' + leagueText;
					}

					ctx.fillText(leagueText, 125, 750 + i * 250);
					ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.total * 1000) / 1000}*)`, 125, 775 + i * 250);

					ctx.font = 'bold 15px comfortaa, sans-serif';

					//Season NoMod Rating
					ctx.fillText('NoMod', 287, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.noMod);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 250, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 287, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.noMod !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.noMod * 1000) / 1000}*)`, 287, 725 + i * 250);
					}

					//Season Hidden Rating
					ctx.fillText('Hidden', 377, 650 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.hidden);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 340, 650 + i * 250, 75, 75);

					ctx.fillText(leagueText, 377, 750 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.hidden !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.hidden * 1000) / 1000}*)`, 377, 775 + i * 250);
					}

					//Season HardRock Rating
					ctx.fillText('HardRock', 467, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.hardRock);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 430, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 467, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.hardRock !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.hardRock * 1000) / 1000}*)`, 467, 725 + i * 250);
					}

					//Season DoubleTime Rating
					ctx.fillText('DoubleTime', 557, 650 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.doubleTime);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 520, 650 + i * 250, 75, 75);

					ctx.fillText(leagueText, 557, 750 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.doubleTime !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.doubleTime * 1000) / 1000}*)`, 557, 775 + i * 250);
					}

					//Season FreeMod Rating
					ctx.fillText('FreeMod', 647, 600 + i * 250);
					duelLeague = getOsuDuelLeague(historicalUserDuelStarRatings[i].ratings.freeMod);

					leagueText = duelLeague.name;
					leagueImage = await Canvas.loadImage(`./other/emblems/${duelLeague.imageName}.png`);

					ctx.drawImage(leagueImage, 610, 600 + i * 250, 75, 75);

					ctx.fillText(leagueText, 647, 700 + i * 250);
					if (historicalUserDuelStarRatings[i].ratings.freeMod !== null) {
						ctx.fillText(`(${Math.round(historicalUserDuelStarRatings[i].ratings.freeMod * 1000) / 1000}*)`, 647, 725 + i * 250);
					}
				}

				//Draw badges onto the canvas				
				let additionalInfo = await getAdditionalOsuInfo(osuUser.id, interaction.client);

				let yOffset = -2;
				if (additionalInfo.badges.length < 6) {
					yOffset = yOffset + (6 - additionalInfo.badges.length) * 22;
				}

				for (let i = 0; i < additionalInfo.badges.length && i < 6; i++) {
					const badge = await getBadgeImage(additionalInfo.badges[i].image_url.replace('https://assets.ppy.sh/profile-badges/', ''));
					ctx.drawImage(badge, 10, 60 + i * 44 + yOffset, 86, 40);
				}

				//Draw the Player derank rank
				logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating 2');
				let discordUser = await DBDiscordUsers.findOne({
					attributes: ['osuPP', 'osuDuelStarRating', 'osuUserId', 'osuName'],
					where: {
						osuUserId: osuUser.id
					}
				});

				if (discordUser) {
					let derankStats = await getDerankStats(discordUser);

					ctx.font = 'bold 25px comfortaa, sans-serif';
					ctx.fillText(`Duel Rank: #${humanReadable(derankStats.expectedPpRankOsu)}`, 190, 287);
				}

				//Get a circle for inserting the player avatar
				ctx.beginPath();
				ctx.arc(190, 170, 80, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.clip();

				//Draw a shape onto the main canvas
				const avatar = await getAvatar(osuUser.id);
				ctx.drawImage(avatar, 110, 90, 160, 160);

				if (historicalUserDuelStarRatings.length < 2) {
					// Save the image locally
					const buffer = canvas.toBuffer('image/png');

					//Check if the maps folder exists and create it if necessary
					if (!fs.existsSync('./duelratingcards')) {
						fs.mkdirSync('./duelratingcards');
					}

					fs.writeFileSync(`./duelratingcards/${osuUser.id}.png`, buffer);
				}

				//Create as an attachment
				const leagueRatings = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-league-ratings-${osuUser.id}.png` });

				let sentMessage = null;

				try {
					if (interaction.id) {
						sentMessage = await interaction.editReply({ content: `The data is based on matches played using </osu-duel queue1v1:${interaction.client.slashCommandData.find(command => command.name === 'osu-duel').id}> and any other tournament matches.\nThe values are supposed to show a star rating where a player will get around 350k average score with Score v2.`, files: [leagueRatings] });
					} else {
						processingMessage.delete();
						sentMessage = await interaction.channel.send({ content: `The data is based on matches played using </osu-duel queue1v1:${interaction.client.slashCommandData.find(command => command.name === 'osu-duel').id}> and any other tournament matches.\nThe values are supposed to show a star rating where a player will get around 350k average score with Score v2.`, files: [leagueRatings] });
					}

					await sentMessage.react('👤');
					await sentMessage.react('🥇');
					await sentMessage.react('📈');
					if (userDuelStarRating.noMod !== null
						|| userDuelStarRating.hidden !== null
						|| userDuelStarRating.hardRock !== null
						|| userDuelStarRating.doubleTime !== null
						|| userDuelStarRating.freeMod !== null) {
						await sentMessage.react('🆚');
						await sentMessage.react('📊');
					}
				} catch (error) {
					if (error.message !== 'Unknown Message' && error.message !== 'Missing Permissions') {
						console.error(error);
					}
				}
				return;
			} else if (interaction.options._subcommand === 'rating-leaderboard') {
				if (interaction.id) {
					try {
						await interaction.reply('Processing leaderboard...');
					} catch (error) {
						if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
							console.error(error);
						}
						const timestamps = interaction.client.cooldowns.get(this.name);
						timestamps.delete(interaction.user.id);
						return;
					}
				}

				let osuAccounts = [];
				let discordUsers = [];

				if (interaction.guild) {
					try {
						let members = await interaction.guild.members.fetch({ time: 300000 })
							.catch((err) => {
								throw new Error(err);
							});

						members = members.map(member => member.id);

						logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-leaderboard');
						discordUsers = await DBDiscordUsers.findAll({
							attributes: [
								'userId',
								'osuUserId',
								'osuName',
								'osuVerified',
								'osuDuelStarRating',
								'osuNoModDuelStarRating',
								'osuHiddenDuelStarRating',
								'osuHardRockDuelStarRating',
								'osuDoubleTimeDuelStarRating',
								'osuFreeModDuelStarRating',
								'osuDuelProvisional',
								'osuDuelOutdated',
								'osuRank',
							],
							where: {
								userId: {
									[Op.in]: members
								},
								osuUserId: {
									[Op.not]: null,
								},
								osuDuelStarRating: {
									[Op.not]: null,
								}
							},
						});
					} catch (e) {
						if (e.message !== 'Members didn\'t arrive in time.') {
							console.error('commands/osu-duel.js | rating-leaderboard', e);
							return;
						}
					}
				} else {
					logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-leaderboard 2');
					discordUsers = await DBDiscordUsers.findAll({
						attributes: [
							'userId',
							'osuUserId',
							'osuName',
							'osuVerified',
							'osuDuelStarRating',
							'osuNoModDuelStarRating',
							'osuHiddenDuelStarRating',
							'osuHardRockDuelStarRating',
							'osuDoubleTimeDuelStarRating',
							'osuFreeModDuelStarRating',
							'osuDuelProvisional',
							'osuDuelOutdated',
							'osuRank',
						],
						where: {
							osuUserId: {
								[Op.not]: null,
							},
							osuDuelStarRating: {
								[Op.not]: null,
							},
							osuDuelProvisional: {
								[Op.not]: true,
							}
						},
					});
				}

				for (let i = 0; i < discordUsers.length; i++) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						osuDuelStarRating: parseFloat(discordUsers[i].osuDuelStarRating),
						osuNoModDuelStarRating: parseFloat(discordUsers[i].osuNoModDuelStarRating),
						osuHiddenDuelStarRating: parseFloat(discordUsers[i].osuHiddenDuelStarRating),
						osuHardRockDuelStarRating: parseFloat(discordUsers[i].osuHardRockDuelStarRating),
						osuDoubleTimeDuelStarRating: parseFloat(discordUsers[i].osuDoubleTimeDuelStarRating),
						osuFreeModDuelStarRating: parseFloat(discordUsers[i].osuFreeModDuelStarRating),
						osuDuelProvisional: discordUsers[i].osuDuelProvisional,
						osuDuelOutdated: discordUsers[i].osuDuelOutdated,
						osuRank: discordUsers[i].osuRank,
					});
				}

				osuAccounts.sort((a, b) => b.osuDuelStarRating - a.osuDuelStarRating);

				let leaderboardData = [];

				let messageToAuthor = '';
				let authorPlacement = 0;

				for (let i = 0; i < osuAccounts.length; i++) {
					if (interaction.user.id === osuAccounts[i].userId) {
						messageToAuthor = `\nYou are currently rank \`#${i + 1}\` on the leaderboard.`;
						authorPlacement = i + 1;
					}

					if (interaction.guild) {
						const member = await interaction.guild.members.cache.get(osuAccounts[i].userId);

						let userDisplayName = `${member.user.username}#${member.user.discriminator}`;

						if (member.nickname) {
							userDisplayName = `${member.nickname} / ${userDisplayName}`;
						}

						let verified = 'x';

						if (osuAccounts[i].osuVerified) {
							verified = '✔';
						}

						let dataset = {
							name: userDisplayName,
							value: `${Math.round(osuAccounts[i].osuDuelStarRating * 1000) / 1000}* | ${verified} ${osuAccounts[i].osuName}`,
							color: getOsuDuelLeague(osuAccounts[i].osuDuelStarRating).color,
							osuName: osuAccounts[i].osuName,
							osuUserId: osuAccounts[i].osuUserId,
							duelRating: osuAccounts[i].osuDuelStarRating,
							noModDuelStarRating: osuAccounts[i].osuNoModDuelStarRating,
							hiddenDuelStarRating: osuAccounts[i].osuHiddenDuelStarRating,
							hardRockDuelStarRating: osuAccounts[i].osuHardRockDuelStarRating,
							doubleTimeDuelStarRating: osuAccounts[i].osuDoubleTimeDuelStarRating,
							freeModDuelStarRating: osuAccounts[i].osuFreeModDuelStarRating,
							duelProvisional: osuAccounts[i].osuDuelProvisional,
							duelOutdated: osuAccounts[i].osuDuelOutdated,
							verified: osuAccounts[i].osuVerified,
							osuRank: osuAccounts[i].osuRank,
						};

						leaderboardData.push(dataset);
					} else {
						let dataset = {
							name: osuAccounts[i].osuName,
							value: `${Math.round(osuAccounts[i].osuDuelStarRating * 1000) / 1000}*`,
							color: getOsuDuelLeague(osuAccounts[i].osuDuelStarRating).color,
							osuName: osuAccounts[i].osuName,
							osuUserId: osuAccounts[i].osuUserId,
							duelRating: osuAccounts[i].osuDuelStarRating,
							noModDuelStarRating: osuAccounts[i].osuNoModDuelStarRating,
							hiddenDuelStarRating: osuAccounts[i].osuHiddenDuelStarRating,
							hardRockDuelStarRating: osuAccounts[i].osuHardRockDuelStarRating,
							doubleTimeDuelStarRating: osuAccounts[i].osuDoubleTimeDuelStarRating,
							freeModDuelStarRating: osuAccounts[i].osuFreeModDuelStarRating,
							duelProvisional: osuAccounts[i].osuDuelProvisional,
							duelOutdated: osuAccounts[i].osuDuelOutdated,
							verified: osuAccounts[i].osuVerified,
							osuRank: osuAccounts[i].osuRank,
						};

						leaderboardData.push(dataset);
					}
				}

				let totalPages = Math.floor(leaderboardData.length / leaderboardEntriesPerPage) + 1;

				let page;

				if (interaction.options._hoistedOptions && interaction.options._hoistedOptions[0] && interaction.options._hoistedOptions[0].value) {
					page = Math.abs(parseInt(interaction.options._hoistedOptions[0].value));
				}

				if (page && page > totalPages) {
					page = totalPages;
				}

				if (!page && leaderboardData.length > 150) {
					page = 1;
					if (authorPlacement) {
						page = Math.floor(authorPlacement / leaderboardEntriesPerPage) + 1;
					}
				}

				if (totalPages === 1) {
					page = null;
				}

				let guildName = 'Global';

				if (interaction.guild) {
					guildName = `${interaction.guild.name}'s`;
				}

				let filename = `osu-duelrating-leaderboard-${interaction.user.id}-${guildName}.png`;

				if (page) {
					filename = `osu-duelrating-leaderboard-${interaction.user.id}-${guildName}-page${page}.png`;
				}

				let csvFiles = [];

				if (interaction.id && interaction.options.getBoolean('csv')) {
					let csvData = [];

					for (let i = 0; i < leaderboardData.length; i++) {
						csvData.push({
							rank: i + 1,
							osuUserId: leaderboardData[i].osuUserId,
							osuName: leaderboardData[i].osuName,
							osuRank: leaderboardData[i].osuRank,
							duelRating: leaderboardData[i].duelRating,
							noModDuelStarRating: leaderboardData[i].noModDuelStarRating,
							hiddenDuelStarRating: leaderboardData[i].hiddenDuelStarRating,
							hardRockDuelStarRating: leaderboardData[i].hardRockDuelStarRating,
							doubleTimeDuelStarRating: leaderboardData[i].doubleTimeDuelStarRating,
							freeModDuelStarRating: leaderboardData[i].freeModDuelStarRating,
							duelProvisional: leaderboardData[i].duelProvisional,
							duelOutdated: leaderboardData[i].duelOutdated,
							verified: leaderboardData[i].verified,
						});
					}

					let data = [];
					for (let i = 0; i < csvData.length; i++) {
						data.push(csvData[i]);

						if (i % 10000 === 0 && i > 0 || csvData.length - 1 === i) {
							let csv = new ObjectsToCsv(data);
							csv = await csv.toString();
							// eslint-disable-next-line no-undef
							const buffer = Buffer.from(csv);
							//Create as an attachment
							// eslint-disable-next-line no-undef
							csvFiles.push(new Discord.AttachmentBuilder(buffer, { name: `duelRatings${csvFiles.length.toString().padStart(2, '0')}.csv` }));

							data = [];
						}
					}
				}

				const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${guildName} osu! Duel Star Rating leaderboard`, filename, page);

				let files = [attachment];

				if (csvFiles.length > 0) {
					files = files.concat(csvFiles);
				}

				let serverHint = '';

				if (interaction.guild) {
					serverHint = ' from the server';
				}

				//Send attachment
				let leaderboardMessage = await interaction.channel.send({ content: `The leaderboard consists of all players${serverHint} that have their osu! account connected to the bot.${messageToAuthor}\nUse </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> to connect your osu! account.\nData is being updated once a day or when </osu-duel rating:${interaction.client.slashCommandData.find(command => command.name === 'osu-duel').id}> is being used.`, files: files });

				if (page) {
					if (page > 1) {
						await leaderboardMessage.react('◀️');
					}

					if (page < totalPages) {
						await leaderboardMessage.react('▶️');
					}
				}
			} else if (interaction.options._subcommand === 'data') {
				try {
					await interaction.deferReply({ ephemeral: true });
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
						console.error(error);
					}
					const timestamps = interaction.client.cooldowns.get(this.name);
					timestamps.delete(interaction.user.id);
					return;
				}

				let osuUser = {
					id: null,
					name: null,
				};

				if (interaction.options._hoistedOptions[0]) {
					//Get the user by the argument given
					if (interaction.options._hoistedOptions[0].value.startsWith('<@') && interaction.options._hoistedOptions[0].value.endsWith('>')) {
						logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers data');
						const discordUser = await DBDiscordUsers.findOne({
							attributes: ['osuUserId', 'osuName'],
							where: {
								userId: interaction.options._hoistedOptions[0].value.replace('<@', '').replace('>', '').replace('!', '')
							},
						});

						if (discordUser && discordUser.osuUserId) {
							osuUser.id = discordUser.osuUserId;
							osuUser.name = discordUser.osuName;
						} else {
							return await interaction.editReply({ content: `\`${interaction.options._hoistedOptions[0].value.replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`, ephemeral: true });
						}
					} else {
						osuUser.id = getIDFromPotentialOsuLink(interaction.options._hoistedOptions[0].value);
					}
				} else {
					//Try to get the user by the message if no argument given
					msg = await populateMsgFromInteraction(interaction);
					const commandConfig = await getOsuUserServerMode(msg, []);
					const commandUser = commandConfig[0];

					if (commandUser && commandUser.osuUserId) {
						osuUser.id = commandUser.osuUserId;
						osuUser.name = commandUser.osuName;
					} else {
						const userDisplayName = await getMessageUserDisplayname(msg);
						osuUser.name = userDisplayName;
					}
				}

				if (!osuUser.name) {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					// eslint-disable-next-line no-undef
					process.send('osu!API');
					const user = await osuApi.getUser({ u: osuUser.id, m: 0 })
						.catch(err => {
							if (err.message !== 'Not found') {
								console.error(err);
							}
						});

					if (!user) {
						return await interaction.editReply({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\`.`, ephemeral: true });
					}

					osuUser.id = user.id;
					osuUser.name = user.name;
				}

				let userDuelStarRating = null;
				for (let i = 0; i < 5 && !userDuelStarRating; i++) {
					try {
						userDuelStarRating = await getUserDuelStarRating({ osuUserId: osuUser.id, client: interaction.client, forceUpdate: true });
					} catch (e) {
						if (i === 4) {
							if (e === 'No standard plays') {
								return interaction.editReply(`Could not find any standard plays for user \`${osuUser.name.replace(/`/g, '')}\`.\nPlease try again later.`);
							} else {
								return interaction.editReply('The API seems to be running into errors right now.\nPlease try again later.');
							}
						} else {
							await pause(15000);
						}
					}
				}

				//Create all the output files
				let files = [];

				let stepData = [
					userDuelStarRating.stepData.NM,
					userDuelStarRating.stepData.HD,
					userDuelStarRating.stepData.HR,
					userDuelStarRating.stepData.DT,
					userDuelStarRating.stepData.FM
				];

				for (let i = 0; i < stepData.length; i++) {
					stepData[i].sort((a, b) => a.step - b.step);

					for (let j = 0; j < stepData[i].length; j++) {
						stepData[i][j] = `${stepData[i][j].step.toFixed(1)}*: ${(Math.round(stepData[i][j].averageWeight * 1000) / 1000).toFixed(3)} weight`;
					}

					if (i === 0) {
						stepData[i] = 'NM Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 1) {
						stepData[i] = 'HD Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 2) {
						stepData[i] = 'HR Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 3) {
						stepData[i] = 'DT Starrating Weights:\n' + stepData[i].join('\n');
					} else if (i === 4) {
						stepData[i] = 'FM Starrating Weights:\n' + stepData[i].join('\n');
					}
				}

				//Get the multiplayer matches
				let multiScores = [
					userDuelStarRating.scores.NM,
					userDuelStarRating.scores.HD,
					userDuelStarRating.scores.HR,
					userDuelStarRating.scores.DT,
					userDuelStarRating.scores.FM
				];

				let multiMatches = [];
				let multiMatchIds = [];

				for (let i = 0; i < multiScores.length; i++) {
					for (let j = 0; j < multiScores[i].length; j++) {
						if (!multiMatchIds.includes(multiScores[i][j].matchId)) {
							multiMatches.push({ matchId: multiScores[i][j].matchId, matchName: multiScores[i][j].matchName, matchStartDate: multiScores[i][j].matchStartDate });
							multiMatchIds.push(multiScores[i][j].matchId);
						}
					}
				}

				multiMatches.sort((a, b) => parseInt(b.matchId) - parseInt(a.matchId));

				let hideQualifiers = new Date();
				hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

				for (let i = 0; i < multiMatches.length; i++) {
					try {
						let date = new Date(multiMatches[i].matchStartDate);

						if (date > hideQualifiers && multiMatches[i].matchName.toLowerCase().includes('qualifier')) {
							multiMatches[i].matchId = `XXXXXXXXX (hidden for ${daysHidingQualifiers} days)`;
						}

						multiMatches[i] = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${multiMatches[i].matchName} ----- https://osu.ppy.sh/community/matches/${multiMatches[i].matchId}`;
					} catch (e) {
						multiMatches[i] = 'Error';
						console.error(e, multiMatches[i]);
					}
				}

				let scores = [
					userDuelStarRating.scores.NM,
					userDuelStarRating.scores.HD,
					userDuelStarRating.scores.HR,
					userDuelStarRating.scores.DT,
					userDuelStarRating.scores.FM
				];

				// Add all expected scores to an array
				let expectedScores = [];
				let labels = [];
				for (let i = 0; i < scores.length; i++) {
					let expectedScoresArray = [];
					for (let j = 0; j < scores[i].length; j++) {
						if (!labels.includes(j + 1)) {
							labels.push(j + 1);
						}
						expectedScoresArray.push(scores[i][j].expectedRating);
					}

					// Sort the array
					expectedScoresArray.sort((a, b) => b - a);

					expectedScores.push(expectedScoresArray);
				}

				const data = {
					labels: labels,
					datasets: [
						{
							label: 'Expected Rating (NM only)',
							data: expectedScores[0],
							borderColor: 'rgb(54, 162, 235)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Expected Rating (HD only)',
							data: expectedScores[1],
							borderColor: 'rgb(255, 205, 86)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Expected Rating (HR only)',
							data: expectedScores[2],
							borderColor: 'rgb(255, 99, 132)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Expected Rating (DT only)',
							data: expectedScores[3],
							borderColor: 'rgb(153, 102, 255)',
							fill: false,
							tension: 0.4
						}, {
							label: 'Expected Rating (FM only)',
							data: expectedScores[4],
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
								text: 'Expected Rating for each score',
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
									text: '# best',
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
									text: 'Expected rating',
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

				const width = 1500; //px
				const height = 750; //px
				const canvasRenderService = new ChartJSNodeCanvas({ width, height });

				const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

				const attachment = new Discord.AttachmentBuilder(imageBuffer, { name: 'expectedScores.png' });

				files.push(attachment);

				for (let i = 0; i < scores.length; i++) {
					scores[i].sort((a, b) => a.score - b.score);

					for (let j = 0; j < scores[i].length; j++) {
						let outlierText = '';
						if (scores[i][j].outlier) {
							outlierText = ' [outlier - not counted]';
						}
						let date = new Date(scores[i][j].matchStartDate);
						scores[i][j] = `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${Math.round(scores[i][j].score)} points (${(Math.round(scores[i][j].weight * 1000) / 1000).toFixed(3)}): ${(Math.round(scores[i][j].starRating * 100) / 100).toFixed(2)}* | Expected SR: ${scores[i][j].expectedRating.toFixed(2)} | https://osu.ppy.sh/b/${scores[i][j].beatmapId} | Match: https://osu.ppy.sh/mp/${scores[i][j].matchId} | ${outlierText}`;
					}

					if (i === 0) {
						scores[i] = 'NM Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 1) {
						scores[i] = 'HD Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 2) {
						scores[i] = 'HR Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 3) {
						scores[i] = 'DT Scores & Weights:\n' + scores[i].join('\n');
					} else if (i === 4) {
						scores[i] = 'FM Scores & Weights:\n' + scores[i].join('\n');
					}
				}

				// eslint-disable-next-line no-undef
				scores = new Discord.AttachmentBuilder(Buffer.from(scores.join('\n\n'), 'utf-8'), { name: `osu-duel-scores-and-weights-${osuUser.id}.txt` });
				files.push(scores);

				// eslint-disable-next-line no-undef
				stepData = new Discord.AttachmentBuilder(Buffer.from(stepData.join('\n\n'), 'utf-8'), { name: `osu-duel-star-rating-group-weights-${osuUser.id}.txt` });
				files.push(stepData);

				// eslint-disable-next-line no-undef
				multiMatches = new Discord.AttachmentBuilder(Buffer.from(multiMatches.join('\n'), 'utf-8'), { name: `osu-duel-multimatches-${osuUser.id}.txt` });
				files.push(multiMatches);

				let explaination = [];
				explaination.push('**Hello!**');
				explaination.push('You will likely be overwhelmed by all the info that just popped up.');
				explaination.push('If you are just here to get a rough explaination of how the calculation works, here is a tldr:');
				explaination.push('');
				explaination.push('**TL;DR:**');
				explaination.push('The star rating is calculated based on your last 35 tournament score v2 scores for each modpool.');
				explaination.push('The star rating can only drop by 0.025* per month. If it is limited it will be indicated by a ~ next to the star rating.');
				explaination.push('You can see the scores taken into account in the first file attached.');
				explaination.push('You can see the starratings and how they are evaluated in the second file. (The higher the weight the more effect the star rating has on the overall star rating)');
				explaination.push('You can see the matches where the scores are from in the third file.');
				explaination.push('');
				explaination.push('**In Depth Explaination:**');
				explaination.push('Relevant Star Rating Change:');
				explaination.push('HD maps always get a star rating buff in the calculations. These depend on the AR of the map.');
				explaination.push('AR7.5 HD will count as a +0.75 SR buff (maximum) and AR9 will count as a +0.2 SR buff (minimum). Everything in between is rising linearly.');
				explaination.push('');
				explaination.push('1. Step:');
				explaination.push('The bot grabs the last 35 tournament score v2 scores for each modpool. (Limited to unique ranked maps)');
				explaination.push('The limit exists to not evaluate the same maps twice, to limit the API calls to some extend and to get relatively recent data without losing accuracy due to limiting it to a timestamp.');
				explaination.push('');
				explaination.push('2. Step:');
				explaination.push('After doing some adaptions to counter mods effects on the score each score will be assigned a weight using a bell curve with the highest weight at 350k; dropping lower on both sides to not get too hard and not too easy maps.');
				explaination.push('You can find the weight graph here: <https://www.desmos.com/calculator/netnkpeupv>');
				explaination.push('');
				await interaction.editReply({ content: explaination.join('\n'), ephemeral: true });
				explaination = [];
				explaination.push('3. Step:');
				explaination.push('Each score and its weight will be put into a star rating step. (A 5.0 map will be put into the 4.8, 4.9, 5.0, 5.1 and 5.2 steps)');
				explaination.push('Each step will average the weights of their scores and will calculate a weighted star rating (e.g. 4.8 stars with an average weight of 0.5 will be a weighted star rating of 2.4)');
				explaination.push('The weighted star ratings of each step will now be summed up and divided by all the average weights of each step summed up.');
				explaination.push('');
				explaination.push('4. Step:');
				explaination.push('The last 35 scores from that modpool will now once again effect the star rating.');
				explaination.push('For each score there will be an expected score calculated using this formula which is based on the starrating itself: <https://www.desmos.com/calculator/oae69zr9ze> (cap of 950k upwards | 20k downwards)');
				explaination.push('The difference between the score and the expected score will now be calculated.');
				explaination.push('The difference now decides the star rating change using this formula: <https://www.desmos.com/calculator/zlckiq6hgx> (cap of 1*)');
				explaination.push('Each star rating change will now be applied to the previously calculated star rating using a weight. (1x for the most recent score, 0.98 for the second most recent score, 0.96 for the third most recent score, etc.)');
				explaination.push('After all scores applied their effect on the starrating this will result in the final modpool star rating.');
				explaination.push('');
				explaination.push('5. Step:');
				explaination.push('The total star rating will be calculated relative to how many maps of each modpool were played in the last 100 score v2 tournament scores.');
				explaination.push('This will allow a player that mainly plays HD to have their HD modpool star rating have more impact on the total star rating than a player that mostly plays NM. This is being done because in a real match the HD player is more likely to play HD than the NM player and will therefore be more affected by their HD skill.');
				explaination.push('');
				explaination.push('**What does Provisional mean?**');
				explaination.push('A provisional rank is given if there is barely enough data to give a relatively reliable star rating.');
				explaination.push('');
				explaination.push('**What does outdated mean?**');
				explaination.push('An outdated rank means that there have not been equal to or more than 5 scores in the past 6 months.');

				return await interaction.followUp({ content: explaination.join('\n'), files: files, ephemeral: true });
			} else if (interaction.options._subcommand === 'rating-spread') {
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

				const width = 1500; //px
				const height = 750; //px
				const canvasRenderService = new ChartJSNodeCanvas({ width, height });

				let labels = ['Bronze 1', 'Bronze 2', 'Bronze 3', 'Silver 1', 'Silver 2', 'Silver 3', 'Gold 1', 'Gold 2', 'Gold 3', 'Platinum 1', 'Platinum 2', 'Platinum 3', 'Diamond 1', 'Diamond 2', 'Diamond 3', 'Master'];
				let colors = ['#F07900', '#F07900', '#F07900', '#B5B5B5', '#B5B5B5', '#B5B5B5', '#FFEB47', '#FFEB47', '#FFEB47', '#1DD9A5', '#1DD9A5', '#1DD9A5', '#49B0FF', '#49B0FF', '#49B0FF', '#FFAEFB'];
				let leagueAmounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

				let osuAccounts = [];
				let discordUsers = [];

				if (interaction.guild) {
					try {
						let members = await interaction.guild.members.fetch({ time: 300000 })
							.catch((err) => {
								throw new Error(err);
							});

						members = members.map(member => member.id);

						logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-spread');
						discordUsers = discordUsers = await DBDiscordUsers.findAll({
							attributes: ['userId', 'osuUserId', 'osuName', 'osuVerified', 'osuDuelStarRating'],
							where: {
								userId: {
									[Op.in]: members
								},
								osuUserId: {
									[Op.not]: null,
								},
								osuDuelStarRating: {
									[Op.not]: null,
								},
								osuDuelProvisional: {
									[Op.not]: true,
								}
							},
						});
					} catch (e) {
						if (e.message !== 'Members didn\'t arrive in time.') {
							console.error('commands/osu-duel.js | rating spread', e);
							return;
						}
					}
				} else {
					logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-spread 2');
					discordUsers = await DBDiscordUsers.findAll({
						attributes: ['userId', 'osuUserId', 'osuName', 'osuVerified', 'osuDuelStarRating'],
						where: {
							osuUserId: {
								[Op.not]: null,
							},
							osuDuelStarRating: {
								[Op.not]: null,
							},
							osuDuelProvisional: {
								[Op.not]: true,
							}
						},
					});
				}

				for (let i = 0; i < discordUsers.length; i++) {
					osuAccounts.push({
						userId: discordUsers[i].userId,
						osuUserId: discordUsers[i].osuUserId,
						osuName: discordUsers[i].osuName,
						osuVerified: discordUsers[i].osuVerified,
						osuDuelStarRating: parseFloat(discordUsers[i].osuDuelStarRating),
					});

					leagueAmounts[labels.indexOf(getOsuDuelLeague(parseFloat(discordUsers[i].osuDuelStarRating)).name)]++;
				}

				let finalAmounts = [];
				for (let i = 0; i < labels.length; i++) {
					let amountArray = [];
					for (let j = 0; j < labels.length; j++) {
						amountArray.push(0);
					}
					amountArray[i] = leagueAmounts[i];
					finalAmounts.push(amountArray);
				}

				let datasets = [];

				for (let i = 0; i < labels.length; i++) {
					datasets.push({
						label: labels[i],
						data: finalAmounts[i],
						backgroundColor: colors[i],
						fill: true,
					});
				}

				const data = {
					labels: labels,
					datasets: datasets,
				};

				const configuration = {
					type: 'bar',
					data: data,
					options: {
						plugins: {
							title: {
								display: true,
								text: 'Rating Spread',
								color: '#FFFFFF',
							},
							legend: {
								labels: {
									color: '#FFFFFF',
								}
							},
						},
						responsive: true,
						scales: {
							x: {
								stacked: true,
								title: {
									display: true,
									text: 'Time',
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
								stacked: true,
								grid: {
									color: '#8F8F8F'
								},
								ticks: {
									color: '#FFFFFF',
								},
							}
						}
					}
				};

				const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

				const attachment = new Discord.AttachmentBuilder(imageBuffer, { name: 'osu-league-spread.png' });

				let guildName = 'Global';

				if (interaction.guild) {
					guildName = `${interaction.guild.name}'s`;
				}

				interaction.editReply({ content: `${guildName} osu! Duel League Rating Spread`, files: [attachment] });
			} else if (interaction.options._subcommand === 'rating-updates') {
				try {
					await interaction.deferReply({ ephemeral: true });
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
						console.error(error);
					}
					const timestamps = interaction.client.cooldowns.get(this.name);
					timestamps.delete(interaction.user.id);
					return;
				}

				let enable = false;

				if (interaction.options._hoistedOptions[0].value === true) {
					enable = true;
				}

				logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers rating-updates');
				let discordUser = await DBDiscordUsers.findOne({
					attributes: ['id', 'osuUserId', 'osuDuelRatingUpdates'],
					where: {
						userId: interaction.user.id,
					},
				});

				if (!discordUser || !discordUser.osuUserId) {
					return interaction.editReply('You must link your osu! account before using this command.');
				}

				if (enable) {
					if (discordUser.osuDuelRatingUpdates) {
						return interaction.editReply('You are already receiving osu! Duel rating updates.');
					}

					discordUser.osuDuelRatingUpdates = true;
					await discordUser.save();

					return interaction.editReply('You will now receive osu! Duel rating updates.');
				}

				if (!discordUser.osuDuelRatingUpdates) {
					return interaction.editReply('You are not receiving osu! Duel rating updates.');
				}

				discordUser.osuDuelRatingUpdates = false;
				await discordUser.save();

				return interaction.editReply('You will no longer receive osu! Duel rating updates.');
			} else if (interaction.options._subcommand === 'queue1v1') {
				try {
					await interaction.deferReply({ ephemeral: true });
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
						console.error(error);
					}
					const timestamps = interaction.client.cooldowns.get(this.name);
					timestamps.delete(interaction.user.id);
					return;
				}

				msg = await populateMsgFromInteraction(interaction);

				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.editReply(`You don't have your osu! account connected and verified.\nPlease connect your account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
				}

				logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers queue1v1 1');
				let existingQueueTasks = await DBProcessQueue.findAll({
					attributes: ['additions'],
					where: {
						task: 'duelQueue1v1',
					},
				});

				for (let i = 0; i < existingQueueTasks.length; i++) {
					const osuUserId = existingQueueTasks[i].additions.split(';')[0];

					if (osuUserId === commandUser.osuUserId) {
						let ownRating = parseFloat(existingQueueTasks[i].additions.split(';')[1]);
						let tasksInReach = existingQueueTasks.filter((task) => {
							return Math.abs(ownRating - parseFloat(task.additions.split(';')[1])) < 1;
						});

						return await interaction.editReply(`You are already in the queue for a 1v1 duel. There are ${existingQueueTasks.length - 1} opponents in the queue (${tasksInReach.length - 1} in reach).`);
					}
				}

				let ownStarRating = 5;
				try {
					await interaction.editReply('Processing Duel Rating...');
					ownStarRating = await getUserDuelStarRating({ osuUserId: commandUser.osuUserId, client: interaction.client });

					ownStarRating = ownStarRating.total;
				} catch (e) {
					if (e !== 'No standard plays') {
						console.error(e);
					}
				}

				//Check again in case the cooldown had passed and it was triggered again
				logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers queue1v1 2');
				existingQueueTasks = await DBProcessQueue.findAll({
					attributes: ['additions'],
					where: {
						task: 'duelQueue1v1',
					},
				});

				for (let i = 0; i < existingQueueTasks.length; i++) {
					const osuUserId = existingQueueTasks[i].additions.split(';')[0];

					if (osuUserId === commandUser.osuUserId) {
						let ownRating = parseFloat(existingQueueTasks[i].additions.split(';')[1]);
						let tasksInReach = existingQueueTasks.filter((task) => {
							return Math.abs(ownRating - parseFloat(task.additions.split(';')[1])) < 1;
						});

						return await interaction.editReply(`You are already in the queue for a 1v1 duel. There are ${existingQueueTasks.length - 1} opponents in the queue (${tasksInReach.length - 1} in reach).`);
					}
				}

				logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers queue1v1 create');
				await DBProcessQueue.create({
					guildId: 'none',
					task: 'duelQueue1v1',
					additions: `${commandUser.osuUserId};${ownStarRating};0.25`,
					date: new Date(),
					priority: 9
				});

				updateQueueChannels(interaction.client);

				let tasksInReach = existingQueueTasks.filter((task) => {
					return Math.abs(ownStarRating - parseFloat(task.additions.split(';')[1])) < 1;
				});

				return await interaction.editReply(`You are now queued up for a 1v1 duel. There are ${existingQueueTasks.length} opponents in the queue (${tasksInReach.length} in reach).`);
			} else if (interaction.options._subcommand === 'queue1v1-leave') {
				try {
					await interaction.deferReply({ ephemeral: true });
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
						console.error(error);
					}
					const timestamps = interaction.client.cooldowns.get(this.name);
					timestamps.delete(interaction.user.id);
					return;
				}

				msg = await populateMsgFromInteraction(interaction);

				const commandConfig = await getOsuUserServerMode(msg, []);
				const commandUser = commandConfig[0];

				if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
					return await interaction.editReply(`You don't have your osu! account connected and verified.\nPlease connect your account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
				}

				logDatabaseQueries(4, 'commands/osu-duel.js DBDiscordUsers queue1v1-leave');
				let existingQueueTasks = await DBProcessQueue.findAll({
					attributes: ['id', 'additions'],
					where: {
						task: 'duelQueue1v1',
					},
				});

				for (let i = 0; i < existingQueueTasks.length; i++) {
					const osuUserId = existingQueueTasks[i].additions.split(';')[0];

					if (osuUserId === commandUser.osuUserId) {
						await existingQueueTasks[i].destroy();
						updateQueueChannels(interaction.client);
						return await interaction.editReply('You have been removed from the queue for a 1v1 duel.');
					}
				}

				return await interaction.editReply('You are not in the queue for a 1v1 duel.');
			}
		}
	},
};