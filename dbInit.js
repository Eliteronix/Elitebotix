const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

require('./models/Guilds')(sequelize, Sequelize.DataTypes);
require('./models/ReactionRoles')(sequelize, Sequelize.DataTypes);
require('./models/ReactionRolesHeader')(sequelize, Sequelize.DataTypes);
require('./models/AutoRoles')(sequelize, Sequelize.DataTypes);

sequelize.sync({ alter: true })
	.then(async () => {
		console.log('Database synced');
		sequelize.close();
	})
	.catch(console.error);