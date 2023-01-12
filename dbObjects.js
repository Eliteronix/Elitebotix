const Sequelize = require('sequelize');

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

const DBGuilds = require('./models/DBGuilds')(guilds, Sequelize.DataTypes);
const DBReactionRoles = require('./models/DBReactionRoles')(guilds, Sequelize.DataTypes);
const DBReactionRolesHeader = require('./models/DBReactionRolesHeader')(guilds, Sequelize.DataTypes);
const DBAutoRoles = require('./models/DBAutoRoles')(guilds, Sequelize.DataTypes);
const DBTemporaryVoices = require('./models/DBTemporaryVoices')(guilds, Sequelize.DataTypes);
const DBActivityRoles = require('./models/DBActivityRoles')(guilds, Sequelize.DataTypes);
const DBStarBoardMessages = require('./models/DBStarBoardMessages')(guilds, Sequelize.DataTypes);
const DBTickets = require('./models/DBTickets')(guilds, Sequelize.DataTypes);
const DBBirthdayGuilds = require('./models/DBBirthdayGuilds')(guilds, Sequelize.DataTypes);
const DBOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(guilds, Sequelize.DataTypes);

const DBDiscordUsers = require('./models/DBDiscordUsers')(discordUsers, Sequelize.DataTypes);

const DBServerUserActivity = require('./models/DBServerUserActivity')(serverActivity, Sequelize.DataTypes);

const DBProcessQueue = require('./models/DBProcessQueue')(processQueue, Sequelize.DataTypes);

const DBMOTDPoints = require('./models/DBMOTDPoints')(osuData, Sequelize.DataTypes);
const DBOsuTourneyFollows = require('./models/DBOsuTourneyFollows')(osuData, Sequelize.DataTypes);
const DBDuelRatingHistory = require('./models/DBDuelRatingHistory')(osuData, Sequelize.DataTypes);
const DBOsuForumPosts = require('./models/DBOsuForumPosts')(osuData, Sequelize.DataTypes);
const DBOsuTrackingUsers = require('./models/DBOsuTrackingUsers')(osuData, Sequelize.DataTypes);

const DBElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(elitiriData, Sequelize.DataTypes);
const DBElitiriCupStaff = require('./models/DBElitiriCupStaff')(elitiriData, Sequelize.DataTypes);
const DBElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(elitiriData, Sequelize.DataTypes);
const DBElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(elitiriData, Sequelize.DataTypes);

const DBOsuMultiScores = require('./models/DBOsuMultiScores')(multiScores, Sequelize.DataTypes);

const DBOsuBeatmaps = require('./models/DBOsuBeatmaps')(beatmaps, Sequelize.DataTypes);


module.exports = {
	DBGuilds,
	DBReactionRoles,
	DBReactionRolesHeader,
	DBAutoRoles,
	DBTemporaryVoices,
	DBDiscordUsers,
	DBServerUserActivity,
	DBProcessQueue,
	DBActivityRoles,
	DBMOTDPoints,
	DBElitiriCupSignUp,
	DBElitiriCupSubmissions,
	DBStarBoardMessages,
	DBTickets,
	DBOsuMultiScores,
	DBOsuBeatmaps,
	DBElitiriCupLobbies,
	DBElitiriCupStaff,
	DBBirthdayGuilds,
	DBOsuTourneyFollows,
	DBDuelRatingHistory,
	DBOsuForumPosts,
	DBOsuTrackingUsers,
	DBOsuGuildTrackers
};
