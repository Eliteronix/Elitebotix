const { DBOsuTrackingUsers, DBDiscordUsers, DBOsuGuildTrackers } = require('../dbObjects');
const osu = require('node-osu');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'osu-track',
	description: 'Sends info about the scores achieved by the user',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-track')
		.setNameLocalizations({
			'de': 'osu-track',
			'en-GB': 'osu-track',
			'en-US': 'osu-track',
		})
		.setDescription('Tracks new scores/matches set by the specified users / acronym')
		.setDescriptionLocalizations({
			'de': 'Verfolgt neue Scores/Matches, die von den angegebenen Spielern/Akronym gesetzt/gespielt wurden',
			'en-GB': 'Tracks new scores/matches set by the specified users / acronym',
			'en-US': 'Tracks new scores/matches set by the specified users / acronym',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand
				.setName('enable')
				.setNameLocalizations({
					'de': 'aktivieren',
					'en-GB': 'enable',
					'en-US': 'enable',
				})
				.setDescription('Lets you add a new user to track')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht es dir, einen neuen Spieler hinzuzufügen, der verfolgt werden soll',
					'en-GB': 'Lets you add a new user to track',
					'en-US': 'Lets you add a new user to track',
				})
				.addStringOption(option =>
					option
						.setName('usernames')
						.setNameLocalizations({
							'de': 'nutzernamen',
							'en-GB': 'usernames',
							'en-US': 'usernames',
						})
						.setDescription('The user(s) to track (separate them with a \',\')')
						.setDescriptionLocalizations({
							'de': 'Der/die Spieler, die verfolgt werden sollen (trenne sie mit einem \',\')',
							'en-GB': 'The user(s) to track (separate them with a \',\')',
							'en-US': 'The user(s) to track (separate them with a \',\')',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('topplays')
						.setNameLocalizations({
							'de': 'topplays',
							'en-GB': 'topplays',
							'en-US': 'topplays',
						})
						.setDescription('Use one of the autofilled options or start typing to show more options')
						.setDescriptionLocalizations({
							'de': 'Verwende eine der vorgeschlagenen Optionen oder beginne zu tippen, um mehr Optionen anzuzeigen',
							'en-GB': 'Use one of the autofilled options or start typing to show more options',
							'en-US': 'Use one of the autofilled options or start typing to show more options',
						})
						.setRequired(false)
						.setAutocomplete(true)
				)
				.addStringOption(option =>
					option
						.setName('leaderboardplays')
						.setNameLocalizations({
							'de': 'ranglistenplays',
							'en-GB': 'leaderboardplays',
							'en-US': 'leaderboardplays',
						})
						.setDescription('Which modes should be tracked')
						.setDescriptionLocalizations({
							'de': 'Welche Modi sollen verfolgt werden',
							'en-GB': 'Which modes should be tracked',
							'en-US': 'Which modes should be tracked',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'osu! only', value: 'o' },
							{ name: 'taiko only', value: 't' },
							{ name: 'catch only', value: 'c' },
							{ name: 'mania only', value: 'm' },
							{ name: 'osu! & taiko', value: 'ot' },
							{ name: 'osu! & catch', value: 'oc' },
							{ name: 'osu! & mania', value: 'om' },
							{ name: 'taiko & catch', value: 'tc' },
							{ name: 'taiko & mania', value: 'tm' },
							{ name: 'catch & mania', value: 'cm' },
							{ name: 'osu!, taiko & catch', value: 'otc' },
							{ name: 'osu!, taiko & mania', value: 'otm' },
							{ name: 'osu!, catch & mania', value: 'ocm' },
							{ name: 'taiko, catch & mania', value: 'tcm' },
							{ name: 'osu!, taiko, catch & mania', value: 'otcm' },
						)
				)
				.addStringOption(option =>
					option
						.setName('ameobea')
						.setNameLocalizations({
							'de': 'ameobea',
							'en-GB': 'ameobea',
							'en-US': 'ameobea',
						})
						.setDescription('Which modes should be updated for ameobea.me/osutrack/')
						.setDescriptionLocalizations({
							'de': 'Welche Modi sollen für ameobea.me/osutrack/ aktualisiert werden',
							'en-GB': 'Which modes should be updated for ameobea.me/osutrack/',
							'en-US': 'Which modes should be updated for ameobea.me/osutrack/',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'osu! only', value: 'o' },
							{ name: 'taiko only', value: 't' },
							{ name: 'catch only', value: 'c' },
							{ name: 'mania only', value: 'm' },
							{ name: 'osu! & taiko', value: 'ot' },
							{ name: 'osu! & catch', value: 'oc' },
							{ name: 'osu! & mania', value: 'om' },
							{ name: 'taiko & catch', value: 'tc' },
							{ name: 'taiko & mania', value: 'tm' },
							{ name: 'catch & mania', value: 'cm' },
							{ name: 'osu!, taiko & catch', value: 'otc' },
							{ name: 'osu!, taiko & mania', value: 'otm' },
							{ name: 'osu!, catch & mania', value: 'ocm' },
							{ name: 'taiko, catch & mania', value: 'tcm' },
							{ name: 'osu!, taiko, catch & mania', value: 'otcm' },
						)
				)
				.addBooleanOption(option =>
					option
						.setName('showameobeaupdate')
						.setNameLocalizations({
							'de': 'ameobeaupdate',
							'en-GB': 'ameobeaupdate',
							'en-US': 'ameobeaupdate',
						})
						.setDescription('Should messages be sent when ameobea is updated')
						.setDescriptionLocalizations({
							'de': 'Sollen Nachrichten gesendet werden, wenn ameobea aktualisiert wurde',
							'en-GB': 'Should messages be sent when ameobea is updated',
							'en-US': 'Should messages be sent when ameobea is updated',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option
						.setName('medals')
						.setNameLocalizations({
							'de': 'medaillen',
							'en-GB': 'medals',
							'en-US': 'medals',
						})
						.setDescription('Should achieved medals be tracked')
						.setDescriptionLocalizations({
							'de': 'Sollen erreichte Medaillen verfolgt werden',
							'en-GB': 'Should achieved medals be tracked',
							'en-US': 'Should achieved medals be tracked',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option
						.setName('duelrating')
						.setNameLocalizations({
							'de': 'duelrating',
							'en-GB': 'duelrating',
							'en-US': 'duelrating',
						})
						.setDescription('Should duel rating changes be tracked')
						.setDescriptionLocalizations({
							'de': 'Sollen Duel Rating Änderungen verfolgt werden',
							'en-GB': 'Should duel rating changes be tracked',
							'en-US': 'Should duel rating changes be tracked',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option
						.setName('matchactivity')
						.setNameLocalizations({
							'de': 'matchaktivität',
							'en-GB': 'matchactivity',
							'en-US': 'matchactivity',
						})
						.setDescription('Should matches be tracked')
						.setDescriptionLocalizations({
							'de': 'Sollen Matches verfolgt werden',
							'en-GB': 'Should matches be tracked',
							'en-US': 'Should matches be tracked',
						})
						.setRequired(false)
						.addChoices(
							{ name: 'Notify on matches', value: 'matches' },
							{ name: 'Notify on matches and auto matchtrack', value: 'matches (auto matchtrack)' },
						)
				)
				.addStringOption(option =>
					option
						.setName('acronym')
						.setNameLocalizations({
							'de': 'akronym',
							'en-GB': 'acronym',
							'en-US': 'acronym',
						})
						.setDescription('The acronyms to track (separate with \',\')')
						.setDescriptionLocalizations({
							'de': 'Die Akronyme, die verfolgt werden sollen (durch Komma trennen)',
							'en-GB': 'The acronyms to track (separate with \',\')',
							'en-US': 'The acronyms to track (separate with \',\')',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tourneyenable')
				.setNameLocalizations({
					'de': 'turnieraktivieren',
					'en-GB': 'tourneyenable',
					'en-US': 'tourneyenable',
				})
				.setDescription('Lets you add an acronym to track')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht es dir ein Akronym hinzuzufügen, das verfolgt werden soll',
					'en-GB': 'Lets you add an acronym to track',
					'en-US': 'Lets you add an acronym to track',
				})
				.addStringOption(option =>
					option
						.setName('acronym')
						.setNameLocalizations({
							'de': 'akronym',
							'en-GB': 'acronym',
							'en-US': 'acronym',
						})
						.setDescription('The acronym to track')
						.setDescriptionLocalizations({
							'de': 'Das Akronym, das verfolgt werden soll',
							'en-GB': 'The acronym to track',
							'en-US': 'The acronym to track',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('matchactivity')
						.setNameLocalizations({
							'de': 'matchaktivität',
							'en-GB': 'matchactivity',
							'en-US': 'matchactivity',
						})
						.setDescription('Should matches be tracked')
						.setDescriptionLocalizations({
							'de': 'Sollen Matches verfolgt werden',
							'en-GB': 'Should matches be tracked',
							'en-US': 'Should matches be tracked',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Notify on matches', value: 'matches' },
							{ name: 'Notify on matches and auto matchtrack', value: 'matches (auto matchtrack)' },
						)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disable')
				.setNameLocalizations({
					'de': 'deaktivieren',
					'en-GB': 'disable',
					'en-US': 'disable',
				})
				.setDescription('Lets you stop tracking a user')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht es dir einen Benutzer nicht mehr zu verfolgen',
					'en-GB': 'Lets you stop tracking a user',
					'en-US': 'Lets you stop tracking a user',
				})
				.addStringOption(option =>
					option
						.setName('usernames')
						.setNameLocalizations({
							'de': 'nutzernamen',
							'en-GB': 'usernames',
							'en-US': 'usernames',
						})
						.setDescription('The user(s) to stop tracking (separate them with a \',\')')
						.setDescriptionLocalizations({
							'de': 'Der/die Benutzer, die nicht mehr verfolgt werden sollen (trenne sie mit einem \',\')',
							'en-GB': 'The user(s) to stop tracking (separate them with a \',\')',
							'en-US': 'The user(s) to stop tracking (separate them with a \',\')',
						})
						.setRequired(true)
				)
				.addBooleanOption(option =>
					option
						.setName('topplays')
						.setNameLocalizations({
							'de': 'topplays',
							'en-GB': 'topplays',
							'en-US': 'topplays',
						})
						.setDescription('Stop tracking top plays')
						.setDescriptionLocalizations({
							'de': 'Stoppt die Verfolgung von Top Plays',
							'en-GB': 'Stop tracking top plays',
							'en-US': 'Stop tracking top plays',
						})
				)
				.addBooleanOption(option =>
					option
						.setName('leaderboardplays')
						.setNameLocalizations({
							'de': 'ranglistenplays',
							'en-GB': 'leaderboardplays',
							'en-US': 'leaderboardplays',
						})
						.setDescription('Stop tracking leaderboard plays')
						.setDescriptionLocalizations({
							'de': 'Stoppt die Verfolgung von Ranglisten Plays',
							'en-GB': 'Stop tracking leaderboard plays',
							'en-US': 'Stop tracking leaderboard plays',
						})
				)
				.addBooleanOption(option =>
					option
						.setName('ameobea')
						.setNameLocalizations({
							'de': 'ameobea',
							'en-GB': 'ameobea',
							'en-US': 'ameobea',
						})
						.setDescription('Stop tracking ameobea updates')
						.setDescriptionLocalizations({
							'de': 'Stoppt die Ameobea Updates',
							'en-GB': 'Stop tracking ameobea updates',
							'en-US': 'Stop tracking ameobea updates',
						})
				)
				.addBooleanOption(option =>
					option
						.setName('showameobeaupdates')
						.setNameLocalizations({
							'de': 'ameobeaupdatesanzeigen',
							'en-GB': 'showameobeaupdates',
							'en-US': 'showameobeaupdates',
						})
						.setDescription('Stop tracking ameobea updates')
						.setDescriptionLocalizations({
							'de': 'Stoppt die Ameobea Updates',
							'en-GB': 'Stop tracking ameobea updates',
							'en-US': 'Stop tracking ameobea updates',
						})
				)
				.addBooleanOption(option =>
					option
						.setName('medals')
						.setNameLocalizations({
							'de': 'medaillen',
							'en-GB': 'medals',
							'en-US': 'medals',
						})
						.setDescription('Stop tracking medals')
						.setDescriptionLocalizations({
							'de': 'Stoppt die Verfolgung von Medaillen',
							'en-GB': 'Stop tracking medals',
							'en-US': 'Stop tracking medals',
						})
				)
				.addBooleanOption(option =>
					option
						.setName('duelrating')
						.setNameLocalizations({
							'de': 'duelrating',
							'en-GB': 'duelrating',
							'en-US': 'duelrating',
						})
						.setDescription('Stop tracking duel rating changes')
						.setDescriptionLocalizations({
							'de': 'Stoppt die Verfolgung von Duel Rating Änderungen',
							'en-GB': 'Stop tracking duel rating changes',
							'en-US': 'Stop tracking duel rating changes',
						})
				)
				.addBooleanOption(option =>
					option
						.setName('matchactivity')
						.setNameLocalizations({
							'de': 'matchaktivität',
							'en-GB': 'matchactivity',
							'en-US': 'matchactivity',
						})
						.setDescription('Stop tracking match activity')
						.setDescriptionLocalizations({
							'de': 'Stoppt die Verfolgung von Match Aktivität',
							'en-GB': 'Stop tracking match activity',
							'en-US': 'Stop tracking match activity',
						})
				)
				.addBooleanOption(option =>
					option
						.setName('acronym')
						.setNameLocalizations({
							'de': 'akronym',
							'en-GB': 'acronym',
							'en-US': 'acronym',
						})
						.setDescription('Stop tracking only these acronyms')
						.setDescriptionLocalizations({
							'de': 'Stoppt die Verfolgung nur dieser Akronyme',
							'en-GB': 'Stop tracking only these acronyms',
							'en-US': 'Stop tracking only these acronyms',
						})
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tourneydisable')
				.setNameLocalizations({
					'de': 'turnierdeaktivieren',
					'en-GB': 'tourneydisable',
					'en-US': 'tourneydisable',
				})
				.setDescription('Lets you remove an acronym to track')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht es dir ein Akronym zu entfernen, das verfolgt werden soll',
					'en-GB': 'Lets you remove an acronym to track',
					'en-US': 'Lets you remove an acronym to track',
				})
				.addStringOption(option =>
					option
						.setName('acronym')
						.setNameLocalizations({
							'de': 'akronym',
							'en-GB': 'acronym',
							'en-US': 'acronym',
						})
						.setDescription('The acronym to stop tracking')
						.setDescriptionLocalizations({
							'de': 'Das Akronym, das nicht mehr verfolgt werden soll',
							'en-GB': 'The acronym to stop tracking',
							'en-US': 'The acronym to stop tracking',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setNameLocalizations({
					'de': 'liste',
					'en-GB': 'list',
					'en-US': 'list',
				})
				.setDescription('Lists all tracked users')
				.setDescriptionLocalizations({
					'de': 'Listet alle verfolgten Benutzer auf',
					'en-GB': 'Lists all tracked users',
					'en-US': 'Lists all tracked users',
				})
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		const options = [
			{ name: 'osu! only', value: '1' },
			{ name: 'taiko only', value: '2' },
			{ name: 'catch only', value: '3' },
			{ name: 'mania only', value: '4' },
			{ name: 'tournaments only', value: '5' },
			{ name: 'osu! & taiko', value: '12' },
			{ name: 'osu! & catch', value: '13' },
			{ name: 'osu! & mania', value: '14' },
			{ name: 'osu! & tournaments', value: '15' },
			{ name: 'taiko & catch', value: '23' },
			{ name: 'taiko & mania', value: '24' },
			{ name: 'taiko & tournaments', value: '25' },
			{ name: 'catch & mania', value: '34' },
			{ name: 'catch & tournaments', value: '35' },
			{ name: 'mania & tournaments', value: '45' },
			{ name: 'osu!, taiko & catch', value: '123' },
			{ name: 'osu!, taiko & mania', value: '124' },
			{ name: 'osu!, taiko & tournaments', value: '125' },
			{ name: 'osu!, catch & mania', value: '134' },
			{ name: 'osu!, catch & tournaments', value: '135' },
			{ name: 'osu!, mania & tournaments', value: '145' },
			{ name: 'taiko, catch & mania', value: '234' },
			{ name: 'taiko, catch & tournaments', value: '235' },
			{ name: 'taiko, mania & tournaments', value: '245' },
			{ name: 'catch, mania & tournaments', value: '345' },
			{ name: 'osu!, taiko, catch & mania', value: '1234' },
			{ name: 'osu!, taiko, catch & tournaments', value: '1235' },
			{ name: 'osu!, taiko, mania & tournaments', value: '1245' },
			{ name: 'osu!, catch, mania & tournaments', value: '1345' },
			{ name: 'taiko, catch, mania & tournaments', value: '2345' },
			{ name: 'osu!, taiko, catch, mania & tournaments', value: '12345' }
		];

		let filtered = options.filter(choice => choice.name.includes(focusedValue));

		filtered = filtered.slice(0, 25);

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice.name, value: choice.value })),
			);
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
		}
	},
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		if (interaction.options.getSubcommand() === 'enable') {
			try {
				await interaction.reply({ content: 'Processing...', ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

			if (interaction.options.getString('topplays') && isNaN(interaction.options.getString('topplays'))) {
				return await interaction.editReply('Please choose one of the autocomplete options for the top plays option.');
			}

			let usernames = interaction.options.getString('usernames');

			usernames = usernames.split(',');
			usernames = usernames.map(username => username.trim());

			for (let i = 0; i < usernames.length; i++) {
				let username = usernames[i];

				//Get the user from the database if possible
				logDatabaseQueries(4, 'commands/osu-track.js DBDiscordUsers 1');
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
						// eslint-disable-next-line no-undef
						process.send('osu!API');
						const user = await osuApi.getUser({ u: username });
						osuUser.osuUserId = user.id;
						osuUser.osuName = user.name;
					} catch (error) {
						console.error(error);
						await interaction.followUp({ content: `Could not find user \`${username.replace(/`/g, '')}\`.`, ephemeral: true });
						continue;
					}
				}

				//Create the timer for checking the user if needed
				logDatabaseQueries(4, 'commands/osu-track.js DBOsuTrackingUsers 1');
				let userTimer = await DBOsuTrackingUsers.findOne({
					where: {
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!userTimer) {
					let nextCheck = new Date();
					nextCheck.setMinutes(nextCheck.getMinutes() + 15);

					logDatabaseQueries(4, 'commands/osu-track.js DBOsuTrackingUsers create');
					userTimer = await DBOsuTrackingUsers.create({
						osuUserId: osuUser.osuUserId,
						nextCheck: nextCheck,
					});
				}

				//Create or update the guild tracker
				logDatabaseQueries(4, 'commands/osu-track.js DBOsuGuildTrackers 1');
				let guildTracker = await DBOsuGuildTrackers.findOne({
					where: {
						guildId: interaction.guild.id,
						channelId: interaction.channel.id,
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!guildTracker) {
					logDatabaseQueries(4, 'commands/osu-track.js DBOsuGuildTrackers create');
					guildTracker = await DBOsuGuildTrackers.create({
						guildId: interaction.guild.id,
						channelId: interaction.channel.id,
						osuUserId: osuUser.osuUserId,
					});
				}

				let topPlays = interaction.options.getString('topplays');

				if (topPlays) {
					if (topPlays.includes('1')) {
						guildTracker.osuTopPlays = true;
					} else {
						guildTracker.osuTopPlays = false;
					}

					if (topPlays.includes('2')) {
						guildTracker.taikoTopPlays = true;
					} else {
						guildTracker.taikoTopPlays = false;
					}

					if (topPlays.includes('3')) {
						guildTracker.catchTopPlays = true;
					} else {
						guildTracker.catchTopPlays = false;
					}

					if (topPlays.includes('4')) {
						guildTracker.maniaTopPlays = true;
					} else {
						guildTracker.maniaTopPlays = false;
					}

					if (topPlays.includes('5')) {
						guildTracker.tournamentTopPlays = true;
					} else {
						guildTracker.tournamentTopPlays = false;
					}
				}

				let leaderboardPlays = interaction.options.getString('leaderboardplays');

				if (leaderboardPlays) {
					if (leaderboardPlays.includes('o')) {
						guildTracker.osuLeaderboard = true;
					} else {
						guildTracker.osuLeaderboard = false;
					}

					if (leaderboardPlays.includes('t')) {
						guildTracker.taikoLeaderboard = true;
					} else {
						guildTracker.taikoLeaderboard = false;
					}

					if (leaderboardPlays.includes('c')) {
						guildTracker.catchLeaderboard = true;
					} else {
						guildTracker.catchLeaderboard = false;
					}

					if (leaderboardPlays.includes('m')) {
						guildTracker.maniaLeaderboard = true;
					} else {
						guildTracker.maniaLeaderboard = false;
					}
				}

				let ameobea = interaction.options.getString('ameobea');

				if (ameobea) {
					if (ameobea.includes('o')) {
						guildTracker.osuAmeobea = true;
					} else {
						guildTracker.osuAmeobea = false;
					}

					if (ameobea.includes('t')) {
						guildTracker.taikoAmeobea = true;
					} else {
						guildTracker.taikoAmeobea = false;
					}

					if (ameobea.includes('c')) {
						guildTracker.catchAmeobea = true;
					} else {
						guildTracker.catchAmeobea = false;
					}

					if (ameobea.includes('m')) {
						guildTracker.maniaAmeobea = true;
					} else {
						guildTracker.maniaAmeobea = false;
					}
				}

				let showAmeobeaUpdates = interaction.options.getBoolean('showameobeaupdate');

				if ((guildTracker.osuAmeobea || guildTracker.taikoAmeobea || guildTracker.catchAmeobea || guildTracker.maniaAmeobea) && showAmeobeaUpdates) {
					guildTracker.showAmeobeaUpdates = showAmeobeaUpdates;
				}

				let medals = interaction.options.getBoolean('medals');

				if (medals) {
					guildTracker.medals = medals;
				}

				let duelrating = interaction.options.getBoolean('duelrating');

				if (duelrating) {
					guildTracker.duelRating = duelrating;
				}

				let matchactivity = interaction.options.getString('matchactivity');

				if (matchactivity === 'matches') {
					guildTracker.matchActivity = true;
					guildTracker.matchActivityAutoTrack = false;
				} else if (matchactivity === 'matches (auto matchtrack)') {
					guildTracker.matchActivity = true;
					guildTracker.matchActivityAutoTrack = true;
				}

				if (guildTracker.matchActivity) {
					guildTracker.acronym = interaction.options.getString('acronym');
				}

				if (guildTracker.osuTopPlays ||
					guildTracker.taikoTopPlays ||
					guildTracker.catchTopPlays ||
					guildTracker.maniaTopPlays ||
					guildTracker.tournamentTopPlays ||
					guildTracker.osuLeaderboard ||
					guildTracker.taikoLeaderboard ||
					guildTracker.catchLeaderboard ||
					guildTracker.maniaLeaderboard ||
					guildTracker.osuAmeobea ||
					guildTracker.taikoAmeobea ||
					guildTracker.catchAmeobea ||
					guildTracker.maniaAmeobea ||
					guildTracker.medals ||
					guildTracker.duelRating ||
					guildTracker.matchActivity ||
					guildTracker.acronym) {
					await guildTracker.save();

					await interaction.followUp({ content: `Tracking \`${osuUser.osuName.replace(/`/g, '')}\` in <#${interaction.channel.id}>.`, ephemeral: true });

					continue;
				}

				// If nothing is tracked, delete the tracker
				await guildTracker.destroy();

				// Find other guild trackers, if none exsist, delete the user tracker
				logDatabaseQueries(4, 'commands/osu-track.js enable DBOsuGuildTrackers 2');
				const guildTrackers = await DBOsuGuildTrackers.findAll({
					where: {
						osuUserId: osuUser.osuUserId,
					},
				});

				if (guildTrackers.length === 0) {
					await userTimer.destroy();
				}

				await interaction.followUp({ content: `Not tracking \`${osuUser.osuName.replace(/`/g, '')}\` because no attributes are going to be tracked.`, ephemeral: true });
			}

			return interaction.editReply({ content: 'Finished processing.', ephemeral: true });
		} else if (interaction.options.getSubcommand() === 'disable') {
			try {
				await interaction.reply({ content: 'Processing...', ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

			let usernames = interaction.options.getString('usernames');

			usernames = usernames.split(',');
			usernames = usernames.map(username => username.trim());

			for (let i = 0; i < usernames.length; i++) {
				let username = usernames[i];

				//Get the user from the database if possible
				logDatabaseQueries(4, 'commands/osu-track.js DBDiscordUsers 2');
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
						// eslint-disable-next-line no-undef
						process.send('osu!API');
						const user = await osuApi.getUser({ u: username });
						osuUser.osuUserId = user.id;
						osuUser.osuName = user.name;
					} catch (error) {
						console.error(error);
						await interaction.followUp({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\`.`, ephemeral: true });
						continue;
					}
				}

				//Create the timer for checking the user if needed
				logDatabaseQueries(4, 'commands/osu-track.js DBOsuTrackingUsers 2');
				let userTimer = await DBOsuTrackingUsers.findOne({
					where: {
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!userTimer) {
					await interaction.editReply({ content: `Currently not tracking \`${osuUser.osuName.replace(/`/g, '')}\` in <#${interaction.channel.id}>.`, ephemeral: true });
					continue;
				}

				//Create or update the guild tracker
				logDatabaseQueries(4, 'commands/osu-track.js disable DBOsuGuildTrackers 1');
				let guildTracker = await DBOsuGuildTrackers.findOne({
					where: {
						guildId: interaction.guild.id,
						channelId: interaction.channel.id,
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!guildTracker) {
					await interaction.editReply({ content: `Currently not tracking \`${osuUser.osuName.replace(/`/g, '')}\` in <#${interaction.channel.id}>.`, ephemeral: true });
					continue;
				}

				let disableEverything = true;

				if (interaction.options.getBoolean('topplays')
					|| interaction.options.getBoolean('leaderboardplays')
					|| interaction.options.getBoolean('ameobea')
					|| interaction.options.getBoolean('showameobeaupdates')
					|| interaction.options.getBoolean('medals')
					|| interaction.options.getBoolean('duelrating')
					|| interaction.options.getBoolean('matchactivity')) {
					disableEverything = false;
				}

				let topPlays = interaction.options.getBoolean('topplays');

				if (topPlays || disableEverything) {
					guildTracker.osuTopPlays = false;
					guildTracker.taikoTopPlays = false;
					guildTracker.catchTopPlays = false;
					guildTracker.maniaTopPlays = false;
					guildTracker.tournamentTopPlays = false;
				}

				let leaderboardPlays = interaction.options.getBoolean('leaderboardplays');

				if (leaderboardPlays || disableEverything) {
					guildTracker.osuLeaderboard = false;
					guildTracker.taikoLeaderboard = false;
					guildTracker.catchLeaderboard = false;
					guildTracker.maniaLeaderboard = false;
				}

				let ameobea = interaction.options.getBoolean('ameobea');

				if (ameobea || disableEverything) {
					guildTracker.osuAmeobea = false;
					guildTracker.taikoAmeobea = false;
					guildTracker.catchAmeobea = false;
					guildTracker.maniaAmeobea = false;
					guildTracker.showAmeobeaUpdates = false;
				}

				let showAmeobeaUpdates = interaction.options.getBoolean('showameobeaupdates');

				if (showAmeobeaUpdates || disableEverything) {
					guildTracker.showAmeobeaUpdates = false;
				}

				let medals = interaction.options.getBoolean('medals');

				if (medals || disableEverything) {
					guildTracker.medals = false;
				}

				let duelrating = interaction.options.getBoolean('duelrating');

				if (duelrating || disableEverything) {
					guildTracker.duelRating = false;
				}

				let matchactivity = interaction.options.getBoolean('matchactivity');

				if (matchactivity || disableEverything) {
					guildTracker.matchActivity = false;
					guildTracker.matchActivityAutoTrack = false;
					guildTracker.acronym = null;
				}

				let acronym = interaction.options.getBoolean('acronym');

				if (acronym || disableEverything) {
					guildTracker.acronym = null;
				}

				if (guildTracker.osuTopPlays ||
					guildTracker.taikoTopPlays ||
					guildTracker.catchTopPlays ||
					guildTracker.maniaTopPlays ||
					guildTracker.tournamentTopPlays ||
					guildTracker.osuLeaderboard ||
					guildTracker.taikoLeaderboard ||
					guildTracker.catchLeaderboard ||
					guildTracker.maniaLeaderboard ||
					guildTracker.osuAmeobea ||
					guildTracker.taikoAmeobea ||
					guildTracker.catchAmeobea ||
					guildTracker.maniaAmeobea ||
					guildTracker.medals ||
					guildTracker.duelRating ||
					guildTracker.matchActivity ||
					guildTracker.acronym) {
					await guildTracker.save();

					await interaction.followUp({ content: `Updated tracking \`${osuUser.osuName.replace(/`/g, '')}\` in <#${interaction.channel.id}>.`, ephemeral: true });

					continue;
				}

				// If nothing is tracked, delete the tracker
				await guildTracker.destroy();

				// Find other guild trackers, if none exsist, delete the user tracker
				logDatabaseQueries(4, 'commands/osu-track.js disable DBOsuGuildTrackers 2');
				const guildTrackers = await DBOsuGuildTrackers.findAll({
					where: {
						osuUserId: osuUser.osuUserId,
					},
				});

				if (guildTrackers.length === 0) {
					await userTimer.destroy();
				}

				await interaction.followUp({ content: `Removed tracking \`${osuUser.osuName.replace(/`/g, '')}\` because no attributes are going to be tracked.`, ephemeral: true });
			}

			return interaction.editReply({ content: 'Finished processing.', ephemeral: true });
		} else if (interaction.options.getSubcommand() === 'list') {
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

			logDatabaseQueries(4, 'commands/osu-track.js list DBOsuGuildTrackers users');
			let guildTrackers = await DBOsuGuildTrackers.findAll({
				where: {
					channelId: interaction.channel.id,
					osuUserId: {
						[Op.ne]: null,
					}
				},
			});

			let output = [];

			if (guildTrackers.length === 0) {
				output.push('There are currently no users tracked in this channel.');
			}

			for (let i = 0; i < guildTrackers.length; i++) {
				let username = guildTrackers[i].osuUserId;

				//Get the user from the database if possible
				logDatabaseQueries(4, 'commands/osu-track.js DBDiscordUsers 3');
				let discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: username,
					},
					order: [
						['osuName', 'ASC'],
					],
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
						// eslint-disable-next-line no-undef
						process.send('osu!API');
						const user = await osuApi.getUser({ u: username });
						osuUser.osuUserId = user.id;
						osuUser.osuName = user.name;
					} catch (error) {
						console.error(error);
						await interaction.followUp({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\` anymore.`, ephemeral: true });
						continue;
					}
				}

				let topPlayTrackings = [];

				if (guildTrackers[i].osuTopPlays) {
					topPlayTrackings.push('osu!');
				}

				if (guildTrackers[i].taikoTopPlays) {
					topPlayTrackings.push('Taiko');
				}

				if (guildTrackers[i].catchTopPlays) {
					topPlayTrackings.push('Catch');
				}

				if (guildTrackers[i].maniaTopPlays) {
					topPlayTrackings.push('Mania');
				}

				if (guildTrackers[i].tournamentTopPlays) {
					topPlayTrackings.push('Tournaments');
				}

				if (!topPlayTrackings.length) {
					topPlayTrackings.push('Not tracked');
				}

				let leaderboardTrackings = [];

				if (guildTrackers[i].osuLeaderboard) {
					leaderboardTrackings.push('osu!');
				}

				if (guildTrackers[i].taikoLeaderboard) {
					leaderboardTrackings.push('Taiko');
				}

				if (guildTrackers[i].catchLeaderboard) {
					leaderboardTrackings.push('Catch');
				}

				if (guildTrackers[i].maniaLeaderboard) {
					leaderboardTrackings.push('Mania');
				}

				if (!leaderboardTrackings.length) {
					leaderboardTrackings.push('Not tracked');
				}

				let ameobeaTrackings = [];

				if (guildTrackers[i].osuAmeobea) {
					ameobeaTrackings.push('osu!');
				}

				if (guildTrackers[i].taikoAmeobea) {
					ameobeaTrackings.push('Taiko');
				}

				if (guildTrackers[i].catchAmeobea) {
					ameobeaTrackings.push('Catch');
				}

				if (guildTrackers[i].maniaAmeobea) {
					ameobeaTrackings.push('Mania');
				}

				if (!ameobeaTrackings.length) {
					ameobeaTrackings.push('Not tracked');
				}

				let showAmeobeaUpdates = guildTrackers[i].showAmeobeaUpdates ? ' \n- Showing ameobea updates' : '';

				let medals = guildTrackers[i].medals ? ' \n- Showing medals' : '';

				let duelRating = guildTrackers[i].duelRating ? ' \n- Showing duel rating updates' : '';

				let matchActivity = '';

				if (guildTrackers[i].matchActivity) {
					matchActivity = ' \n- Showing match activity';
					if (guildTrackers[i].matchActivityAutoTrack) {
						matchActivity += ' (auto-track)';
					}

					if (guildTrackers[i].acronym) {
						matchActivity += ` (${guildTrackers[i].acronym})`;
					}
				}

				output.push(`\`${osuUser.osuName}\`\n- Top Plays: ${topPlayTrackings.join(', ')}\n- Leaderboard Scores: ${leaderboardTrackings.join(', ')}\n- Ameobea updates: ${ameobeaTrackings.join(', ')}${showAmeobeaUpdates}${medals}${duelRating}${matchActivity}`);
			}

			output.push('\n');

			logDatabaseQueries(4, 'commands/osu-track.js list DBOsuGuildTrackers users');
			guildTrackers = await DBOsuGuildTrackers.findAll({
				where: {
					channelId: interaction.channel.id,
					osuUserId: null,
				},
				order: [
					['acronym', 'ASC']
				]
			});

			if (guildTrackers.length === 0) {
				output.push('There are currently no tourneys tracked in this channel.');
			}

			for (let i = 0; i < guildTrackers.length; i++) {
				let matchActivity = ' \n- Showing match activity';
				if (guildTrackers[i].matchActivityAutoTrack) {
					matchActivity += ' (auto-track)';
				}
				output.push(`\`${guildTrackers[i].acronym}\`${matchActivity}`);
			}

			let currentOutput = [];

			while (output.length) {
				while (currentOutput.length < 10 && output.length) {
					currentOutput.push(output.shift());
				}

				await interaction.followUp({ content: currentOutput.join('\n\n'), ephemeral: true });
				currentOutput = [];
			}
		} else if (interaction.options.getSubcommand() === 'tourneyenable') {
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

			let acronym = interaction.options.getString('acronym');

			let tracking = interaction.options.getString('matchactivity');

			logDatabaseQueries(4, 'commands/osu-track.js DBOsuGuildTrackers tourneyenable');
			let guildTracker = await DBOsuGuildTrackers.findOne({
				where: {
					guildId: interaction.guild.id,
					channelId: interaction.channel.id,
					acronym: acronym,
				}
			});

			if (!guildTracker) {
				logDatabaseQueries(4, 'commands/osu-track.js DBOsuGuildTrackers tourneyenable create');
				guildTracker = await DBOsuGuildTrackers.create({
					guildId: interaction.guild.id,
					channelId: interaction.channel.id,
					acronym: acronym,
					matchActivity: true,
				});
			}

			if (tracking === 'matches (auto matchtrack)') {
				guildTracker.matchActivityAutoTrack = true;
			} else {
				guildTracker.matchActivityAutoTrack = false;
			}

			await guildTracker.save();

			return interaction.followUp({ content: `Match activity tracking updated for ${acronym} in this channel.`, ephemeral: true });
		} else if (interaction.options.getSubcommand() === 'tourneydisable') {
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

			let acronym = interaction.options.getString('acronym');

			logDatabaseQueries(4, 'commands/osu-track.js DBOsuGuildTrackers tourneydisable');
			let guildTracker = await DBOsuGuildTrackers.findOne({
				where: {
					guildId: interaction.guild.id,
					channelId: interaction.channel.id,
					acronym: acronym,
				}
			});

			if (guildTracker) {
				await guildTracker.destroy();

				return interaction.followUp({ content: `Match activity tracking disabled for ${acronym} in this channel.`, ephemeral: true });
			}

			return interaction.followUp({ content: `Match activity tracking is not enabled for ${acronym} in this channel.`, ephemeral: true });
		}
	},
};