module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuTourneyFollows', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: DataTypes.STRING,
		osuUserId: DataTypes.STRING,
		paranoid: true,
	});
};