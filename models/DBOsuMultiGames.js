module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuMultiGames', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		matchId: DataTypes.INTEGER,
		gameId: DataTypes.INTEGER,
		scoringType: DataTypes.INTEGER,
		mode: DataTypes.INTEGER,
		beatmapId: DataTypes.INTEGER,
		gameRawMods: DataTypes.INTEGER,
		gameStartDate: DataTypes.DATE,
		gameEndDate: DataTypes.DATE,
		freeMod: DataTypes.BOOLEAN,
		forceMod: DataTypes.BOOLEAN,
		warmup: DataTypes.BOOLEAN,
		warmupDecidedByAmount: DataTypes.BOOLEAN,
		teamType: DataTypes.INTEGER,
		scores: DataTypes.INTEGER,
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['matchId', 'gameId', 'beatmapId', 'mode', 'gameStartDate', 'gameEndDate', 'warmup', 'warmupDecidedByAmount']
			}
		]
	});
};