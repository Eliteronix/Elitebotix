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
			field: 'dbreactionrolesheaderid',
		},
		roleId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'roleid',
		},
		emoji: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'emoji',
		},
		description: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'description',
		},
	}, {
		tableName: 'dbreactionroles',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};