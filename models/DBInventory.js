module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBInventory', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		osuUserId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		item: DataTypes.STRING,
		amount: DataTypes.INTEGER,
	});
};