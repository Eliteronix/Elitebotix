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
		},
		userId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		points: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
		},
		paranoid: true,
	});
};
