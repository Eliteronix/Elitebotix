module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBElitiriCupSubmissions', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
		osuName: {
			type: DataTypes.STRING,
			field: 'osuname',
		},
		bracketName: {
			type: DataTypes.STRING,
			field: 'bracketname',
		},
		tournamentName: {
			type: DataTypes.STRING,
			field: 'tournamentname',
		},
		modPool: {
			type: DataTypes.STRING,
			field: 'modpool',
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
			type: DataTypes.STRING,
			field: 'starrating',
		},
		drainLength: {
			type: DataTypes.STRING,
			field: 'drainlength',
		},
		circleSize: {
			type: DataTypes.STRING,
			field: 'circlesize',
		},
		approachRate: {
			type: DataTypes.STRING,
			field: 'approachrate',
		},
		overallDifficulty: {
			type: DataTypes.STRING,
			field: 'overalldifficulty',
		},
		hpDrain: {
			type: DataTypes.STRING,
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
	}, {
		tableName: 'dbelitiricupsubmissions',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
