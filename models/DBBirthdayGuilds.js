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
		birthdayTime: {
			type: DataTypes.DATE,
		},
	});
};