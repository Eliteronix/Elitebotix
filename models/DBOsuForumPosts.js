module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBOsuForumPosts', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		forumPost: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'forumpost',
		},
		title: {
			type: DataTypes.STRING,
			field: 'title',
		},
		discord: {
			type: DataTypes.STRING,
			field: 'discord',
		},
		host: {
			type: DataTypes.STRING,
			field: 'host',
		},
		format: {
			type: DataTypes.STRING,
			field: 'format',
		},
		rankRange: {
			type: DataTypes.STRING,
			field: 'rankrange',
		},
		gamemode: {
			type: DataTypes.STRING,
			field: 'gamemode',
		},
		notes: {
			type: DataTypes.STRING,
			field: 'notes',
		},
		region: {
			type: DataTypes.STRING,
			field: 'region',
		},
		posted: {
			type: DataTypes.DATE,
			field: 'posted',
		},
		bws: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'bws',
		},
		badged: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'badged',
		},
		pinged: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'pinged',
		},
		outdated: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'outdated',
		},
		noTournament: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'notournament',
		}
	}, {
		tableName: 'dbosuforumposts',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};