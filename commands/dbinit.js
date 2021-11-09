const { developers } = require('../config.json');
module.exports = {
	name: 'dbinit',
	// aliases: ['leaderboard', 'ranking'],
	description: 'Initializes the database',
	// usage: '<server/osu>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	// botPermissions: 'ATTACH_FILES',
	// botPermissionsTranslated: 'Attach Files',
	// guildOnly: true,
	// args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (developers.includes(msg.author.id)) {
			console.log('Syncing database...');
			const Sequelize = require('sequelize');

			const sequelize = new Sequelize('database', 'username', 'password', {
				host: 'localhost',
				dialect: 'sqlite',
				logging: false,
				storage: 'database.sqlite',
			});

			require('../models/DBGuilds')(sequelize, Sequelize.DataTypes);
			require('../models/DBReactionRoles')(sequelize, Sequelize.DataTypes);
			require('../models/DBReactionRolesHeader')(sequelize, Sequelize.DataTypes);
			require('../models/DBAutoRoles')(sequelize, Sequelize.DataTypes);
			require('../models/DBTemporaryVoices')(sequelize, Sequelize.DataTypes);
			require('../models/DBDiscordUsers')(sequelize, Sequelize.DataTypes);
			require('../models/DBServerUserActivity')(sequelize, Sequelize.DataTypes);
			require('../models/DBProcessQueue')(sequelize, Sequelize.DataTypes);
			require('../models/DBActivityRoles')(sequelize, Sequelize.DataTypes);
			require('../models/DBMOTDPoints')(sequelize, Sequelize.DataTypes);
			require('../models/DBElitiriCupSignUp')(sequelize, Sequelize.DataTypes);
			require('../models/DBElitiriCupSubmissions')(sequelize, Sequelize.DataTypes);
			require('../models/DBStarBoardMessages')(sequelize, Sequelize.DataTypes);
			require('../models/DBTickets')(sequelize, Sequelize.DataTypes);
			require('../models/DBOsuMultiScores')(sequelize, Sequelize.DataTypes);
			require('../models/DBOsuBeatmaps')(sequelize, Sequelize.DataTypes);

			sequelize.sync({ alter: true })
				.then(async () => {
					console.log('Database synced');
					sequelize.close();
				})
				.catch(console.error);
		}
	},
};