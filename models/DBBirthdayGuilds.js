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
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		guildName: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		birthdayEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	});
};