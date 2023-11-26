module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuMultiGames', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		matchId: DataTypes.STRING,
		gameId: DataTypes.STRING,
		scoringType: DataTypes.STRING,
		mode: DataTypes.STRING,
		beatmapId: DataTypes.STRING,
		gameRawMods: DataTypes.STRING,
		gameStartDate: DataTypes.DATE,
		gameEndDate: DataTypes.DATE,
		freeMod: DataTypes.BOOLEAN,
		forceMod: DataTypes.BOOLEAN,
		warmup: DataTypes.BOOLEAN,
		warmupDecidedByAmount: DataTypes.BOOLEAN, //TODO: Datatype?
		teamType: DataTypes.STRING,
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