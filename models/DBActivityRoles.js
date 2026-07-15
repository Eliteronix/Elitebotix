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
			field: 'guildid',
		},
		roleId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'roleid',
		},
		rankCutoff: {
			type: DataTypes.STRING,
			field: 'rankcutoff',
		},
		percentageCutoff: {
			type: DataTypes.DOUBLE,
			field: 'percentagecutoff',
		},
		pointsCutoff: {
			type: DataTypes.STRING,
			field: 'pointscutoff',
		},
	}, {
		tableName: 'dbactivityroles',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};