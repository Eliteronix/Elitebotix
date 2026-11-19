module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuTrackingUsers', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
		nextCheck: {
			type: DataTypes.DATE,
			field: 'nextcheck',
		},
		minutesBetweenChecks: {
			type: DataTypes.INTEGER,
			defaultValue: 15,
			field: 'minutesbetweenchecks',
		},
	}, {
		tableName: 'dbosutrackingusers',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
