module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuMultiScores', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		matchId: DataTypes.STRING,
		matchName: DataTypes.STRING,
		gameId: DataTypes.STRING,
		scoringType: DataTypes.STRING,
		mode: DataTypes.STRING,
		beatmapId: DataTypes.STRING,
		tourneyMatch: DataTypes.BOOLEAN,
		evaluation: DataTypes.STRING,
		score: DataTypes.STRING,
		gameRawMods: DataTypes.STRING,
		rawMods: DataTypes.STRING,
		matchStartDate: DataTypes.DATE,
		matchEndDate: DataTypes.DATE,
		gameStartDate: DataTypes.DATE,
		gameEndDate: DataTypes.DATE,
		freeMod: DataTypes.BOOLEAN,
		forceMod: DataTypes.BOOLEAN,
		warmup: DataTypes.BOOLEAN,
		paranoid: true,
	});
};