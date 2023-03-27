// eslint-disable-next-line no-console
console.log('Syncing databases...');
const Sequelize = require('sequelize');

const fs = require('fs');

//Check if the maps folder exists and create it if necessary
if (!fs.existsSync('./databases')) {
	fs.mkdirSync('./databases');
}

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

const soloScores = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'databases/soloScores.sqlite',
	retry: {
		max: 15, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
});

const battlePass = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'databases/battlePass.sqlite',
	retry: {
		max: 15, // Maximum retry 15 times
		backoffBase: 100, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.14, // Exponent to increase backoff each try. Default: 1.1
	},
});

require('./models/DBGuilds')(guilds, Sequelize.DataTypes);
require('./models/DBReactionRoles')(guilds, Sequelize.DataTypes);
require('./models/DBReactionRolesHeader')(guilds, Sequelize.DataTypes);
require('./models/DBAutoRoles')(guilds, Sequelize.DataTypes);
require('./models/DBTemporaryVoices')(guilds, Sequelize.DataTypes);
require('./models/DBActivityRoles')(guilds, Sequelize.DataTypes);
require('./models/DBStarBoardMessages')(guilds, Sequelize.DataTypes);
require('./models/DBTickets')(guilds, Sequelize.DataTypes);
require('./models/DBBirthdayGuilds')(guilds, Sequelize.DataTypes);
require('./models/DBOsuGuildTrackers')(guilds, Sequelize.DataTypes);

require('./models/DBDiscordUsers')(discordUsers, Sequelize.DataTypes);

require('./models/DBServerUserActivity')(serverActivity, Sequelize.DataTypes);

require('./models/DBProcessQueue')(processQueue, Sequelize.DataTypes);

require('./models/DBMOTDPoints')(osuData, Sequelize.DataTypes);
require('./models/DBOsuTourneyFollows')(osuData, Sequelize.DataTypes);
require('./models/DBDuelRatingHistory')(osuData, Sequelize.DataTypes);
require('./models/DBOsuForumPosts')(osuData, Sequelize.DataTypes);
require('./models/DBOsuTrackingUsers')(osuData, Sequelize.DataTypes);
require('./models/DBOsuMappools')(osuData, Sequelize.DataTypes);
require('./models/DBOsuPoolAccess')(osuData, Sequelize.DataTypes);
require('./models/DBOsuTeamSheets')(osuData, Sequelize.DataTypes);

require('./models/DBElitiriCupSignUp')(elitiriData, Sequelize.DataTypes);
require('./models/DBElitiriCupStaff')(elitiriData, Sequelize.DataTypes);
require('./models/DBElitiriCupSubmissions')(elitiriData, Sequelize.DataTypes);
require('./models/DBElitiriCupLobbies')(elitiriData, Sequelize.DataTypes);

require('./models/DBOsuMultiScores')(multiScores, Sequelize.DataTypes);

require('./models/DBOsuBeatmaps')(beatmaps, Sequelize.DataTypes);

require('./models/DBOsuSoloScores')(soloScores, Sequelize.DataTypes);

require('./models/DBInventory')(battlePass, Sequelize.DataTypes);
require('./models/DBOsuBattlepass')(battlePass, Sequelize.DataTypes);
require('./models/DBOsuQuests')(battlePass, Sequelize.DataTypes);

// guilds.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('guilds database synced');
// 		guilds.close();
// 	})
// 	.catch(console.error);

// discordUsers.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('discordUsers database synced');
// 		discordUsers.close();
// 	})
// 	.catch(console.error);

// serverActivity.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('serverActivity database synced');
// 		serverActivity.close();
// 	})
// 	.catch(console.error);

// processQueue.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('processQueue database synced');
// 		processQueue.close();
// 	})
// 	.catch(console.error);

// osuData.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('osuData database synced');
// 		osuData.close();
// 	})
// 	.catch(console.error);

// elitiriData.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('elitiriData database synced');
// 		elitiriData.close();
// 	})
// 	.catch(console.error);

// multiScores.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('multiScores database synced');
// 		multiScores.close();
// 	})
// 	.catch(console.error);

// beatmaps.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('beatmaps database synced');
// 		beatmaps.close();
// 	})
// 	.catch(console.error);

// soloScores.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('soloScores database synced');
// 		soloScores.close();
// 	})
// 	.catch(console.error);

battlePass.sync({ alter: true })
	.then(async () => {
		// eslint-disable-next-line no-console
		console.log('battlePass database synced');
		battlePass.close();
	})
	.catch(console.error);