//Import Tables
const { DBTemporaryVoices, DBAutoRoles, DBGuilds, DBReactionRoles, DBReactionRolesHeader, AutoRoles, Guilds, ReactionRoles, ReactionRolesHeader, TemporaryVoice } = require('./dbObjects');

const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: true,
	storage: 'database.sqlite',
});

require('./models/TemporaryVoice')(sequelize, Sequelize.DataTypes);
require('./models/AutoRoles')(sequelize, Sequelize.DataTypes);
require('./models/ReactionRoles')(sequelize, Sequelize.DataTypes);
require('./models/ReactionRolesHeader')(sequelize, Sequelize.DataTypes);
require('./models/Guilds')(sequelize, Sequelize.DataTypes);

require('./models/DBTemporaryVoices')(sequelize, Sequelize.DataTypes);
require('./models/DBAutoRoles')(sequelize, Sequelize.DataTypes);
require('./models/DBReactionRoles')(sequelize, Sequelize.DataTypes);
require('./models/DBReactionRolesHeader')(sequelize, Sequelize.DataTypes);
require('./models/DBGuilds')(sequelize, Sequelize.DataTypes);

moveData();

async function moveData() {

	await DBAutoRoles.sync({ force: true });
	console.log('DBAutoRoles synced');

	await DBGuilds.sync({ force: true });
	console.log('DBGuilds synced');

	await DBReactionRoles.sync({ force: true });
	console.log('DBReactionRoles synced');

	await DBReactionRolesHeader.sync({ force: true });
	console.log('DBReactionRolesHeader synced');

	await DBTemporaryVoices.sync({ force: true });
	console.log('DBTemporaryVoices synced');

	const AutoRolesList = await AutoRoles.findAll();
	const GuildsList = await Guilds.findAll();
	const ReactionRolesList = await ReactionRoles.findAll();
	// const ReactionRolesHeaderList = await ReactionRolesHeader.findAll();
	// const TemporaryVoiceList = await TemporaryVoice.findAll();

	console.log('----------AutoRoles----------');
	console.log(AutoRolesList);
	for (let i = 0; i < AutoRolesList.length; i++) {
		await DBAutoRoles.create({
			guildId: AutoRolesList[i].guildId, roleId: AutoRolesList[i].roleId
		});
	}
	const DBAutoRolesList = await DBAutoRoles.findAll();
	console.log('----------DBAutoRoles----------');
	console.log(DBAutoRolesList);

	console.log('----------Guilds----------');
	console.log(GuildsList);
	for (let i = 0; i < GuildsList.length; i++) {
		await DBGuilds.create({
			guildId: GuildsList[i].guildId, roleId: GuildsList[i].roleId //Change fields
		});
	}
	const DBGuildsList = await DBGuilds.findAll();
	console.log('----------DBGuilds----------');
	console.log(DBGuildsList);

	console.log('----------ReactionRoles----------');
	console.log(ReactionRolesList);
	for (let i = 0; i < ReactionRolesList.length; i++) {
		await DBReactionRoles.create({
			guildId: ReactionRolesList[i].guildId, roleId: ReactionRolesList[i].roleId //Change fields
		});
	}
	const DBReactionRolesList = await DBReactionRoles.findAll();
	console.log('----------DBReactionRoles----------');
	console.log(DBReactionRolesList);

	sequelize.close();
}
