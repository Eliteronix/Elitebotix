module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBMOTDPoints', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'userid',
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
		osuRank: {
			type: DataTypes.STRING,
			field: 'osurank',
		},
		totalPoints: {
			type: DataTypes.STRING,
			field: 'totalpoints',
		},
		qualifierPoints: {
			type: DataTypes.STRING,
			field: 'qualifierpoints',
		},
		qualifierRank: {
			type: DataTypes.STRING,
			field: 'qualifierrank',
		},
		qualifierPlayers: {
			type: DataTypes.STRING,
			field: 'qualifierplayers',
		},
		knockoutPoints: {
			type: DataTypes.STRING,
			field: 'knockoutpoints',
		},
		knockoutRank: {
			type: DataTypes.STRING,
			field: 'knockoutrank',
		},
		knockoutPlayers: {
			type: DataTypes.STRING,
			field: 'knockoutplayers',
		},
		knockoutRound: {
			type: DataTypes.STRING,
			field: 'knockoutround',
		},
		maxQualifierPoints: {
			type: DataTypes.STRING,
			field: 'maxqualifierpoints',
		},
		matchDate: {
			type: DataTypes.DATE,
			field: 'matchdate',
		},
	}, {
		tableName: 'dbmotdpoints',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
