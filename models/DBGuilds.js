module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBGuilds', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
		},
		guildName: DataTypes.STRING,
		customPrefixUsed: DataTypes.BOOLEAN,
		customPrefix: DataTypes.STRING,
		dadmodeEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		sendWelcomeMessage: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		welcomeMessageChannel: DataTypes.STRING,
		welcomeMessageText: DataTypes.STRING,
		sendGoodbyeMessage: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		goodbyeMessageChannel: DataTypes.STRING,
		goodbyeMessageText: DataTypes.STRING,
	});
};