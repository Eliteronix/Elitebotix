module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuTourneyFollows', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.STRING,
			field: 'userid',
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
	}, {
		tableName: 'dbosutourneyfollows',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};