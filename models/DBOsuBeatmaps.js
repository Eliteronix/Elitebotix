module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuBeatmaps', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
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
		aimRating: {
			type: DataTypes.STRING,
		},
		speedRating: {
			type: DataTypes.STRING,
		},
		drainLength: {
			type: DataTypes.STRING,
		},
		totalLength: {
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
		mode: {
			type: DataTypes.STRING,
		},
		approvalStatus: {
			type: DataTypes.STRING,
		},
		maxCombo: {
			type: DataTypes.INTEGER,
		},
		circles: {
			type: DataTypes.INTEGER,
		},
		sliders: {
			type: DataTypes.INTEGER,
		},
		spinners: {
			type: DataTypes.INTEGER,
		},
		mods: {
			type: DataTypes.INTEGER,
		},
		userRating: {
			type: DataTypes.STRING,
		},
		tourneyMap: {
			type: DataTypes.BOOLEAN,
		},
		noModMap: {
			type: DataTypes.BOOLEAN,
		},
		hiddenMap: {
			type: DataTypes.BOOLEAN,
		},
		hardRockMap: {
			type: DataTypes.BOOLEAN,
		},
		doubleTimeMap: {
			type: DataTypes.BOOLEAN,
		},
		freeModMap: {
			type: DataTypes.BOOLEAN,
		},
		paranoid: true,
	});
};
