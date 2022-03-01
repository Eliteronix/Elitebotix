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
		},
		discordTag: {
			type: DataTypes.STRING
		},
		osuUserId: {
			type: DataTypes.STRING,
		},
		osuName: {
			type: DataTypes.STRING,
		},
		osuBadges: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		osuPP: {
			type: DataTypes.STRING,
		},
		osuRank: {
			type: DataTypes.STRING,
		},
		bracketName: {
			type: DataTypes.STRING,
		},
		saturdayEarlyAvailability: {
			type: DataTypes.INTEGER,
		},
		saturdayLateAvailability: {
			type: DataTypes.INTEGER,
		},
		sundayEarlyAvailability: {
			type: DataTypes.INTEGER,
		},
		sundayLateAvailability: {
			type: DataTypes.INTEGER,
		},
		lowerDifficulty: {
			type: DataTypes.FLOAT,
		},
		upperDifficulty: {
			type: DataTypes.FLOAT,
		},
		tournamentName: {
			type: DataTypes.STRING,
		},
		tournamentLobbyId: {
			type: DataTypes.STRING,
		},
		rankAchieved: {
			type: DataTypes.STRING,
		},
		lobbyId: {
			type: DataTypes.INTEGER,
		},
		paranoid: true,
	});
};
