module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuBeatmaps', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		title: {
			type: DataTypes.STRING,
			field: 'title',
		},
		artist: {
			type: DataTypes.STRING,
			field: 'artist',
		},
		difficulty: {
			type: DataTypes.STRING,
			field: 'difficulty',
		},
		starRating: {
			type: DataTypes.DECIMAL(10, 5),
			field: 'starrating',
		},
		aimRating: {
			type: DataTypes.DECIMAL(10, 5),
			field: 'aimrating',
		},
		speedRating: {
			type: DataTypes.DECIMAL(10, 5),
			field: 'speedrating',
		},
		drainLength: {
			type: DataTypes.INTEGER,
			field: 'drainlength',
		},
		totalLength: {
			type: DataTypes.INTEGER,
			field: 'totallength',
		},
		circleSize: {
			type: DataTypes.DECIMAL(10, 2),
			field: 'circlesize',
		},
		approachRate: {
			type: DataTypes.DECIMAL(10, 2),
			field: 'approachrate',
		},
		overallDifficulty: {
			type: DataTypes.DECIMAL(10, 2),
			field: 'overalldifficulty',
		},
		hpDrain: {
			type: DataTypes.DECIMAL(10, 2),
			field: 'hpdrain',
		},
		mapper: {
			type: DataTypes.STRING,
			field: 'mapper',
		},
		beatmapId: {
			type: DataTypes.STRING,
			field: 'beatmapid',
		},
		beatmapsetId: {
			type: DataTypes.STRING,
			field: 'beatmapsetid',
		},
		bpm: {
			type: DataTypes.STRING,
			field: 'bpm',
		},
		mode: {
			type: DataTypes.STRING,
			field: 'mode',
		},
		approvalStatus: {
			type: DataTypes.STRING,
			field: 'approvalstatus',
		},
		maxCombo: {
			type: DataTypes.INTEGER,
			field: 'maxcombo',
		},
		circles: {
			type: DataTypes.INTEGER,
			field: 'circles',
		},
		sliders: {
			type: DataTypes.INTEGER,
			field: 'sliders',
		},
		spinners: {
			type: DataTypes.INTEGER,
			field: 'spinners',
		},
		mods: {
			type: DataTypes.INTEGER,
			field: 'mods',
		},
		userRating: {
			type: DataTypes.STRING,
			field: 'userrating',
		},
		tourneyMap: {
			type: DataTypes.BOOLEAN,
			field: 'tourneymap',
		},
		noModMap: {
			type: DataTypes.BOOLEAN,
			field: 'nomodmap',
		},
		hiddenMap: {
			type: DataTypes.BOOLEAN,
			field: 'hiddenmap',
		},
		hardRockMap: {
			type: DataTypes.BOOLEAN,
			field: 'hardrockmap',
		},
		doubleTimeMap: {
			type: DataTypes.BOOLEAN,
			field: 'doubletimemap',
		},
		freeModMap: {
			type: DataTypes.BOOLEAN,
			field: 'freemodmap',
		},
		usedOften: {
			type: DataTypes.BOOLEAN,
			field: 'usedoften',
		},
		popular: {
			type: DataTypes.BOOLEAN,
			field: 'popular',
		},
		notDownloadable: {
			type: DataTypes.BOOLEAN,
			field: 'notdownloadable',
		},
		audioUnavailable: {
			type: DataTypes.BOOLEAN,
			field: 'audiounavailable',
		},
		hash: {
			type: DataTypes.STRING,
			field: 'hash',
		},
	}, {
		indexes: [
			{
				unique: false,
				fields: ['beatmapId', 'mods']
			}
		],
		tableName: 'dbosubeatmaps',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
