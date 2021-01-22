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
	const ReactionRolesHeaderList = await ReactionRolesHeader.findAll();

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
			guildId: GuildsList[i].guildId, guildName: GuildsList[i].guildName, customPrefixUsed: GuildsList[i].customPrefixUsed, customPrefix: GuildsList[i].customPrefix,
			dadmodeEnabled: GuildsList[i].dadmodeEnabled, sendWelcomeMessage: GuildsList[i].sendWelcomeMessage, welcomeMessageChannel: GuildsList[i].welcomeMessageChannel,
			welcomeMessageText: GuildsList[i].welcomeMessageText, sendGoodbyeMessage: GuildsList[i].sendGoodbyeMessage,
			goodbyeMessageChannel: GuildsList[i].goodbyeMessageChannel, goodbyeMessageText: GuildsList[i].goodbyeMessageText
		});
	}
	const DBGuildsList = await DBGuilds.findAll();
	console.log('----------DBGuilds----------');
	console.log(DBGuildsList);

	console.log('----------ReactionRoles----------');
	console.log(ReactionRolesList);
	for (let i = 0; i < ReactionRolesList.length; i++) {
		await DBReactionRoles.create({
			dbReactionRolesHeaderId: ReactionRolesList[i].headerId, roleId: ReactionRolesList[i].roleId, emoji: ReactionRolesList[i].emoji,
			description: ReactionRolesList[i].description
		});
	}
	const DBReactionRolesList = await DBReactionRoles.findAll();
	console.log('----------DBReactionRoles----------');
	console.log(DBReactionRolesList);

	console.log('----------ReactionRolesHeader----------');
	console.log(ReactionRolesHeaderList);
	for (let i = 0; i < ReactionRolesHeaderList.length; i++) {
		await DBReactionRolesHeader.create({
			guildId: ReactionRolesHeaderList[i].guildId, reactionHeaderId: ReactionRolesHeaderList[i].reactionHeaderId,
			reactionChannelHeaderId: ReactionRolesHeaderList[i].reactionChannelHeaderId, reactionTitle: ReactionRolesHeaderList[i].reactionTitle,
			reactionColor: ReactionRolesHeaderList[i].reactionColor, reactionDescription: ReactionRolesHeaderList[i].reactionDescription,
			reactionImage: ReactionRolesHeaderList[i].reactionImage
		});
		if (i === 2) {
			await DBReactionRolesHeader.create({
				guildId: 'filler', reactionHeaderId: 0,
				reactionChannelHeaderId: 0, reactionTitle: 'filler',
				reactionColor: 'filler', reactionDescription: 'filler',
				reactionImage: 'filler'
			});
		}
	}
	const DBReactionRolesHeaderList = await DBReactionRolesHeader.findAll();
	console.log('----------DBReactionRolesHeader----------');
	console.log(DBReactionRolesHeaderList);

	await AutoRoles.drop();
	console.log('AutoRoles dropped!');
	await ReactionRoles.drop();
	console.log('ReactionRoles dropped!');
	await ReactionRolesHeader.drop();
	console.log('ReactionRolesHeader dropped!');
	await TemporaryVoice.drop();
	console.log('TemporaryVoice dropped!');
	await Guilds.drop();
	console.log('Guilds dropped!');

	console.log('Following files have to be adapted to the new Tables:');
	console.log('dbObjects.js: All of them');
	console.log('dbInit.js: All of them');
	console.log('MODELS: Delete the old models');

	sequelize.close();
}
