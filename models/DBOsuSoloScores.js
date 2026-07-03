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
			field: 'uploaderid',
		},
		beatmapHash: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'beatmaphash',
		},
		maxCombo: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
			field: 'maxcombo',
		},
		mode: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'mode',
		},
		mods: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
			field: 'mods',
		},
		count50: {
			type: DataTypes.INTEGER,
			field: 'count50',
		},
		count100: {
			type: DataTypes.INTEGER,
			field: 'count100',
		},
		count300: {
			type: DataTypes.INTEGER,
			field: 'count300',
		},
		countMiss: {
			type: DataTypes.INTEGER,
			field: 'countmiss',
		},
		countKatu: {
			type: DataTypes.INTEGER,
			field: 'countkatu',
		},
		countGeki: {
			type: DataTypes.INTEGER,
			field: 'countgeki',
		},
		perfectCombo: {
			type: DataTypes.BOOLEAN,
			field: 'perfectcombo',
		},
		onlineScoreId: {
			type: DataTypes.STRING,
			field: 'onlinescoreid',
		},
		playerName: {
			type: DataTypes.STRING,
			field: 'playername',
		},
		replayHash: {
			type: DataTypes.STRING,
			field: 'replayhash',
		},
		score: {
			type: DataTypes.INTEGER,
			field: 'score',
		},
		timestamp: {
			type: DataTypes.STRING,
			field: 'timestamp',
		},
		version: {
			type: DataTypes.STRING,
			field: 'version',
		},
	}, {
		indexes: [
			{
				unique: false,
				fields: ['uploaderId', 'beatmapHash', 'playerName']
			}
		],
		tableName: 'dbosusoloscores',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};