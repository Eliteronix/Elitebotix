const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
	retry: {
		max: 15, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
});

const DBGuilds = require('./models/DBGuilds')(sequelize, Sequelize.DataTypes);
const DBReactionRoles = require('./models/DBReactionRoles')(sequelize, Sequelize.DataTypes);
const DBReactionRolesHeader = require('./models/DBReactionRolesHeader')(sequelize, Sequelize.DataTypes);
const DBAutoRoles = require('./models/DBAutoRoles')(sequelize, Sequelize.DataTypes);
const DBTemporaryVoices = require('./models/DBTemporaryVoices')(sequelize, Sequelize.DataTypes);
const DBDiscordUsers = require('./models/DBDiscordUsers')(sequelize, Sequelize.DataTypes);
const DBServerUserActivity = require('./models/DBServerUserActivity')(sequelize, Sequelize.DataTypes);
const DBProcessQueue = require('./models/DBProcessQueue')(sequelize, Sequelize.DataTypes);
const DBActivityRoles = require('./models/DBActivityRoles')(sequelize, Sequelize.DataTypes);
const DBMOTDPoints = require('./models/DBMOTDPoints')(sequelize, Sequelize.DataTypes);
const DBElitiriCupSignUp = require('./models/DBElitiriCupSignUp')(sequelize, Sequelize.DataTypes);
const DBElitiriCupStaff = require('./models/DBElitiriCupStaff')(sequelize, Sequelize.DataTypes);
const DBElitiriCupSubmissions = require('./models/DBElitiriCupSubmissions')(sequelize, Sequelize.DataTypes);
const DBStarBoardMessages = require('./models/DBStarBoardMessages')(sequelize, Sequelize.DataTypes);
const DBTickets = require('./models/DBTickets')(sequelize, Sequelize.DataTypes);
const DBOsuMultiScores = require('./models/DBOsuMultiScores')(sequelize, Sequelize.DataTypes);
const DBOsuBeatmaps = require('./models/DBOsuBeatmaps')(sequelize, Sequelize.DataTypes);
const DBElitiriCupLobbies = require('./models/DBElitiriCupLobbies')(sequelize, Sequelize.DataTypes);
const DBBirthdayGuilds = require('./models/DBBirthdayGuilds')(sequelize, Sequelize.DataTypes);
const DBOsuTourneyFollows = require('./models/DBOsuTourneyFollows')(sequelize, Sequelize.DataTypes);
const DBDuelRatingHistory = require('./models/DBDuelRatingHistory')(sequelize, Sequelize.DataTypes);
const DBOsuForumPosts = require('./models/DBOsuForumPosts')(sequelize, Sequelize.DataTypes);
const DBOsuTrackingUsers = require('./models/DBOsuTrackingUsers')(sequelize, Sequelize.DataTypes);
const DBOsuGuildTrackers = require('./models/DBOsuGuildTrackers')(sequelize, Sequelize.DataTypes);

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
