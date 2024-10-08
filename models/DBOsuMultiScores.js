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
		referee: DataTypes.STRING,
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
		warmupDecidedByAmount: DataTypes.BOOLEAN,
		maxCombo: DataTypes.STRING,
		count50: DataTypes.STRING,
		count100: DataTypes.STRING,
		count300: DataTypes.STRING,
		countMiss: DataTypes.STRING,
		countKatu: DataTypes.STRING,
		countGeki: DataTypes.STRING,
		perfect: DataTypes.BOOLEAN,
		teamType: DataTypes.STRING,
		team: DataTypes.STRING,
		pp: DataTypes.STRING,
		verifiedAt: DataTypes.DATE,
		verifiedBy: DataTypes.STRING,
		verificationComment: DataTypes.STRING,
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['osuUserId', 'matchId', 'gameId', 'beatmapId', 'tourneyMatch', 'mode', 'score', 'matchName', 'gameStartDate', 'gameEndDate', 'warmup', 'warmupDecidedByAmount', 'verifiedAt', 'verifiedBy', 'verificationComment']
			}
		]
	});
};