module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriCupSubmissions', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
		},
		osuName: {
			type: DataTypes.STRING,
		},
		bracketName: {
			type: DataTypes.STRING,
		},
		tournamentName: {
			type: DataTypes.STRING,
		},
		modPool: {
			type: DataTypes.STRING,
		},
		title: {
			type: DataTypes.STRING,
		},
		artist: {
			type: DataTypes.STRING,
		},
		difficulty: {
			type: DataTypes.STRING,
		},
		starRating: {
			type: DataTypes.STRING,
		},
		drainLength: {
			type: DataTypes.STRING,
		},
		circleSize: {
			type: DataTypes.STRING,
		},
		approachRate: {
			type: DataTypes.STRING,
		},
		overallDifficulty: {
			type: DataTypes.STRING,
		},
		hpDrain: {
			type: DataTypes.STRING,
		},
		mapper: {
			type: DataTypes.STRING,
		},
		beatmapId: {
			type: DataTypes.STRING,
		},
		beatmapsetId: {
			type: DataTypes.STRING,
		},
		bpm: {
			type: DataTypes.STRING,
		},
		paranoid: true,
	});
};
