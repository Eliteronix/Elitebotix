const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
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

module.exports = { DBGuilds, DBReactionRoles, DBReactionRolesHeader, DBAutoRoles, DBTemporaryVoices, DBDiscordUsers, DBServerUserActivity, DBProcessQueue, DBActivityRoles };