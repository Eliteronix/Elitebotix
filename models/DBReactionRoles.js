module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBReactionRoles', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		dbReactionRolesHeaderId: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
		},
		roleId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		emoji: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		paranoid: true,
	});
};