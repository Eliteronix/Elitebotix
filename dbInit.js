console.log('Syncing database...');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
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
require('./models/DBElitiriCupSubmissions')(sequelize, Sequelize.DataTypes);
require('./models/DBStarBoardMessages')(sequelize, Sequelize.DataTypes);
require('./models/DBTickets')(sequelize, Sequelize.DataTypes);
require('./models/DBOsuMultiScores')(sequelize, Sequelize.DataTypes);
sequelize.sync({ alter: true })
	.then(async () => {
		console.log('Database synced');
		sequelize.close();
	})
	.catch(console.error);