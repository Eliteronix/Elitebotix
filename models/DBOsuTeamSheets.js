module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuTeamSheets', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: DataTypes.STRING,
		channelId: DataTypes.STRING,
		messageId: DataTypes.STRING,
		updateUntil: DataTypes.DATE,
		players: DataTypes.STRING,
		poolName: DataTypes.STRING,
		poolCreatorId: DataTypes.STRING,
		teamsize: DataTypes.INTEGER,
		duelRatingEstimate: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		EZMultiplier: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 1.75,
		},
		FLMultiplier: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 1.5,
		},
		paranoid: true,
	});
};