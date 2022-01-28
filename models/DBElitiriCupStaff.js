module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriCupStaff', {
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
		bracketName: {
			type: DataTypes.STRING,
		},
		tournamentName: {
			type: DataTypes.STRING,
		},
		host: {
			type: DataTypes.BOOLEAN,
		},
		streamer: {
			type: DataTypes.BOOLEAN,
		},
		commentator: {
			type: DataTypes.BOOLEAN,
		},
		referee: {
			type: DataTypes.BOOLEAN,
		},
		paranoid: true,
	});
};
