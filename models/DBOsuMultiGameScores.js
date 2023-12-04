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
		},
		matchId: DataTypes.INTEGER,
		gameId: DataTypes.INTEGER,
		tourneyMatch: DataTypes.BOOLEAN,
		scoringType: DataTypes.INTEGER,
		mode: DataTypes.INTEGER,
		beatmapId: DataTypes.INTEGER,
		evaluation: DataTypes.DECIMAL(10, 5),
		score: DataTypes.INTEGER,
		freeMod: DataTypes.BOOLEAN,
		gameRawMods: DataTypes.INTEGER,
		rawMods: DataTypes.INTEGER,
		maxCombo: DataTypes.INTEGER,
		count50: DataTypes.INTEGER,
		count100: DataTypes.INTEGER,
		count300: DataTypes.INTEGER,
		countMiss: DataTypes.INTEGER,
		countKatu: DataTypes.INTEGER,
		countGeki: DataTypes.INTEGER,
		perfect: DataTypes.BOOLEAN,
		team: DataTypes.STRING,
		pp: DataTypes.DECIMAL(10, 3),
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['osuUserId', 'matchId', 'gameId', 'tourneyMatch', 'beatmapId', 'mode', 'score']
			}
		]
	});
};