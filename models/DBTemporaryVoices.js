module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBTemporaryVoices', {
		id: {
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
		textChannelId: DataTypes.STRING,
		creatorId: DataTypes.STRING,
		paranoid: true,
	});
};
