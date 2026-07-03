module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBDuelRatingHistory', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
			field: 'osuuserid',
		},
		osuDuelStarRating: {
			type: DataTypes.STRING,
			field: 'osuduelstarrating',
		},
		osuNoModDuelStarRating: {
			type: DataTypes.STRING,
			field: 'osunodmodduelstarrating',
		},
		osuNoModDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osunomodduelstarratinglimited',
		},
		osuHiddenDuelStarRating: {
			type: DataTypes.STRING,
			field: 'osuhiddenduelstarrating',
		},
		osuHiddenDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuhiddenduelstarratinglimited',
		},
		osuHardRockDuelStarRating: {
			type: DataTypes.STRING,
			field: 'osuhardrockduelstarrating',
		},
		osuHardRockDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuhardrockduelstarratinglimited',
		},
		osuDoubleTimeDuelStarRating: {
			type: DataTypes.STRING,
			field: 'osudoubletimeduelstarrating',
		},
		osuDoubleTimeDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osudoubletimeduelstarratinglimited',
		},
		osuFreeModDuelStarRating: {
			type: DataTypes.STRING,
			field: 'osufreemodduelstarrating',
		},
		osuFreeModDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osufreemodduelstarratinglimited',
		},
		osuDuelProvisional: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osuduelprovisional',
		},
		osuDuelOutdated: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'osudueloutdated',
		},
		date: {
			type: DataTypes.INTEGER,
			field: 'date',
		},
		month: {
			type: DataTypes.INTEGER,
			field: 'month',
		},
		year: {
			type: DataTypes.INTEGER,
			field: 'year',
		},
	}, {
		indexes: [
			{
				unique: false,
				fields: ['osuUserId', 'date', 'month', 'year']
			}
		],
		tableName: 'dbduelratinghistories',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
