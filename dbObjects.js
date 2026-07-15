const pg = require('pg');
pg.types.setTypeParser(20, val => parseInt(val, 10));

const Sequelize = require('sequelize');
require('dotenv').config();

const logging = {
	// logging: async (sql, timing) => {
	// if (process.shardId !== undefined) {
	// 	let operation = 'Unknown';
	// 	let table = 'Unknown';

	// 	if (sql.startsWith('Executed (default): SELECT')) {
	// 		operation = 'SELECT';
	// 		table = sql.replace(/.+FROM `/gm, '').replace(/`.+/gm, '');
	// 	} else if (sql.startsWith('Executed (default): UPDATE')) {
	// 		operation = 'UPDATE';
	// 		table = sql.replace(/.+UPDATE `/gm, '').replace(/`.+/gm, '');
	// 	} else if (sql.startsWith('Executed (default): INSERT')) {
	// 		operation = 'INSERT';
	// 		table = sql.replace(/.+INSERT INTO `/gm, '').replace(/`.+/gm, '');
	// 	} else if (sql.startsWith('Executed (default): DELETE')) {
	// 		operation = 'DELETE';
	// 		table = sql.replace(/.+DELETE FROM `/gm, '').replace(/`.+/gm, '');
	// 	} else {
	// 		//This shouldnt happen but if it does, we want to know about it
	// 		// eslint-disable-next-line no-console
	// 		console.log(sql);
	// 	}

	// 	process.send(`[${process.shardId}] Database access: ${operation} ${table} | ${timing}ms`);
	// }

	// if (timing > 8000) { // Only log if execution time is greater than 1000ms
	// 	// eslint-disable-next-line no-console
	// 	console.log(`[SLOW QUERY] (${timing} ms): ${sql}`);
	// }
	// },
	benchmark: true,
};

const elitebotixPostgres = new Sequelize('elitebotix', 'elitebotix', process.env.POSTGRESQLPASSWORD, {
	dialect: 'postgres',
	host: 'localhost',
	port: 5432,
	logging: async () => {
		if (process.shardId !== undefined) {
			process.send('DB postgres');
		}
	},
	benchmark: logging.benchmark,
	pool: {
		max: 10,
		min: 2,
		acquire: 30000,
		idle: 10000,
	},
});

elitebotixPostgres.authenticate()
	.then(() => console.log('✅ Connected to database'))
	.catch(err => console.error('❌ Failed to connect to database:', err));

const elitebotixBanchoProcessQueue = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: async () => {
		if (process.shardId !== undefined) {
			process.send('DB elitebotix_bancho_processQueue');
		}
	},
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

const DBGuilds = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBGuilds`)(elitebotixPostgres, Sequelize.DataTypes);
const DBReactionRoles = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBReactionRoles`)(elitebotixPostgres, Sequelize.DataTypes);
const DBReactionRolesHeader = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBReactionRolesHeader`)(elitebotixPostgres, Sequelize.DataTypes);
const DBAutoRoles = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBAutoRoles`)(elitebotixPostgres, Sequelize.DataTypes);
const DBTemporaryVoices = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBTemporaryVoices`)(elitebotixPostgres, Sequelize.DataTypes);
const DBActivityRoles = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBActivityRoles`)(elitebotixPostgres, Sequelize.DataTypes);
const DBStarBoardMessages = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBStarBoardMessages`)(elitebotixPostgres, Sequelize.DataTypes);
const DBTickets = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBTickets`)(elitebotixPostgres, Sequelize.DataTypes);
const DBBirthdayGuilds = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBBirthdayGuilds`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuGuildTrackers = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuGuildTrackers`)(elitebotixPostgres, Sequelize.DataTypes);
const DBDiscordUsers = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBDiscordUsers`)(elitebotixPostgres, Sequelize.DataTypes);
const DBServerUserActivity = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBServerUserActivity`)(elitebotixPostgres, Sequelize.DataTypes);
const DBProcessQueue = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBProcessQueue`)(elitebotixPostgres, Sequelize.DataTypes);
const DBMOTDPoints = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBMOTDPoints`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuTourneyFollows = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuTourneyFollows`)(elitebotixPostgres, Sequelize.DataTypes);
const DBDuelRatingHistory = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBDuelRatingHistory`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuForumPosts = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuForumPosts`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuTrackingUsers = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuTrackingUsers`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuMappools = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMappools`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuPoolAccess = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuPoolAccess`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuTeamSheets = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuTeamSheets`)(elitebotixPostgres, Sequelize.DataTypes);
const DBElitiriCupSignUp = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBElitiriCupSignUp`)(elitebotixPostgres, Sequelize.DataTypes);
const DBElitiriCupStaff = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBElitiriCupStaff`)(elitebotixPostgres, Sequelize.DataTypes);
const DBElitiriCupSubmissions = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBElitiriCupSubmissions`)(elitebotixPostgres, Sequelize.DataTypes);
const DBElitiriCupLobbies = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBElitiriCupLobbies`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuMultiMatches = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMultiMatches`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuMultiGames = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMultiGames`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuMultiGameScores = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuMultiGameScores`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuBeatmaps = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuBeatmaps`)(elitebotixPostgres, Sequelize.DataTypes);
const DBOsuSoloScores = require(`${process.env.ELITEBOTIXROOTPATH}/models/DBOsuSoloScores`)(elitebotixPostgres, Sequelize.DataTypes);

const DBElitebotixBanchoProcessQueue = require(`${process.env.ELITEBOTIXBANCHOROOTPATH}/models/DBProcessQueue`)(elitebotixBanchoProcessQueue, Sequelize.DataTypes);

// let ignoreSources = [
// 	'processQueueTasks\\updateOsuRank.js:88',
// 	'processQueueTasks\\updateOsuRank.js:96',
// 	'processQueueTasks\\updateOsuRank.js:248',
// 	'utils.js:4240',
// ];

// //Overwrite DBDiscordUsers findOne/findAll to also log call stack
// const originalFindOne = DBDiscordUsers.findOne;
// DBDiscordUsers.findOne = async function () {
// 	if (process.shardId !== undefined) {
// 		const err = new Error();
// 		const stack = err.stack.split('\n').slice(2).join('\n');
// 		if (!ignoreSources.some(source => stack.includes(source))) {
// 			console.log(`[${process.shardId}] DBDiscordUsers.findOne called from:\n${stack}`);
// 		}
// 	}
// 	return originalFindOne.apply(this, arguments);
// };

// const originalFindAll = DBDiscordUsers.findAll;
// DBDiscordUsers.findAll = async function () {
// 	if (process.shardId !== undefined) {
// 		const err = new Error();
// 		const stack = err.stack.split('\n').slice(2).join('\n');
// 		if (!ignoreSources.some(source => stack.includes(source))) {
// 			console.log(`[${process.shardId}] DBDiscordUsers.findAll called from:\n${stack}`);
// 		}
// 	}
// 	return originalFindAll.apply(this, arguments);
// };

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
