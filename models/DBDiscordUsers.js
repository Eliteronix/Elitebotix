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
		osuName: {
			type: DataTypes.STRING,
		},
		osuPP: {
			type: DataTypes.STRING,
		},
		osuRank: {
			type: DataTypes.STRING,
		},
		taikoPP: {
			type: DataTypes.STRING,
		},
		taikoRank: {
			type: DataTypes.STRING,
		},
		catchPP: {
			type: DataTypes.STRING,
		},
		catchRank: {
			type: DataTypes.STRING,
		},
		maniaPP: {
			type: DataTypes.STRING,
		},
		maniaRank: {
			type: DataTypes.STRING,
		},
		osuMainServer: {
			type: DataTypes.STRING,
			defaultValue: 'bancho',
		},
		osuMainMode: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		osuMOTDRegistered: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		paranoid: true,
	});
};
