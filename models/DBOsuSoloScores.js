module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuSoloScores', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		uploaderId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		beatmapHash: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		maxCombo: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
		},
		mode: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		mods: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
		},
		count50: DataTypes.INTEGER,
		count100: DataTypes.INTEGER,
		count300: DataTypes.INTEGER,
		countMiss: DataTypes.INTEGER,
		countKatu: DataTypes.INTEGER,
		countGeki: DataTypes.INTEGER,
		perfectCombo: DataTypes.BOOLEAN,
		onlineScoreId: DataTypes.STRING,
		playerName: DataTypes.STRING,
		replayHash: DataTypes.STRING,
		score: DataTypes.INTEGER,
		timestamp: DataTypes.STRING,
		version: DataTypes.STRING,
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['uploaderId', 'beatmapHash', 'playerName']
			}
		]
	});
};