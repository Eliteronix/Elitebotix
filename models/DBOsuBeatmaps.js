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
			type: DataTypes.DECIMAL(10, 5),
		},
		aimRating: {
			type: DataTypes.DECIMAL(10, 5),
		},
		speedRating: {
			type: DataTypes.DECIMAL(10, 5),
		},
		drainLength: {
			type: DataTypes.INTEGER,
		},
		totalLength: {
			type: DataTypes.INTEGER,
		},
		circleSize: {
			type: DataTypes.DECIMAL(10, 2),
		},
		approachRate: {
			type: DataTypes.DECIMAL(10, 2),
		},
		overallDifficulty: {
			type: DataTypes.DECIMAL(10, 2),
		},
		hpDrain: {
			type: DataTypes.DECIMAL(10, 2),
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
		usedOften: {
			type: DataTypes.BOOLEAN,
		},
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['beatmapId', 'mods']
			}
		]
	});
};
