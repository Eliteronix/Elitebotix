module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuBattlepass', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: DataTypes.STRING,
		experience: DataTypes.INTEGER,
	});
};