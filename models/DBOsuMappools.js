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
			field: 'creatorid',
		},
		spreadsheetId: {
			type: DataTypes.STRING,
			field: 'spreadsheetid',
		},
		name: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'name',
		},
		number: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
			field: 'number',
		},
		modPool: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
			field: 'modpool',
		},
		freeMod: {
			type: DataTypes.BOOLEAN,
			allowNullValue: false,
			field: 'freemod',
		},
		tieBreaker: {
			type: DataTypes.BOOLEAN,
			allowNullValue: false,
			field: 'tiebreaker',
		},
		modPoolNumber: {
			type: DataTypes.INTEGER,
			allowNullValue: false,
			field: 'modpoolnumber',
		},
		beatmapId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'beatmapid',
		},
	}, {
		tableName: 'dbosumappools',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};