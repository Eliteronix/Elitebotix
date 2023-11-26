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
		scoringType: DataTypes.STRING, //TODO: Datatype?
		mode: DataTypes.STRING, //TODO: Datatype?
		beatmapId: DataTypes.INTEGER,
		evaluation: DataTypes.STRING, //TODO: Datatype?
		score: DataTypes.INTEGER,
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
		team: DataTypes.STRING, //TODO: Datatype?
		pp: DataTypes.STRING, //TODO: Datatype?
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['osuUserId', 'matchId', 'gameId', 'beatmapId', 'mode', 'score']
			}
		]
	});
};