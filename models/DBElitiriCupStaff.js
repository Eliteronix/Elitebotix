module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriCupStaff', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
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
		replayer: {
			type: DataTypes.BOOLEAN,
		},
		paranoid: true,
	});
};
