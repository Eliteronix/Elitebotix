module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuMultiMatches', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		matchId: {
			type: DataTypes.INTEGER,
			field: 'matchid',
		},
		matchName: {
			type: DataTypes.STRING,
			field: 'matchname',
		},
		acronym: {
			type: DataTypes.STRING,
			field: 'acronym',
		},
		referee: {
			type: DataTypes.INTEGER,
			field: 'referee',
		},
		tourneyMatch: {
			type: DataTypes.BOOLEAN,
			field: 'tourneymatch',
		},
		matchStartDate: {
			type: DataTypes.DATE,
			field: 'matchstartdate',
		},
		matchEndDate: {
			type: DataTypes.DATE,
			field: 'matchenddate',
		},
		verifiedAt: {
			type: DataTypes.DATE,
			field: 'verifiedat',
		},
		verifiedBy: {
			type: DataTypes.INTEGER,
			field: 'verifiedby',
		},
		verificationComment: {
			type: DataTypes.STRING,
			field: 'verificationcomment',
		},
	}, {
		indexes: [
			{
				unique: false,
				fields: ['matchId', 'tourneyMatch', 'matchName', 'acronym', 'verifiedAt', 'verifiedBy', 'verificationComment']
			}
		],
		tableName: 'dbosumultimatches',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};