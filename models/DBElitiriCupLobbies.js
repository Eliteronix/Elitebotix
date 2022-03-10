module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriCupLobbies', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		tournamentName: {
			type: DataTypes.STRING,
		},
		lobbyId: {
			type: DataTypes.STRING,
		},
		lobbyDate: {
			type: DataTypes.DATE,
		},
		bracketName: {
			type: DataTypes.STRING,
		},
		refDiscordTag: {
			type: DataTypes.STRING,
		},
		refOsuUserId: {
			type: DataTypes.STRING,
		},
		refOsuName: {
			type: DataTypes.STRING,
		},
		paranoid: true,
	});
};
