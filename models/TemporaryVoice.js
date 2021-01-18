module.exports = (sequelize, DataTypes) => {
	return sequelize.define('TemporaryVoice', {
		temporaryVoiceId: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		channelId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
	});
};