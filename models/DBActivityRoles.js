module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBActivityRoles', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		roleId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		rankCutoff: DataTypes.STRING,
		percentageCutoff: DataTypes.DOUBLE,
		pointsCutoff: DataTypes.STRING,
		paranoid: true,
	});
};