module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuMultiGameScores', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
			field: 'osuuserid',
		},
		matchId: {
			type: DataTypes.INTEGER,
			field: 'matchid',
		},
		gameId: {
			type: DataTypes.INTEGER,
			field: 'gameid',
		},
		tourneyMatch: {
			type: DataTypes.BOOLEAN,
			field: 'tourneymatch',
		},
		scoringType: {
			type: DataTypes.INTEGER,
			field: 'scoringtype',
		},
		mode: {
			type: DataTypes.INTEGER,
			field: 'mode',
		},
		beatmapId: {
			type: DataTypes.INTEGER,
			field: 'beatmapid',
		},
		evaluation: {
			type: DataTypes.DECIMAL(10, 5),
			field: 'evaluation',
		},
		score: {
			type: DataTypes.DOUBLE,
			field: 'score',
		},
		freeMod: {
			type: DataTypes.BOOLEAN,
			field: 'freemod',
		},
		gameRawMods: {
			type: DataTypes.INTEGER,
			field: 'gamerawmods',
		},
		rawMods: {
			type: DataTypes.INTEGER,
			field: 'rawmods',
		},
		maxCombo: {
			type: DataTypes.INTEGER,
			field: 'maxcombo',
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
		perfect: {
			type: DataTypes.BOOLEAN,
			field: 'perfect',
		},
		teamType: {
			type: DataTypes.INTEGER,
			field: 'teamtype',
		},
		team: {
			type: DataTypes.STRING,
			field: 'team',
		},
		pp: {
			type: DataTypes.DECIMAL(10, 3),
			field: 'pp',
		},
		warmup: {
			type: DataTypes.BOOLEAN,
			field: 'warmup',
		},
		gameStartDate: {
			type: DataTypes.DATE,
			field: 'gamestartdate',
		},
		gameEndDate: {
			type: DataTypes.DATE,
			field: 'gameenddate',
		},
	}, {
		indexes: [
			{
				unique: false,
				fields: ['osuUserId', 'matchId', 'gameId', 'tourneyMatch', 'beatmapId', 'mode', 'score', 'gameStartDate', 'gameEndDate']
			}
		],
		tableName: 'dbosumultigamescores',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};