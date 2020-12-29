module.exports = (sequelize, DataTypes) => {
	return Guilds = sequelize.define('Guilds', {
		guildId: {
			type: DataTypes.STRING,
			primaryKey: true,
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
		WelcomeMessageChannel: DataTypes.STRING,
		WelcomeMessageText: DataTypes.STRING,
		sendGoodbyeMessage: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		WelcomeGoodbyeChannel: DataTypes.STRING,
		WelcomeGoodbyeText: DataTypes.STRING,
	});
};