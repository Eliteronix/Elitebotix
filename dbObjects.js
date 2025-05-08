const Sequelize = require('sequelize');
require('dotenv').config();

const logging = {
	logging: (sql, timing) => {
		if (timing > 5000) { // Only log if execution time is greater than 1000ms
			// eslint-disable-next-line no-console
			console.log(`[SLOW QUERY] (${timing} ms): ${sql}`);
		}
	},
	benchmark: true,
	// logging: false,
	// benchmark: false,
};

const guilds = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/guilds.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	},
});

const discordUsers = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/discordUsers.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const serverActivity = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/serverActivity.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const processQueue = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/processQueue.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const osuData = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/osuData.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const elitiriData = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/elitiriData.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const multiScores = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/multiScores.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const multiMatches = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/multiMatches.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const multiGames = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/multiGames.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const multiGameScores = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/multiGameScores.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const beatmaps = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/beatmaps.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const soloScores = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXROOTPATH}/databases/soloScores.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const elitebotixBanchoProcessQueue = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: logging.logging,
	benchmark: logging.benchmark,
	storage: `${process.env.ELITEBOTIXBANCHOROOTPATH}/databases/processQueue.sqlite`,
	retry: {
		max: 25, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
	pool: {
		max: 7,
	}
});

const DBGuilds = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBGuilds`)(guilds, Sequelize.DataTypes);
const DBReactionRoles = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBReactionRoles`)(guilds, Sequelize.DataTypes);
const DBReactionRolesHeader = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBReactionRolesHeader`)(guilds, Sequelize.DataTypes);
const DBAutoRoles = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBAutoRoles`)(guilds, Sequelize.DataTypes);
const DBTemporaryVoices = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBTemporaryVoices`)(guilds, Sequelize.DataTypes);
const DBActivityRoles = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBActivityRoles`)(guilds, Sequelize.DataTypes);
const DBStarBoardMessages = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBStarBoardMessages`)(guilds, Sequelize.DataTypes);
const DBTickets = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBTickets`)(guilds, Sequelize.DataTypes);
const DBBirthdayGuilds = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBBirthdayGuilds`)(guilds, Sequelize.DataTypes);
const DBOsuGuildTrackers = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuGuildTrackers`)(guilds, Sequelize.DataTypes);

const DBDiscordUsers = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBDiscordUsers`)(discordUsers, Sequelize.DataTypes);

const DBServerUserActivity = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBServerUserActivity`)(serverActivity, Sequelize.DataTypes);

const DBProcessQueue = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBProcessQueue`)(processQueue, Sequelize.DataTypes);

const DBMOTDPoints = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBMOTDPoints`)(osuData, Sequelize.DataTypes);
const DBOsuTourneyFollows = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuTourneyFollows`)(osuData, Sequelize.DataTypes);
const DBDuelRatingHistory = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBDuelRatingHistory`)(osuData, Sequelize.DataTypes);
const DBOsuForumPosts = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuForumPosts`)(osuData, Sequelize.DataTypes);
const DBOsuTrackingUsers = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuTrackingUsers`)(osuData, Sequelize.DataTypes);
const DBOsuMappools = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMappools`)(osuData, Sequelize.DataTypes);
const DBOsuPoolAccess = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuPoolAccess`)(osuData, Sequelize.DataTypes);
const DBOsuTeamSheets = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuTeamSheets`)(osuData, Sequelize.DataTypes);

const DBElitiriCupSignUp = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBElitiriCupSignUp`)(elitiriData, Sequelize.DataTypes);
const DBElitiriCupStaff = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBElitiriCupStaff`)(elitiriData, Sequelize.DataTypes);
const DBElitiriCupSubmissions = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBElitiriCupSubmissions`)(elitiriData, Sequelize.DataTypes);
const DBElitiriCupLobbies = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBElitiriCupLobbies`)(elitiriData, Sequelize.DataTypes);

const DBOsuMultiScores = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMultiScores`)(multiScores, Sequelize.DataTypes);

const DBOsuMultiMatches = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMultiMatches`)(multiMatches, Sequelize.DataTypes);

const DBOsuMultiGames = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMultiGames`)(multiGames, Sequelize.DataTypes);

const DBOsuMultiGameScores = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMultiGameScores`)(multiGameScores, Sequelize.DataTypes);

const DBOsuBeatmaps = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuBeatmaps`)(beatmaps, Sequelize.DataTypes);

const DBOsuSoloScores = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuSoloScores`)(soloScores, Sequelize.DataTypes);

const DBElitebotixBanchoProcessQueue = require(`${process.env.ELITEBOTIXBANCHOROOTPATH}/models/DBProcessQueue`)(elitebotixBanchoProcessQueue, Sequelize.DataTypes);

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
	DBOsuGuildTrackers,
	DBOsuSoloScores,
	DBOsuMappools,
	DBOsuPoolAccess,
	DBOsuTeamSheets,
	DBOsuMultiMatches,
	DBOsuMultiGames,
	DBOsuMultiGameScores,
	DBElitebotixBanchoProcessQueue,
};
