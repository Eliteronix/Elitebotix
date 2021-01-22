module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBAutoRoles', {
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
		paranoid: true,
	});
};