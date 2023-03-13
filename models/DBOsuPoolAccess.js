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
		},
		spreadsheetId: {
			type: DataTypes.STRING,
		},
		mappoolName: {
			type: DataTypes.STRING,
		},
		accessTakerId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
	});
};