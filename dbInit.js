const Sequelize = require('sequelize');

// //Import ReactionRolesHeader Table
// const { ReactionRolesHeader } = require('./dbObjects');

// //Import ReactionRoles Table
// const { ReactionRoles } = require('./dbObjects');

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

// ReactionRolesHeader.sync({ force: true })
// 	.then(async () => {
// 		console.log('Database synced');
// 		sequelize.close();
// 	})
// 	.catch(console.error);
// ReactionRoles.sync({ force: true })
// 	.then(async () => {
// 		console.log('Database synced');
// 		sequelize.close();
// 	})
// 	.catch(console.error);

sequelize.sync({ alter: true })
	.then(async () => {
		console.log('Database synced');
		sequelize.close();
	})
	.catch(console.error);