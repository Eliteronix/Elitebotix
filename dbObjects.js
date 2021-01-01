const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Guilds = require('./models/Guilds')(sequelize, Sequelize.DataTypes);
const ReactionRoles = require('./models/ReactionRoles')(sequelize, Sequelize.DataTypes);
const ReactionRolesHeader = require('./models/ReactionRolesHeader')(sequelize, Sequelize.DataTypes);

ReactionRolesHeader.belongsTo(Guilds, { foreignKey: 'guildId', as: 'Guild' });
ReactionRoles.belongsTo(ReactionRolesHeader, { foreignKey: 'ReactionRolesHeaderId', as: 'ReactionRolesHeader' });

module.exports = { Guilds, ReactionRoles, ReactionRolesHeader };