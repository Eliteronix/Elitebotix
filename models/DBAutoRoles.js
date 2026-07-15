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
			field: 'guildid',
		},
		roleId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'roleid',
		},
	}, {
		tableName: 'dbautoroles',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};