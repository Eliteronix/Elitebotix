module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuMultiMatches', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		matchId: DataTypes.INTEGER,
		matchName: DataTypes.STRING,
		referee: DataTypes.INTEGER,
		tourneyMatch: DataTypes.BOOLEAN,
		matchStartDate: DataTypes.DATE,
		matchEndDate: DataTypes.DATE,
		verifiedAt: DataTypes.DATE,
		verifiedBy: DataTypes.INTEGER,
		verificationComment: DataTypes.STRING,
		paranoid: true,
	}, {
		indexes: [
			{
				unique: false,
				fields: ['matchId', 'tourneyMatch', 'matchName', 'verifiedAt', 'verifiedBy', 'verificationComment']
			}
		]
	});
};