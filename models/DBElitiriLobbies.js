module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriLobbies', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		tournament: {
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
		refdiscordTag: {
			type: DataTypes.STRING,
		},
		refOsuUserId: {
			type: DataTypes.STRING,
		},
		refOsuName: {
			type: DataTypes.STRING,
		},
	});
};
