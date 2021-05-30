module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBMOTDPoints', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.STRING,
			allowNullValue: false,
		},
		osuUserId: {
			type: DataTypes.STRING,
		},
		osuRank: {
			type: DataTypes.STRING,
		},
		totalPoints: {
			type: DataTypes.STRING,
		},
		qualifierPoints: {
			type: DataTypes.STRING,
		},
		qualifierRank: {
			type: DataTypes.STRING,
		},
		qualifierPlayers: {
			type: DataTypes.STRING,
		},
		knockoutPoints: {
			type: DataTypes.STRING,
		},
		knockoutRank: {
			type: DataTypes.STRING,
		},
		knockoutPlayers: {
			type: DataTypes.STRING,
		},
		knockoutRound: {
			type: DataTypes.STRING,
		},
		maxQualifierPoints: {
			type: DataTypes.STRING,
		},
		matchDate: {
			type: DataTypes.DATE,
		},
		paranoid: true,
	});
};
