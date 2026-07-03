module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuPoolAccess', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		accessGiverId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'accessgiverid',
		},
		spreadsheetId: {
			type: DataTypes.STRING,
			field: 'spreadsheetid',
		},
		mappoolName: {
			type: DataTypes.STRING,
			field: 'mappoolname',
		},
		accessTakerId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'accesstakerid',
		},
	}, {
		tableName: 'dbosupoolaccess',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};