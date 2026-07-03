module.exports = (sequelize, DataTypes) => {
	return sequelize.define('DBGuilds', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			field: 'guildid',
		},
		guildName: {
			type: DataTypes.STRING,
			field: 'guildname',
		},
		customPrefixUsed: {
			type: DataTypes.BOOLEAN,
			field: 'customprefixused',
		},
		customPrefix: {
			type: DataTypes.STRING,
			field: 'customprefix',
		},
		dadmodeEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'dadmodeenabled',
		},
		saluteEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'saluteenabled',
		},
		owoEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'owoenabled',
		},
		sendWelcomeMessage: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'sendwelcomemessage',
		},
		welcomeMessageChannel: {
			type: DataTypes.STRING,
			field: 'welcomemessagechannel',
		},
		welcomeMessageText: {
			type: DataTypes.STRING,
			field: 'welcomemessagetext',
		},
		sendGoodbyeMessage: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'sendgoodbyemessage',
		},
		goodbyeMessageChannel: {
			type: DataTypes.STRING,
			field: 'goodbyemessagechannel',
		},
		goodbyeMessageText: {
			type: DataTypes.STRING,
			field: 'goodbyemessagetext',
		},
		temporaryVoices: {
			type: DataTypes.BOOLEAN,
			field: 'temporaryvoices',
		},
		addTemporaryText: {
			type: DataTypes.BOOLEAN,
			field: 'addtemporarytext',
		},
		starBoardEnabled: {
			type: DataTypes.BOOLEAN,
			field: 'starboardenabled',
		},
		starBoardMinimum: {
			type: DataTypes.STRING,
			field: 'starboardminimum',
		},
		starBoardChannel: {
			type: DataTypes.STRING,
			field: 'starboardchannel',
		},
		ticketsEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'ticketsenabled',
		},
		birthdayEnabled: {
			type: DataTypes.BOOLEAN,
			field: 'birthdayenabled',
		},
		birthdayMessageChannel: {
			type: DataTypes.STRING,
			field: 'birthdaymessagechannel',
		},
	}, {
		tableName: 'dbguilds',
		createdAt: 'createdat',
		updatedAt: 'updatedat',
	});
};