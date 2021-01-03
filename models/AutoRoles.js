module.exports = (sequelize, DataTypes) => {
	return sequelize.define('AutoRoles', {
		autoRolesId: {
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
	});
};