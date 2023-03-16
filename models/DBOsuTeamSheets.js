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
		paranoid: true,
	});
};