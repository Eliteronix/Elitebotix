

module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBProcessQueue', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			allowNullValue: false,
			field: 'guildid',
		},
		task: {
			type: DataTypes.STRING,
			field: 'task',
		},
		priority: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			field: 'priority',
		},
		filters: {
			type: DataTypes.STRING,
			field: 'filters',
		},
		additions: {
			type: DataTypes.STRING,
			field: 'additions',
		},
		date: {
			type: DataTypes.DATE,
			field: 'date',
		},
		beingExecuted: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'beingexecuted',
		}
	}, {
		indexes: [
			{
				unique: false,
				fields: ['beingExecuted', 'date', 'priority']
			}
		],
		tableName: 'dbprocessqueues',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};
