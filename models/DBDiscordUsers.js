module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBDiscordUsers', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		osuUserId: {
			type: DataTypes.STRING,
		},
		osuVerificationCode: {
			type: DataTypes.STRING,
		},
		osuVerified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		paranoid: true,
	});
};
