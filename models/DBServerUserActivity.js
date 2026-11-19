module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBServerUserActivity', {
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
		userId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'userid',
		},
		points: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			field: 'points',
		},
	}, {
		tableName: 'dbserveruseractivities',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
