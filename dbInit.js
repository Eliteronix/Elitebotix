// eslint-disable-next-line no-console
console.log('Syncing databases...');
const Sequelize = require('sequelize');

require('dotenv').config();

const fs = require('fs');

//Check if the maps folder exists and create it if necessary
if (!fs.existsSync('./databases')) {
	fs.mkdirSync('./databases');
}

const sequelize = new Sequelize('elitebotix', 'elitebotix', process.env.POSTGRESQLPASSWORD, {
	dialect: 'postgres',
	host: 'localhost',
	port: 5432,
	pool: {
		max: 10,
		min: 2,
		acquire: 30000,
		idle: 10000,
	},
});

sequelize.authenticate()
	.then(() => console.log('✅ Connection successful'))
	.catch(err => console.error('❌ Connection failed:', err));

return;

// THIS STUFF IS NOT TESTED OR SET UP IN ANY WAY PAST THE CHANGE TO POSTGRESQL; IDK WHAT WILL OR WILL NOT WORK, BUT IT SHOULD BE A GOOD STARTING POINT FOR THE TRANSITION

require('./models/DBGuilds')(sequelize, Sequelize.DataTypes);
require('./models/DBReactionRoles')(sequelize, Sequelize.DataTypes);
require('./models/DBReactionRolesHeader')(sequelize, Sequelize.DataTypes);
require('./models/DBAutoRoles')(sequelize, Sequelize.DataTypes);
require('./models/DBTemporaryVoices')(sequelize, Sequelize.DataTypes);
require('./models/DBActivityRoles')(sequelize, Sequelize.DataTypes);
require('./models/DBStarBoardMessages')(sequelize, Sequelize.DataTypes);
require('./models/DBTickets')(sequelize, Sequelize.DataTypes);
require('./models/DBBirthdayGuilds')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuGuildTrackers')(sequelize, Sequelize.DataTypes);

require('./models/DBDiscordUsers')(sequelize, Sequelize.DataTypes);

require('./models/DBServerUserActivity')(sequelize, Sequelize.DataTypes);

require('./models/DBProcessQueue')(sequelize, Sequelize.DataTypes);

require('./models/DBMOTDPoints')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuTourneyFollows')(sequelize, Sequelize.DataTypes);
require('./models/DBDuelRatingHistory')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuForumPosts')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuTrackingUsers')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuMappools')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuPoolAccess')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuTeamSheets')(sequelize, Sequelize.DataTypes);

require('./models/DBElitiriCupSignUp')(sequelize, Sequelize.DataTypes);
require('./models/DBElitiriCupStaff')(sequelize, Sequelize.DataTypes);
require('./models/DBElitiriCupSubmissions')(sequelize, Sequelize.DataTypes);
require('./models/DBElitiriCupLobbies')(sequelize, Sequelize.DataTypes);

require('./models/DBOsuMultiMatches')(sequelize, Sequelize.DataTypes);

require('./models/DBOsuMultiGames')(sequelize, Sequelize.DataTypes);

require('./models/DBOsuMultiGameScores')(sequelize, Sequelize.DataTypes);

require('./models/DBOsuBeatmaps')(sequelize, Sequelize.DataTypes);

require('./models/DBOsuSoloScores')(sequelize, Sequelize.DataTypes);

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

multiMatches.sync({ alter: true })
	.then(async () => {
		// eslint-disable-next-line no-console
		console.log('multiMatches database synced');
		multiMatches.close();
	})
	.catch(console.error);

// multiGames.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('multiGames database synced');
// 		multiGames.close();
// 	})
// 	.catch(console.error);

// multiGameScores.sync({ alter: true })
// 	.then(async () => {
// 		// eslint-disable-next-line no-console
// 		console.log('multiGameScores database synced');
// 		multiGameScores.close();
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