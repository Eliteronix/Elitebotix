module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBDuelRatingHistory', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
		},
		osuDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuNoModDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuNoModDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuHiddenDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuHiddenDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuHardRockDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuHardRockDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuDoubleTimeDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuDoubleTimeDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuFreeModDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuFreeModDuelStarRatingLimited: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuDuelProvisional: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		osuDuelOutdated: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		date: {
			type: DataTypes.INTEGER,
		},
		month: {
			type: DataTypes.INTEGER,
		},
		year: {
			type: DataTypes.INTEGER,
		},
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['osuUserId', 'date', 'month', 'year']
			}
		]
	});
};
