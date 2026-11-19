module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBBirthdayGuilds', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'userid',
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'guildid',
		},
		birthdayTime: {
			type: DataTypes.DATE,
			field: 'birthdaytime',
		},
	}, {
		tableName: 'dbbirthdayguilds',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};