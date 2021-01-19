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
const AutoRoles = require('./models/AutoRoles')(sequelize, Sequelize.DataTypes);
const TemporaryVoice = require('./models/TemporaryVoice')(sequelize, Sequelize.DataTypes);

const DBGuilds = require('./models/DBGuilds')(sequelize, Sequelize.DataTypes);
const DBReactionRoles = require('./models/DBReactionRoles')(sequelize, Sequelize.DataTypes);
const DBReactionRolesHeader = require('./models/DBReactionRolesHeader')(sequelize, Sequelize.DataTypes);
const DBAutoRoles = require('./models/DBAutoRoles')(sequelize, Sequelize.DataTypes);
const DBTemporaryVoices = require('./models/DBTemporaryVoices')(sequelize, Sequelize.DataTypes);

ReactionRolesHeader.belongsTo(Guilds, { foreignKey: 'guildId', as: 'Guild' });
ReactionRoles.belongsTo(ReactionRolesHeader, { foreignKey: 'ReactionRolesHeaderId', as: 'ReactionRolesHeader' });
AutoRoles.belongsTo(Guilds, { foreignKey: 'guildId', as: 'Guild' });
TemporaryVoice.belongsTo(Guilds, { foreignKey: 'guildId', as: 'Guild' });

module.exports = { Guilds, ReactionRoles, ReactionRolesHeader, AutoRoles, TemporaryVoice, DBGuilds, DBReactionRoles, DBReactionRolesHeader, DBAutoRoles, DBTemporaryVoices };