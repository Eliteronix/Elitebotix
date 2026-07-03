module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuMultiGames', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
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
		gameRawMods: {
			type: DataTypes.INTEGER,
			field: 'gamerawmods',
		},
		gameStartDate: {
			type: DataTypes.DATE,
			field: 'gamestartdate',
		},
		gameEndDate: {
			type: DataTypes.DATE,
			field: 'gameenddate',
		},
		freeMod: {
			type: DataTypes.BOOLEAN,
			field: 'freemod',
		},
		forceMod: {
			type: DataTypes.BOOLEAN,
			field: 'forcemod',
		},
		warmup: {
			type: DataTypes.BOOLEAN,
			field: 'warmup',
		},
		warmupDecidedByAmount: {
			type: DataTypes.BOOLEAN,
			field: 'warmupdecidedbyamount',
		},
		teamType: {
			type: DataTypes.INTEGER,
			field: 'teamtype',
		},
		scores: {
			type: DataTypes.INTEGER,
			field: 'scores',
		},
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['matchId', 'gameId', 'tourneyMatch', 'beatmapId', 'mode', 'gameStartDate', 'gameEndDate', 'warmup', 'warmupDecidedByAmount']
			}
		],
		tableName: 'dbosumultigames',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};