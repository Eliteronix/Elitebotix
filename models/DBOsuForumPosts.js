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
		},
		title: {
			type: DataTypes.STRING,
		},
		discord: {
			type: DataTypes.STRING,
		},
		host: {
			type: DataTypes.STRING,
		},
		format: {
			type: DataTypes.STRING,
		},
		rankRange: {
			type: DataTypes.STRING,
		},
		gamemode: {
			type: DataTypes.STRING,
		},
		notes: {
			type: DataTypes.STRING,
		},
		region: {
			type: DataTypes.STRING,
		},
		posted: {
			type: DataTypes.DATE,
		},
		bws: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		badged: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		pinged: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		outdated: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		noTournament: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		}
	});
};