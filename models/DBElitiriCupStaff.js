module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriCupStaff', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
		tournamentName: {
			type: DataTypes.STRING,
			field: 'tournamentname',
		},
		host: {
			type: DataTypes.BOOLEAN,
			field: 'host',
		},
		streamer: {
			type: DataTypes.BOOLEAN,
			field: 'streamer',
		},
		commentator: {
			type: DataTypes.BOOLEAN,
			field: 'commentator',
		},
		referee: {
			type: DataTypes.BOOLEAN,
			field: 'referee',
		},
		replayer: {
			type: DataTypes.BOOLEAN,
			field: 'replayer',
		},
	}, {
		tableName: 'dbelitiricupstaffs',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
