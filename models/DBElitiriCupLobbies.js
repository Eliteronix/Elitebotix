module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriCupLobbies', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		tournamentName: {
			type: DataTypes.STRING,
			field: 'tournamentname',
		},
		lobbyId: {
			type: DataTypes.STRING,
			field: 'lobbyid',
		},
		lobbyDate: {
			type: DataTypes.DATE,
			field: 'lobbydate',
		},
		bracketName: {
			type: DataTypes.STRING,
			field: 'bracketname',
		},
		refDiscordTag: {
			type: DataTypes.STRING,
			field: 'refdiscordtag',
		},
		refOsuUserId: {
			type: DataTypes.STRING,
			field: 'refosuuserid',
		},
		refOsuName: {
			type: DataTypes.STRING,
			field: 'refosuname',
		},
	}, {
		tableName: 'dbelitiricuplobbies',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
