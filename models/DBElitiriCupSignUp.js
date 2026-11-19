module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriCupSignUp', {
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
		discordTag: {
			type: DataTypes.STRING,
			field: 'discordtag',
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
		osuName: {
			type: DataTypes.STRING,
			field: 'osuname',
		},
		osuBadges: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'osubadges',
		},
		osuPP: {
			type: DataTypes.STRING,
			field: 'osupp',
		},
		osuRank: {
			type: DataTypes.STRING,
			field: 'osurank',
		},
		bracketName: {
			type: DataTypes.STRING,
			field: 'bracketname',
		},
		saturdayEarlyAvailability: {
			type: DataTypes.INTEGER,
			field: 'saturdayearlyavailability',
		},
		saturdayLateAvailability: {
			type: DataTypes.INTEGER,
			field: 'saturdaylateavailability',
		},
		sundayEarlyAvailability: {
			type: DataTypes.INTEGER,
			field: 'sundayearlyavailability',
		},
		sundayLateAvailability: {
			type: DataTypes.INTEGER,
			field: 'sundaylateavailability',
		},
		lowerDifficulty: {
			type: DataTypes.FLOAT,
			field: 'lowerdifficulty',
		},
		upperDifficulty: {
			type: DataTypes.FLOAT,
			field: 'upperdifficulty',
		},
		tournamentName: {
			type: DataTypes.STRING,
			field: 'tournamentname',
		},
		rankAchieved: {
			type: DataTypes.STRING,
			field: 'rankachieved',
		},
		tournamentLobbyId: {
			type: DataTypes.STRING,
			field: 'tournamentlobbyid',
		},
	}, {
		tableName: 'dbelitiricupsignups',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
