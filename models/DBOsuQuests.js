module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuQuests', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: DataTypes.STRING,
		type: DataTypes.STRING,
		progress: DataTypes.INTEGER,
	});
};