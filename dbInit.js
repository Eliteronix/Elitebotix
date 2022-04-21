console.log('Syncing database...');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
	retry: {
		match: [/Deadlock/i],
		max: 10, // Maximum rety 3 times
		backoffBase: 1000, // Initial backoff duration in ms. Default: 100,
		backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
	},
});

require('./models/DBGuilds')(sequelize, Sequelize.DataTypes);
require('./models/DBReactionRoles')(sequelize, Sequelize.DataTypes);
require('./models/DBReactionRolesHeader')(sequelize, Sequelize.DataTypes);
require('./models/DBAutoRoles')(sequelize, Sequelize.DataTypes);
require('./models/DBTemporaryVoices')(sequelize, Sequelize.DataTypes);
require('./models/DBDiscordUsers')(sequelize, Sequelize.DataTypes);
require('./models/DBServerUserActivity')(sequelize, Sequelize.DataTypes);
require('./models/DBProcessQueue')(sequelize, Sequelize.DataTypes);
require('./models/DBActivityRoles')(sequelize, Sequelize.DataTypes);
require('./models/DBMOTDPoints')(sequelize, Sequelize.DataTypes);
require('./models/DBElitiriCupSignUp')(sequelize, Sequelize.DataTypes);
require('./models/DBElitiriCupStaff')(sequelize, Sequelize.DataTypes);
require('./models/DBElitiriCupSubmissions')(sequelize, Sequelize.DataTypes);
require('./models/DBStarBoardMessages')(sequelize, Sequelize.DataTypes);
require('./models/DBTickets')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuMultiScores')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuBeatmaps')(sequelize, Sequelize.DataTypes);
require('./models/DBElitiriCupLobbies')(sequelize, Sequelize.DataTypes);
require('./models/DBBirthdayGuilds')(sequelize, Sequelize.DataTypes);
sequelize.sync({ alter: true })
	.then(async () => {
		console.log('Database synced');
		sequelize.close();
	})
	.catch(console.error);