module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuTrackingUsers', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
		},
		nextCheck: {
			type: DataTypes.DATE,
		},
		minutesBetweenChecks: {
			type: DataTypes.INTEGER,
			defaultValue: 15,
		},
		paranoid: true,
	});
};
