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
		osuHiddenDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuHardRockDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuDoubleTimeDuelStarRating: {
			type: DataTypes.STRING,
		},
		osuFreeModDuelStarRating: {
			type: DataTypes.STRING,
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
	},
		{
			indexes: [
				{
					unique: false,
					fields: ['osuUserId', 'date', 'month', 'year']
				}
			]
		});
};
