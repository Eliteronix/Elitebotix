module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuMappools', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		creatorId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		name: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		number: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
		},
		modPool: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
		},
		freeMod: {
			type: DataTypes.BOOLEAN,
			allowNullValue: false,
		},
		tieBreaker: {
			type: DataTypes.BOOLEAN,
			allowNullValue: false,
		},
		modPoolNumber: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
		},
		beatmapId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
	});
};