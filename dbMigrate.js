/* eslint-disable no-console */
// eslint-disable-next-line no-console
console.log('Syncing databases...');
const Sequelize = require('sequelize');

(async () => {
	const guilds = new Sequelize('database', 'username', 'password', {
		host: 'localhost',
		dialect: 'sqlite',
		logging: false,
		storage: 'databases/guilds.sqlite',
		retry: {
			max: 15, // Maximum retry 15 times
			backoffBase: 100, // Initial backoff duration in ms. Default: 100,
			backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
		},
	});

	console.log('Dropping unused guilds tables...');


	let guildsDiscordUsers = require('./models/DBDiscordUsers')(guilds, Sequelize.DataTypes);

	await guildsDiscordUsers.drop();

	console.log('Dropped guildsDiscordUsers table.');


	let guildsServerActivity = require('./models/DBServerUserActivity')(guilds, Sequelize.DataTypes);

	await guildsServerActivity.drop();

	console.log('Dropped guildsServerActivity table.');


	let guildsProcessQueue = require('./models/DBProcessQueue')(guilds, Sequelize.DataTypes);

	await guildsProcessQueue.drop();

	console.log('Dropped guildsProcessQueue table.');


	let guildsMOTDPoints = require('./models/DBMOTDPoints')(guilds, Sequelize.DataTypes);

	await guildsMOTDPoints.drop();

	console.log('Dropped guildsMOTDPoints table.');


	let guildsTourneyFollows = require('./models/DBOsuTourneyFollows')(guilds, Sequelize.DataTypes);

	await guildsTourneyFollows.drop();

	console.log('Dropped guildsTourneyFollows table.');


	let guildsDuelRatingHistory = require('./models/DBDuelRatingHistory')(guilds, Sequelize.DataTypes);

	await guildsDuelRatingHistory.drop();

	console.log('Dropped guildsDuelRatingHistory table.');


	let guildsForumPosts = require('./models/DBOsuForumPosts')(guilds, Sequelize.DataTypes);

	await guildsForumPosts.drop();

	console.log('Dropped guildsForumPosts table.');

	let guildsTrackingUsers = require('./models/DBOsuTrackingUsers')(guilds, Sequelize.DataTypes);

	await guildsTrackingUsers.drop();

	console.log('Dropped guildsTrackingUsers table.');


	let guildsElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(guilds, Sequelize.DataTypes);

	await guildsElitiriCupSignUp.drop();

	console.log('Dropped guildsElitiriCupSignUp table.');


	let guildsElitiriCupStaff = require('./models/DBElitiriCupStaff')(guilds, Sequelize.DataTypes);

	await guildsElitiriCupStaff.drop();

	console.log('Dropped guildsElitiriCupStaff table.');

	let guildsElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(guilds, Sequelize.DataTypes);

	await guildsElitiriCupSubmissions.drop();

	console.log('Dropped guildsElitiriCupSubmissions table.');


	let guildsElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(guilds, Sequelize.DataTypes);

	await guildsElitiriCupLobbies.drop();

	console.log('Dropped guildsElitiriCupLobbies table.');


	let guildsOsuMultiScores = require('./models/DBOsuMultiScores')(guilds, Sequelize.DataTypes);

	await guildsOsuMultiScores.drop();

	console.log('Dropped guildsOsuMultiScores table.');


	let guildsOsuBeatmaps = require('./models/DBOsuBeatmaps')(guilds, Sequelize.DataTypes);

	await guildsOsuBeatmaps.drop();

	console.log('Dropped guildsOsuBeatmaps table.');



	const discordUsers = new Sequelize('database', 'username', 'password', {
		host: 'localhost',
		dialect: 'sqlite',
		logging: false,
		storage: 'databases/discordUsers.sqlite',
		retry: {
			max: 15, // Maximum retry 15 times
			backoffBase: 100, // Initial backoff duration in ms. Default: 100,
			backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
		},
	});

	console.log('Dropping unused discordUsers tables...');

	let discordUsersGuilds = require('./models/DBGuilds')(discordUsers, Sequelize.DataTypes);

	await discordUsersGuilds.drop();

	console.log('Dropped discordUsersGuilds table.');


	let discordUsersReactionRoles = require('./models/DBReactionRoles')(discordUsers, Sequelize.DataTypes);

	await discordUsersReactionRoles.drop();

	console.log('Dropped discordUsersReactionRoles table.');


	let discordUsersReactionRolesHeader = require('./models/DBReactionRolesHeader')(discordUsers, Sequelize.DataTypes);

	await discordUsersReactionRolesHeader.drop();

	console.log('Dropped discordUsersReactionRolesHeader table.');


	let discordUsersAutoRoles = require('./models/DBAutoRoles')(discordUsers, Sequelize.DataTypes);

	await discordUsersAutoRoles.drop();

	console.log('Dropped discordUsersAutoRoles table.');


	let discordUsersTemporaryVoices = require('./models/DBTemporaryVoices')(discordUsers, Sequelize.DataTypes);

	await discordUsersTemporaryVoices.drop();

	console.log('Dropped discordUsersTemporaryVoices table.');


	let discordUsersActivityRoles = require('./models/DBActivityRoles')(discordUsers, Sequelize.DataTypes);

	await discordUsersActivityRoles.drop();

	console.log('Dropped discordUsersActivityRoles table.');


	let discordUsersStarBoardMessages = require('./models/DBStarBoardMessages')(discordUsers, Sequelize.DataTypes);

	await discordUsersStarBoardMessages.drop();

	console.log('Dropped discordUsersStarBoardMessages table.');


	let discordUsersTickets = require('./models/DBTickets')(discordUsers, Sequelize.DataTypes);

	await discordUsersTickets.drop();

	console.log('Dropped discordUsersTickets table.');


	let discordUsersBirthdayGuilds = require('./models/DBBirthdayGuilds')(discordUsers, Sequelize.DataTypes);

	await discordUsersBirthdayGuilds.drop();

	console.log('Dropped discordUsersBirthdayGuilds table.');


	let discordUsersOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(discordUsers, Sequelize.DataTypes);

	await discordUsersOsuGuildTrackers.drop();

	console.log('Dropped discordUsersOsuGuildTrackers table.');


	let discordUsersServerUserActivity = require('./models/DBServerUserActivity')(discordUsers, Sequelize.DataTypes);

	await discordUsersServerUserActivity.drop();

	console.log('Dropped discordUsersServerUserActivity table.');


	let discordUsersProcessQueue = require('./models/DBProcessQueue')(discordUsers, Sequelize.DataTypes);

	await discordUsersProcessQueue.drop();

	console.log('Dropped discordUsersProcessQueue table.');


	let discordUsersMOTDPoints = require('./models/DBMOTDPoints')(discordUsers, Sequelize.DataTypes);

	await discordUsersMOTDPoints.drop();

	console.log('Dropped discordUsersMOTDPoints table.');


	let discordUsersOsuTourneyFollows = require('./models/DBOsuTourneyFollows')(discordUsers, Sequelize.DataTypes);

	await discordUsersOsuTourneyFollows.drop();

	console.log('Dropped discordUsersOsuTourneyFollows table.');


	let discordUsersDuelRatingHistory = require('./models/DBDuelRatingHistory')(discordUsers, Sequelize.DataTypes);

	await discordUsersDuelRatingHistory.drop();

	console.log('Dropped discordUsersDuelRatingHistory table.');


	let discordUsersOsuForumPosts = require('./models/DBOsuForumPosts')(discordUsers, Sequelize.DataTypes);

	await discordUsersOsuForumPosts.drop();

	console.log('Dropped discordUsersOsuForumPosts table.');


	let discordUsersOsuTrackingUsers = require('./models/DBOsuTrackingUsers')(discordUsers, Sequelize.DataTypes);

	await discordUsersOsuTrackingUsers.drop();

	console.log('Dropped discordUsersOsuTrackingUsers table.');


	let discordUsersElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(discordUsers, Sequelize.DataTypes);

	await discordUsersElitiriCupSignUp.drop();

	console.log('Dropped discordUsersElitiriCupSignUp table.');


	let discordUsersElitiriCupStaff = require('./models/DBElitiriCupStaff')(discordUsers, Sequelize.DataTypes);

	await discordUsersElitiriCupStaff.drop();

	console.log('Dropped discordUsersElitiriCupStaff table.');


	let discordUsersElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(discordUsers, Sequelize.DataTypes);

	await discordUsersElitiriCupSubmissions.drop();

	console.log('Dropped discordUsersElitiriCupSubmissions table.');


	let discordUsersElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(discordUsers, Sequelize.DataTypes);

	await discordUsersElitiriCupLobbies.drop();

	console.log('Dropped discordUsersElitiriCupLobbies table.');


	let discordUsersOsuMultiScores = require('./models/DBOsuMultiScores')(discordUsers, Sequelize.DataTypes);

	await discordUsersOsuMultiScores.drop();

	console.log('Dropped discordUsersOsuMultiScores table.');


	let discordUsersOsuBeatmaps = require('./models/DBOsuBeatmaps')(discordUsers, Sequelize.DataTypes);

	await discordUsersOsuBeatmaps.drop();

	console.log('Dropped discordUsersOsuBeatmaps table.');



	const serverActivity = new Sequelize('database', 'username', 'password', {
		host: 'localhost',
		dialect: 'sqlite',
		logging: false,
		storage: 'databases/serverActivity.sqlite',
		retry: {
			max: 15, // Maximum retry 15 times
			backoffBase: 100, // Initial backoff duration in ms. Default: 100,
			backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
		},
	});

	console.log('Dropping unused serverActivity tables...');

	let serverActivityGuilds = require('./models/DBGuilds')(serverActivity, Sequelize.DataTypes);

	await serverActivityGuilds.drop();

	console.log('Dropped serverActivityGuilds table.');


	let serverActivityReactionRoles = require('./models/DBReactionRoles')(serverActivity, Sequelize.DataTypes);

	await serverActivityReactionRoles.drop();

	console.log('Dropped serverActivityReactionRoles table.');


	let serverActivityReactionRolesHeader = require('./models/DBReactionRolesHeader')(serverActivity, Sequelize.DataTypes);

	await serverActivityReactionRolesHeader.drop();

	console.log('Dropped serverActivityReactionRolesHeader table.');


	let serverActivityAutoRoles = require('./models/DBAutoRoles')(serverActivity, Sequelize.DataTypes);

	await serverActivityAutoRoles.drop();

	console.log('Dropped serverActivityAutoRoles table.');


	let serverActivityTemporaryVoices = require('./models/DBTemporaryVoices')(serverActivity, Sequelize.DataTypes);

	await serverActivityTemporaryVoices.drop();

	console.log('Dropped serverActivityTemporaryVoices table.');


	let serverActivityActivityRoles = require('./models/DBActivityRoles')(serverActivity, Sequelize.DataTypes);

	await serverActivityActivityRoles.drop();

	console.log('Dropped serverActivityActivityRoles table.');


	let serverActivityStarBoardMessages = require('./models/DBStarBoardMessages')(serverActivity, Sequelize.DataTypes);

	await serverActivityStarBoardMessages.drop();

	console.log('Dropped serverActivityStarBoardMessages table.');


	let serverActivityTickets = require('./models/DBTickets')(serverActivity, Sequelize.DataTypes);

	await serverActivityTickets.drop();

	console.log('Dropped serverActivityTickets table.');


	let serverActivityBirthdayGuilds = require('./models/DBBirthdayGuilds')(serverActivity, Sequelize.DataTypes);

	await serverActivityBirthdayGuilds.drop();

	console.log('Dropped serverActivityBirthdayGuilds table.');


	let serverActivityOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(serverActivity, Sequelize.DataTypes);

	await serverActivityOsuGuildTrackers.drop();

	console.log('Dropped serverActivityOsuGuildTrackers table.');


	let serverActivityDiscordUsers = require('./models/DBDiscordUsers')(serverActivity, Sequelize.DataTypes);

	await serverActivityDiscordUsers.drop();

	console.log('Dropped serverActivityDiscordUsers table.');


	let serverActivityProcessQueue = require('./models/DBProcessQueue')(serverActivity, Sequelize.DataTypes);

	await serverActivityProcessQueue.drop();

	console.log('Dropped serverActivityProcessQueue table.');


	let serverActivityMOTDPoints = require('./models/DBMOTDPoints')(serverActivity, Sequelize.DataTypes);

	await serverActivityMOTDPoints.drop();

	console.log('Dropped serverActivityMOTDPoints table.');


	let serverActivityOsuTourneyFollows = require('./models/DBOsuTourneyFollows')(serverActivity, Sequelize.DataTypes);

	await serverActivityOsuTourneyFollows.drop();

	console.log('Dropped serverActivityOsuTourneyFollows table.');


	let serverActivityDuelRatingHistory = require('./models/DBDuelRatingHistory')(serverActivity, Sequelize.DataTypes);

	await serverActivityDuelRatingHistory.drop();

	console.log('Dropped serverActivityDuelRatingHistory table.');


	let serverActivityOsuForumPosts = require('./models/DBOsuForumPosts')(serverActivity, Sequelize.DataTypes);

	await serverActivityOsuForumPosts.drop();

	console.log('Dropped serverActivityOsuForumPosts table.');


	let serverActivityOsuTrackingUsers = require('./models/DBOsuTrackingUsers')(serverActivity, Sequelize.DataTypes);

	await serverActivityOsuTrackingUsers.drop();

	console.log('Dropped serverActivityOsuTrackingUsers table.');


	let serverActivityElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(serverActivity, Sequelize.DataTypes);

	await serverActivityElitiriCupSignUp.drop();

	console.log('Dropped serverActivityElitiriCupSignUp table.');


	let serverActivityElitiriCupStaff = require('./models/DBElitiriCupStaff')(serverActivity, Sequelize.DataTypes);

	await serverActivityElitiriCupStaff.drop();

	console.log('Dropped serverActivityElitiriCupStaff table.');


	let serverActivityElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(serverActivity, Sequelize.DataTypes);

	await serverActivityElitiriCupSubmissions.drop();

	console.log('Dropped serverActivityElitiriCupSubmissions table.');


	let serverActivityElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(serverActivity, Sequelize.DataTypes);

	await serverActivityElitiriCupLobbies.drop();

	console.log('Dropped serverActivityElitiriCupLobbies table.');


	let serverActivityOsuMultiScores = require('./models/DBOsuMultiScores')(serverActivity, Sequelize.DataTypes);

	await serverActivityOsuMultiScores.drop();

	console.log('Dropped serverActivityOsuMultiScores table.');


	let serverActivityOsuBeatmaps = require('./models/DBOsuBeatmaps')(serverActivity, Sequelize.DataTypes);

	await serverActivityOsuBeatmaps.drop();

	console.log('Dropped serverActivityOsuBeatmaps table.');



	const processQueue = new Sequelize('database', 'username', 'password', {
		host: 'localhost',
		dialect: 'sqlite',
		logging: false,
		storage: 'databases/processQueue.sqlite',
		retry: {
			max: 15, // Maximum retry 15 times
			backoffBase: 100, // Initial backoff duration in ms. Default: 100,
			backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
		},
	});

	console.log('Dropping unused processQueue tables...');

	let processQueueGuilds = require('./models/DBGuilds')(processQueue, Sequelize.DataTypes);

	await processQueueGuilds.drop();

	console.log('Dropped processQueueGuilds table.');


	let processQueueReactionRoles = require('./models/DBReactionRoles')(processQueue, Sequelize.DataTypes);

	await processQueueReactionRoles.drop();

	console.log('Dropped processQueueReactionRoles table.');


	let processQueueReactionRolesHeader = require('./models/DBReactionRolesHeader')(processQueue, Sequelize.DataTypes);

	await processQueueReactionRolesHeader.drop();

	console.log('Dropped processQueueReactionRolesHeader table.');


	let processQueueAutoRoles = require('./models/DBAutoRoles')(processQueue, Sequelize.DataTypes);

	await processQueueAutoRoles.drop();

	console.log('Dropped processQueueAutoRoles table.');


	let processQueueTemporaryVoices = require('./models/DBTemporaryVoices')(processQueue, Sequelize.DataTypes);

	await processQueueTemporaryVoices.drop();

	console.log('Dropped processQueueTemporaryVoices table.');


	let processQueueActivityRoles = require('./models/DBActivityRoles')(processQueue, Sequelize.DataTypes);

	await processQueueActivityRoles.drop();

	console.log('Dropped processQueueActivityRoles table.');


	let processQueueStarBoardMessages = require('./models/DBStarBoardMessages')(processQueue, Sequelize.DataTypes);

	await processQueueStarBoardMessages.drop();

	console.log('Dropped processQueueStarBoardMessages table.');


	let processQueueTickets = require('./models/DBTickets')(processQueue, Sequelize.DataTypes);

	await processQueueTickets.drop();

	console.log('Dropped processQueueTickets table.');


	let processQueueBirthdayGuilds = require('./models/DBBirthdayGuilds')(processQueue, Sequelize.DataTypes);

	await processQueueBirthdayGuilds.drop();

	console.log('Dropped processQueueBirthdayGuilds table.');


	let processQueueOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(processQueue, Sequelize.DataTypes);

	await processQueueOsuGuildTrackers.drop();

	console.log('Dropped processQueueOsuGuildTrackers table.');


	let processQueueDiscordUsers = require('./models/DBDiscordUsers')(processQueue, Sequelize.DataTypes);

	await processQueueDiscordUsers.drop();

	console.log('Dropped processQueueDiscordUsers table.');


	let processQueueServerUserActivity = require('./models/DBServerUserActivity')(processQueue, Sequelize.DataTypes);

	await processQueueServerUserActivity.drop();

	console.log('Dropped processQueueServerUserActivity table.');


	let processQueueMOTDPoints = require('./models/DBMOTDPoints')(processQueue, Sequelize.DataTypes);

	await processQueueMOTDPoints.drop();

	console.log('Dropped processQueueMOTDPoints table.');


	let processQueueOsuTourneyFollows = require('./models/DBOsuTourneyFollows')(processQueue, Sequelize.DataTypes);

	await processQueueOsuTourneyFollows.drop();

	console.log('Dropped processQueueOsuTourneyFollows table.');


	let processQueueDuelRatingHistory = require('./models/DBDuelRatingHistory')(processQueue, Sequelize.DataTypes);

	await processQueueDuelRatingHistory.drop();

	console.log('Dropped processQueueDuelRatingHistory table.');


	let processQueueOsuForumPosts = require('./models/DBOsuForumPosts')(processQueue, Sequelize.DataTypes);

	await processQueueOsuForumPosts.drop();

	console.log('Dropped processQueueOsuForumPosts table.');


	let processQueueOsuTrackingUsers = require('./models/DBOsuTrackingUsers')(processQueue, Sequelize.DataTypes);

	await processQueueOsuTrackingUsers.drop();

	console.log('Dropped processQueueOsuTrackingUsers table.');


	let processQueueElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(processQueue, Sequelize.DataTypes);

	await processQueueElitiriCupSignUp.drop();

	console.log('Dropped processQueueElitiriCupSignUp table.');


	let processQueueElitiriCupStaff = require('./models/DBElitiriCupStaff')(processQueue, Sequelize.DataTypes);

	await processQueueElitiriCupStaff.drop();

	console.log('Dropped processQueueElitiriCupStaff table.');


	let processQueueElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(processQueue, Sequelize.DataTypes);

	await processQueueElitiriCupSubmissions.drop();

	console.log('Dropped processQueueElitiriCupSubmissions table.');


	let processQueueElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(processQueue, Sequelize.DataTypes);

	await processQueueElitiriCupLobbies.drop();

	console.log('Dropped processQueueElitiriCupLobbies table.');


	let processQueueOsuMultiScores = require('./models/DBOsuMultiScores')(processQueue, Sequelize.DataTypes);

	await processQueueOsuMultiScores.drop();

	console.log('Dropped processQueueOsuMultiScores table.');


	let processQueueOsuBeatmaps = require('./models/DBOsuBeatmaps')(processQueue, Sequelize.DataTypes);

	await processQueueOsuBeatmaps.drop();

	console.log('Dropped processQueueOsuBeatmaps table.');



	const osuData = new Sequelize('database', 'username', 'password', {
		host: 'localhost',
		dialect: 'sqlite',
		logging: false,
		storage: 'databases/osuData.sqlite',
		retry: {
			max: 15, // Maximum retry 15 times
			backoffBase: 100, // Initial backoff duration in ms. Default: 100,
			backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
		},
	});

	console.log('Dropping unused osuData tables...');

	let osuDataGuilds = require('./models/DBGuilds')(osuData, Sequelize.DataTypes);

	await osuDataGuilds.drop();

	console.log('Dropped osuDataGuilds table.');


	let osuDataReactionRoles = require('./models/DBReactionRoles')(osuData, Sequelize.DataTypes);

	await osuDataReactionRoles.drop();

	console.log('Dropped osuDataReactionRoles table.');


	let osuDataReactionRolesHeader = require('./models/DBReactionRolesHeader')(osuData, Sequelize.DataTypes);

	await osuDataReactionRolesHeader.drop();

	console.log('Dropped osuDataReactionRolesHeader table.');


	let osuDataAutoRoles = require('./models/DBAutoRoles')(osuData, Sequelize.DataTypes);

	await osuDataAutoRoles.drop();

	console.log('Dropped osuDataAutoRoles table.');


	let osuDataTemporaryVoices = require('./models/DBTemporaryVoices')(osuData, Sequelize.DataTypes);

	await osuDataTemporaryVoices.drop();

	console.log('Dropped osuDataTemporaryVoices table.');


	let osuDataActivityRoles = require('./models/DBActivityRoles')(osuData, Sequelize.DataTypes);

	await osuDataActivityRoles.drop();

	console.log('Dropped osuDataActivityRoles table.');


	let osuDataStarBoardMessages = require('./models/DBStarBoardMessages')(osuData, Sequelize.DataTypes);

	await osuDataStarBoardMessages.drop();

	console.log('Dropped osuDataStarBoardMessages table.');


	let osuDataTickets = require('./models/DBTickets')(osuData, Sequelize.DataTypes);

	await osuDataTickets.drop();

	console.log('Dropped osuDataTickets table.');


	let osuDataBirthdayGuilds = require('./models/DBBirthdayGuilds')(osuData, Sequelize.DataTypes);

	await osuDataBirthdayGuilds.drop();

	console.log('Dropped osuDataBirthdayGuilds table.');


	let osuDataOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(osuData, Sequelize.DataTypes);

	await osuDataOsuGuildTrackers.drop();

	console.log('Dropped osuDataOsuGuildTrackers table.');


	let osuDataDiscordUsers = require('./models/DBDiscordUsers')(osuData, Sequelize.DataTypes);

	await osuDataDiscordUsers.drop();

	console.log('Dropped osuDataDiscordUsers table.');


	let osuDataServerUserActivity = require('./models/DBServerUserActivity')(osuData, Sequelize.DataTypes);

	await osuDataServerUserActivity.drop();

	console.log('Dropped osuDataServerUserActivity table.');


	let osuDataProcessQueue = require('./models/DBProcessQueue')(osuData, Sequelize.DataTypes);

	await osuDataProcessQueue.drop();

	console.log('Dropped osuDataProcessQueue table.');


	let osuDataElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(osuData, Sequelize.DataTypes);

	await osuDataElitiriCupSignUp.drop();

	console.log('Dropped osuDataElitiriCupSignUp table.');


	let osuDataElitiriCupStaff = require('./models/DBElitiriCupStaff')(osuData, Sequelize.DataTypes);

	await osuDataElitiriCupStaff.drop();

	console.log('Dropped osuDataElitiriCupStaff table.');


	let osuDataElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(osuData, Sequelize.DataTypes);

	await osuDataElitiriCupSubmissions.drop();

	console.log('Dropped osuDataElitiriCupSubmissions table.');


	let osuDataElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(osuData, Sequelize.DataTypes);

	await osuDataElitiriCupLobbies.drop();

	console.log('Dropped osuDataElitiriCupLobbies table.');


	let osuDataOsuMultiScores = require('./models/DBOsuMultiScores')(osuData, Sequelize.DataTypes);

	await osuDataOsuMultiScores.drop();

	console.log('Dropped osuDataOsuMultiScores table.');


	let osuDataOsuBeatmaps = require('./models/DBOsuBeatmaps')(osuData, Sequelize.DataTypes);

	await osuDataOsuBeatmaps.drop();

	console.log('Dropped osuDataOsuBeatmaps table.');



	const elitiriData = new Sequelize('database', 'username', 'password', {
		host: 'localhost',
		dialect: 'sqlite',
		logging: false,
		storage: 'databases/elitiriData.sqlite',
		retry: {
			max: 15, // Maximum retry 15 times
			backoffBase: 100, // Initial backoff duration in ms. Default: 100,
			backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
		},
	});

	console.log('Dropping unused elitiriData tables...');

	let elitiriDataGuilds = require('./models/DBGuilds')(elitiriData, Sequelize.DataTypes);

	await elitiriDataGuilds.drop();

	console.log('Dropped elitiriDataGuilds table.');


	let elitiriDataReactionRoles = require('./models/DBReactionRoles')(elitiriData, Sequelize.DataTypes);

	await elitiriDataReactionRoles.drop();

	console.log('Dropped elitiriDataReactionRoles table.');


	let elitiriDataReactionRolesHeader = require('./models/DBReactionRolesHeader')(elitiriData, Sequelize.DataTypes);

	await elitiriDataReactionRolesHeader.drop();

	console.log('Dropped elitiriDataReactionRolesHeader table.');


	let elitiriDataAutoRoles = require('./models/DBAutoRoles')(elitiriData, Sequelize.DataTypes);

	await elitiriDataAutoRoles.drop();

	console.log('Dropped elitiriDataAutoRoles table.');


	let elitiriDataTemporaryVoices = require('./models/DBTemporaryVoices')(elitiriData, Sequelize.DataTypes);

	await elitiriDataTemporaryVoices.drop();

	console.log('Dropped elitiriDataTemporaryVoices table.');


	let elitiriDataActivityRoles = require('./models/DBActivityRoles')(elitiriData, Sequelize.DataTypes);

	await elitiriDataActivityRoles.drop();

	console.log('Dropped elitiriDataActivityRoles table.');


	let elitiriDataStarBoardMessages = require('./models/DBStarBoardMessages')(elitiriData, Sequelize.DataTypes);

	await elitiriDataStarBoardMessages.drop();

	console.log('Dropped elitiriDataStarBoardMessages table.');


	let elitiriDataTickets = require('./models/DBTickets')(elitiriData, Sequelize.DataTypes);

	await elitiriDataTickets.drop();

	console.log('Dropped elitiriDataTickets table.');


	let elitiriDataBirthdayGuilds = require('./models/DBBirthdayGuilds')(elitiriData, Sequelize.DataTypes);

	await elitiriDataBirthdayGuilds.drop();

	console.log('Dropped elitiriDataBirthdayGuilds table.');


	let elitiriDataOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(elitiriData, Sequelize.DataTypes);

	await elitiriDataOsuGuildTrackers.drop();

	console.log('Dropped elitiriDataOsuGuildTrackers table.');


	let elitiriDataDiscordUsers = require('./models/DBDiscordUsers')(elitiriData, Sequelize.DataTypes);

	await elitiriDataDiscordUsers.drop();

	console.log('Dropped elitiriDataDiscordUsers table.');


	let elitiriDataServerUserActivity = require('./models/DBServerUserActivity')(elitiriData, Sequelize.DataTypes);

	await elitiriDataServerUserActivity.drop();

	console.log('Dropped elitiriDataServerUserActivity table.');


	let elitiriDataProcessQueue = require('./models/DBProcessQueue')(elitiriData, Sequelize.DataTypes);

	await elitiriDataProcessQueue.drop();

	console.log('Dropped elitiriDataProcessQueue table.');


	let elitiriDataMOTDPoints = require('./models/DBMOTDPoints')(elitiriData, Sequelize.DataTypes);

	await elitiriDataMOTDPoints.drop();

	console.log('Dropped elitiriDataMOTDPoints table.');


	let elitiriDataOsuTourneyFollows = require('./models/DBOsuTourneyFollows')(elitiriData, Sequelize.DataTypes);

	await elitiriDataOsuTourneyFollows.drop();

	console.log('Dropped elitiriDataOsuTourneyFollows table.');


	let elitiriDataDuelRatingHistory = require('./models/DBDuelRatingHistory')(elitiriData, Sequelize.DataTypes);

	await elitiriDataDuelRatingHistory.drop();

	console.log('Dropped elitiriDataDuelRatingHistory table.');


	let elitiriDataOsuForumPosts = require('./models/DBOsuForumPosts')(elitiriData, Sequelize.DataTypes);

	await elitiriDataOsuForumPosts.drop();

	console.log('Dropped elitiriDataOsuForumPosts table.');


	let elitiriDataOsuTrackingUsers = require('./models/DBOsuTrackingUsers')(elitiriData, Sequelize.DataTypes);

	await elitiriDataOsuTrackingUsers.drop();

	console.log('Dropped elitiriDataOsuTrackingUsers table.');


	let elitiriDataOsuMultiScores = require('./models/DBOsuMultiScores')(elitiriData, Sequelize.DataTypes);

	await elitiriDataOsuMultiScores.drop();

	console.log('Dropped elitiriDataOsuMultiScores table.');


	let elitiriDataOsuBeatmaps = require('./models/DBOsuBeatmaps')(elitiriData, Sequelize.DataTypes);

	await elitiriDataOsuBeatmaps.drop();

	console.log('Dropped elitiriDataOsuBeatmaps table.');



	const multiScores = new Sequelize('database', 'username', 'password', {
		host: 'localhost',
		dialect: 'sqlite',
		logging: false,
		storage: 'databases/multiScores.sqlite',
		retry: {
			max: 15, // Maximum retry 15 times
			backoffBase: 100, // Initial backoff duration in ms. Default: 100,
			backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
		},
	});

	console.log('Dropping unused multiScores tables...');

	let multiScoresGuilds = require('./models/DBGuilds')(multiScores, Sequelize.DataTypes);

	await multiScoresGuilds.drop();

	console.log('Dropped multiScoresGuilds table.');


	let multiScoresReactionRoles = require('./models/DBReactionRoles')(multiScores, Sequelize.DataTypes);

	await multiScoresReactionRoles.drop();

	console.log('Dropped multiScoresReactionRoles table.');


	let multiScoresReactionRolesHeader = require('./models/DBReactionRolesHeader')(multiScores, Sequelize.DataTypes);

	await multiScoresReactionRolesHeader.drop();

	console.log('Dropped multiScoresReactionRolesHeader table.');


	let multiScoresAutoRoles = require('./models/DBAutoRoles')(multiScores, Sequelize.DataTypes);

	await multiScoresAutoRoles.drop();

	console.log('Dropped multiScoresAutoRoles table.');


	let multiScoresTemporaryVoices = require('./models/DBTemporaryVoices')(multiScores, Sequelize.DataTypes);

	await multiScoresTemporaryVoices.drop();

	console.log('Dropped multiScoresTemporaryVoices table.');


	let multiScoresActivityRoles = require('./models/DBActivityRoles')(multiScores, Sequelize.DataTypes);

	await multiScoresActivityRoles.drop();

	console.log('Dropped multiScoresActivityRoles table.');


	let multiScoresStarBoardMessages = require('./models/DBStarBoardMessages')(multiScores, Sequelize.DataTypes);

	await multiScoresStarBoardMessages.drop();

	console.log('Dropped multiScoresStarBoardMessages table.');


	let multiScoresTickets = require('./models/DBTickets')(multiScores, Sequelize.DataTypes);

	await multiScoresTickets.drop();

	console.log('Dropped multiScoresTickets table.');


	let multiScoresBirthdayGuilds = require('./models/DBBirthdayGuilds')(multiScores, Sequelize.DataTypes);

	await multiScoresBirthdayGuilds.drop();

	console.log('Dropped multiScoresBirthdayGuilds table.');


	let multiScoresOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(multiScores, Sequelize.DataTypes);

	await multiScoresOsuGuildTrackers.drop();

	console.log('Dropped multiScoresOsuGuildTrackers table.');


	let multiScoresDiscordUsers = require('./models/DBDiscordUsers')(multiScores, Sequelize.DataTypes);

	await multiScoresDiscordUsers.drop();

	console.log('Dropped multiScoresDiscordUsers table.');


	let multiScoresServerUserActivity = require('./models/DBServerUserActivity')(multiScores, Sequelize.DataTypes);

	await multiScoresServerUserActivity.drop();

	console.log('Dropped multiScoresServerUserActivity table.');


	let multiScoresProcessQueue = require('./models/DBProcessQueue')(multiScores, Sequelize.DataTypes);

	await multiScoresProcessQueue.drop();

	console.log('Dropped multiScoresProcessQueue table.');


	let multiScoresMOTDPoints = require('./models/DBMOTDPoints')(multiScores, Sequelize.DataTypes);

	await multiScoresMOTDPoints.drop();

	console.log('Dropped multiScoresMOTDPoints table.');


	let multiScoresOsuTourneyFollows = require('./models/DBOsuTourneyFollows')(multiScores, Sequelize.DataTypes);

	await multiScoresOsuTourneyFollows.drop();

	console.log('Dropped multiScoresOsuTourneyFollows table.');


	let multiScoresDuelRatingHistory = require('./models/DBDuelRatingHistory')(multiScores, Sequelize.DataTypes);

	await multiScoresDuelRatingHistory.drop();

	console.log('Dropped multiScoresDuelRatingHistory table.');


	let multiScoresOsuForumPosts = require('./models/DBOsuForumPosts')(multiScores, Sequelize.DataTypes);

	await multiScoresOsuForumPosts.drop();

	console.log('Dropped multiScoresOsuForumPosts table.');


	let multiScoresOsuTrackingUsers = require('./models/DBOsuTrackingUsers')(multiScores, Sequelize.DataTypes);

	await multiScoresOsuTrackingUsers.drop();

	console.log('Dropped multiScoresOsuTrackingUsers table.');


	let multiScoresElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(multiScores, Sequelize.DataTypes);

	await multiScoresElitiriCupSignUp.drop();

	console.log('Dropped multiScoresElitiriCupSignUp table.');


	let multiScoresElitiriCupStaff = require('./models/DBElitiriCupStaff')(multiScores, Sequelize.DataTypes);

	await multiScoresElitiriCupStaff.drop();

	console.log('Dropped multiScoresElitiriCupStaff table.');


	let multiScoresElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(multiScores, Sequelize.DataTypes);

	await multiScoresElitiriCupSubmissions.drop();

	console.log('Dropped multiScoresElitiriCupSubmissions table.');


	let multiScoresElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(multiScores, Sequelize.DataTypes);

	await multiScoresElitiriCupLobbies.drop();

	console.log('Dropped multiScoresElitiriCupLobbies table.');


	let multiScoresOsuBeatmaps = require('./models/DBOsuBeatmaps')(multiScores, Sequelize.DataTypes);

	await multiScoresOsuBeatmaps.drop();

	console.log('Dropped multiScoresOsuBeatmaps table.');



	const beatmaps = new Sequelize('database', 'username', 'password', {
		host: 'localhost',
		dialect: 'sqlite',
		logging: false,
		storage: 'databases/beatmaps.sqlite',
		retry: {
			max: 15, // Maximum retry 15 times
			backoffBase: 100, // Initial backoff duration in ms. Default: 100,
			backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
		},
	});

	console.log('Dropping unused beatmaps tables...');

	let beatmapsGuilds = require('./models/DBGuilds')(beatmaps, Sequelize.DataTypes);

	await beatmapsGuilds.drop();

	console.log('Dropped beatmapsGuilds table.');


	let beatmapsReactionRoles = require('./models/DBReactionRoles')(beatmaps, Sequelize.DataTypes);

	await beatmapsReactionRoles.drop();

	console.log('Dropped beatmapsReactionRoles table.');


	let beatmapsReactionRolesHeader = require('./models/DBReactionRolesHeader')(beatmaps, Sequelize.DataTypes);

	await beatmapsReactionRolesHeader.drop();

	console.log('Dropped beatmapsReactionRolesHeader table.');


	let beatmapsAutoRoles = require('./models/DBAutoRoles')(beatmaps, Sequelize.DataTypes);

	await beatmapsAutoRoles.drop();

	console.log('Dropped beatmapsAutoRoles table.');


	let beatmapsTemporaryVoices = require('./models/DBTemporaryVoices')(beatmaps, Sequelize.DataTypes);

	await beatmapsTemporaryVoices.drop();

	console.log('Dropped beatmapsTemporaryVoices table.');


	let beatmapsActivityRoles = require('./models/DBActivityRoles')(beatmaps, Sequelize.DataTypes);

	await beatmapsActivityRoles.drop();

	console.log('Dropped beatmapsActivityRoles table.');


	let beatmapsStarBoardMessages = require('./models/DBStarBoardMessages')(beatmaps, Sequelize.DataTypes);

	await beatmapsStarBoardMessages.drop();

	console.log('Dropped beatmapsStarBoardMessages table.');


	let beatmapsTickets = require('./models/DBTickets')(beatmaps, Sequelize.DataTypes);

	await beatmapsTickets.drop();

	console.log('Dropped beatmapsTickets table.');


	let beatmapsBirthdayGuilds = require('./models/DBBirthdayGuilds')(beatmaps, Sequelize.DataTypes);

	await beatmapsBirthdayGuilds.drop();

	console.log('Dropped beatmapsBirthdayGuilds table.');


	let beatmapsOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(beatmaps, Sequelize.DataTypes);

	await beatmapsOsuGuildTrackers.drop();

	console.log('Dropped beatmapsOsuGuildTrackers table.');


	let beatmapsDiscordUsers = require('./models/DBDiscordUsers')(beatmaps, Sequelize.DataTypes);

	await beatmapsDiscordUsers.drop();

	console.log('Dropped beatmapsDiscordUsers table.');


	let beatmapsServerUserActivity = require('./models/DBServerUserActivity')(beatmaps, Sequelize.DataTypes);

	await beatmapsServerUserActivity.drop();

	console.log('Dropped beatmapsServerUserActivity table.');


	let beatmapsProcessQueue = require('./models/DBProcessQueue')(beatmaps, Sequelize.DataTypes);

	await beatmapsProcessQueue.drop();

	console.log('Dropped beatmapsProcessQueue table.');


	let beatmapsMOTDPoints = require('./models/DBMOTDPoints')(beatmaps, Sequelize.DataTypes);

	await beatmapsMOTDPoints.drop();

	console.log('Dropped beatmapsMOTDPoints table.');


	let beatmapsOsuTourneyFollows = require('./models/DBOsuTourneyFollows')(beatmaps, Sequelize.DataTypes);

	await beatmapsOsuTourneyFollows.drop();

	console.log('Dropped beatmapsOsuTourneyFollows table.');


	let beatmapsDuelRatingHistory = require('./models/DBDuelRatingHistory')(beatmaps, Sequelize.DataTypes);

	await beatmapsDuelRatingHistory.drop();

	console.log('Dropped beatmapsDuelRatingHistory table.');


	let beatmapsOsuForumPosts = require('./models/DBOsuForumPosts')(beatmaps, Sequelize.DataTypes);

	await beatmapsOsuForumPosts.drop();

	console.log('Dropped beatmapsOsuForumPosts table.');


	let beatmapsOsuTrackingUsers = require('./models/DBOsuTrackingUsers')(beatmaps, Sequelize.DataTypes);

	await beatmapsOsuTrackingUsers.drop();

	console.log('Dropped beatmapsOsuTrackingUsers table.');


	let beatmapsElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(beatmaps, Sequelize.DataTypes);

	await beatmapsElitiriCupSignUp.drop();

	console.log('Dropped beatmapsElitiriCupSignUp table.');


	let beatmapsElitiriCupStaff = require('./models/DBElitiriCupStaff')(beatmaps, Sequelize.DataTypes);

	await beatmapsElitiriCupStaff.drop();

	console.log('Dropped beatmapsElitiriCupStaff table.');


	let beatmapsElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(beatmaps, Sequelize.DataTypes);

	await beatmapsElitiriCupSubmissions.drop();

	console.log('Dropped beatmapsElitiriCupSubmissions table.');


	let beatmapsElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(beatmaps, Sequelize.DataTypes);

	await beatmapsElitiriCupLobbies.drop();

	console.log('Dropped beatmapsElitiriCupLobbies table.');


	let beatmapsOsuMultiScores = require('./models/DBOsuMultiScores')(beatmaps, Sequelize.DataTypes);

	await beatmapsOsuMultiScores.drop();

	console.log('Dropped beatmapsOsuMultiScores table.');
})();