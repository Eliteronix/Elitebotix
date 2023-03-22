const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');
const osu = require('node-osu');
const { getIDFromPotentialOsuLink, getOsuBeatmap, updateOsuDetailsforUser, logDatabaseQueries, getModBits } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'osu-referee',
	description: 'Lets you schedule a match which is being reffed by the bot',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-referee')
		.setNameLocalizations({
			'de': 'osu-referee',
			'en-GB': 'osu-referee',
			'en-US': 'osu-referee',
		})
		.setDescription('Lets you schedule a match which is being reffed by the bot')
		.setDescriptionLocalizations({
			'de': 'Lässt dich ein Match planen, welches vom Bot geleitet wird',
			'en-GB': 'Lets you schedule a match which is being reffed by the bot',
			'en-US': 'Lets you schedule a match which is being reffed by the bot',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand
				.setName('soloqualifiers')
				.setNameLocalizations({
					'de': 'einzelqualis',
					'en-GB': 'soloqualifiers',
					'en-US': 'soloqualifiers',
				})
				.setDescription('Lets you schedule a match which is being reffed by the bot')
				.setDescriptionLocalizations({
					'de': 'Lässt dich ein Match planen, welches vom Bot geleitet wird',
					'en-GB': 'Lets you schedule a match which is being reffed by the bot',
					'en-US': 'Lets you schedule a match which is being reffed by the bot',
				})
				.addIntegerOption(option =>
					option
						.setName('date')
						.setNameLocalizations({
							'de': 'datum',
							'en-GB': 'date',
							'en-US': 'date',
						})
						.setDescription('The date of the month in UTC (i.e. 29)')
						.setDescriptionLocalizations({
							'de': 'Das Datum des Monats in UTC (z.B. 29)',
							'en-GB': 'The date of the month in UTC (i.e. 29)',
							'en-US': 'The date of the month in UTC (i.e. 29)',
						})
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(31)
				)
				.addIntegerOption(option =>
					option
						.setName('month')
						.setNameLocalizations({
							'de': 'monat',
							'en-GB': 'month',
							'en-US': 'month',
						})
						.setDescription('The month in UTC (i.e. 11)')
						.setDescriptionLocalizations({
							'de': 'Der Monat in UTC (z.B. 11)',
							'en-GB': 'The month in UTC (i.e. 11)',
							'en-US': 'The month in UTC (i.e. 11)',
						})
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(12)
				)
				.addIntegerOption(option =>
					option
						.setName('year')
						.setNameLocalizations({
							'de': 'jahr',
							'en-GB': 'year',
							'en-US': 'year',
						})
						.setDescription('The year in UTC (i.e. 2021)')
						.setDescriptionLocalizations({
							'de': 'Das Jahr in UTC (z.B. 2021)',
							'en-GB': 'The year in UTC (i.e. 2021)',
							'en-US': 'The year in UTC (i.e. 2021)',
						})
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option
						.setName('hour')
						.setNameLocalizations({
							'de': 'stunde',
							'en-GB': 'hour',
							'en-US': 'hour',
						})
						.setDescription('The hour in UTC (i.e. 18)')
						.setDescriptionLocalizations({
							'de': 'Die Stunde in UTC (z.B. 18)',
							'en-GB': 'The hour in UTC (i.e. 18)',
							'en-US': 'The hour in UTC (i.e. 18)',
						})
						.setRequired(true)
						.setMinValue(0)
						.setMaxValue(23)
				)
				.addIntegerOption(option =>
					option
						.setName('minute')
						.setNameLocalizations({
							'de': 'minute',
							'en-GB': 'minute',
							'en-US': 'minute',
						})
						.setDescription('The minute in UTC (i.e. 0)')
						.setDescriptionLocalizations({
							'de': 'Die Minute in UTC (z.B. 0)',
							'en-GB': 'The minute in UTC (i.e. 0)',
							'en-US': 'The minute in UTC (i.e. 0)',
						})
						.setRequired(true)
						.setMinValue(0)
						.setMaxValue(59)
				)
				.addChannelOption(option =>
					option
						.setName('channel')
						.setNameLocalizations({
							'de': 'kanal',
							'en-GB': 'channel',
							'en-US': 'channel',
						})
						.setDescription('The channel in which the players should be notified.')
						.setDescriptionLocalizations({
							'de': 'Der Kanal, in dem die Spieler benachrichtigt werden sollen.',
							'en-GB': 'The channel in which the players should be notified.',
							'en-US': 'The channel in which the players should be notified.',
						})
						.setRequired(true)
						.addChannelTypes(Discord.ChannelType.GuildText)
				)
				.addStringOption(option =>
					option
						.setName('matchname')
						.setNameLocalizations({
							'de': 'matchname',
							'en-GB': 'matchname',
							'en-US': 'matchname',
						})
						.setDescription('The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")')
						.setDescriptionLocalizations({
							'de': 'Der Name, den das Match haben soll. (z.B. "ECS: (Qualifiers) vs (Lobby 8)")',
							'en-GB': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
							'en-US': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('mappool')
						.setNameLocalizations({
							'de': 'mappool',
							'en-GB': 'mappool',
							'en-US': 'mappool',
						})
						.setDescription('The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316')
						.setDescriptionLocalizations({
							'de': 'Der Mappool im folgenden Format: NM234826,HD123141,HR123172,FMDT2342316',
							'en-GB': 'The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316',
							'en-US': 'The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('freemodmessage')
						.setNameLocalizations({
							'de': 'freemodnachricht',
							'en-GB': 'freemodmessage',
							'en-US': 'freemodmessage',
						})
						.setDescription('An intruction message to be displayed when the map is played freemod')
						.setDescriptionLocalizations({
							'de': 'Eine Anleitungsnachricht, die angezeigt werden soll, wenn die Karte freemod gespielt wird',
							'en-GB': 'An intruction message to be displayed when the map is played freemod',
							'en-US': 'An intruction message to be displayed when the map is played freemod',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('players')
						.setNameLocalizations({
							'de': 'spieler',
							'en-GB': 'players',
							'en-US': 'players',
						})
						.setDescription('The username, id or link of the players seperated by a \',\'')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername, die ID oder der Link der Spieler, getrennt durch ein \',\'',
							'en-GB': 'The username, id or link of the players seperated by a \',\'',
							'en-US': 'The username, id or link of the players seperated by a \',\'',
						})
						.setRequired(true)
				)
				.addBooleanOption(option =>
					option
						.setName('usenofail')
						.setNameLocalizations({
							'de': 'nutzenofail',
							'en-GB': 'usenofail',
							'en-US': 'usenofail',
						})
						.setDescription('Should nofail be applied to all maps?')
						.setDescriptionLocalizations({
							'de': 'Soll nofail auf allen maps angewendet werden?',
							'en-GB': 'Should nofail be applied to all maps?',
							'en-US': 'Should nofail be applied to all maps?',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('score')
						.setNameLocalizations({
							'de': 'score',
							'en-GB': 'score',
							'en-US': 'score',
						})
						.setDescription('What is the winning condition of the match?')
						.setDescriptionLocalizations({
							'de': 'Was ist die Gewinnbedingung des Spiels?',
							'en-GB': 'What is the winning condition of the match?',
							'en-US': 'What is the winning condition of the match?',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Score v1', value: '0' },
							{ name: 'Score v2', value: '3' },
							{ name: 'Accuracy', value: '1' },
						)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('teamqualifiers')
				.setNameLocalizations({
					'de': 'teamqualis',
					'en-GB': 'teamqualifiers',
					'en-US': 'teamqualifiers',
				})
				.setDescription('Lets you schedule a match which is being reffed by the bot')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht es dir, ein Spiel zu planen, das von dem Bot geleitet wird',
					'en-GB': 'Lets you schedule a match which is being reffed by the bot',
					'en-US': 'Lets you schedule a match which is being reffed by the bot',
				})
				.addIntegerOption(option =>
					option
						.setName('date')
						.setNameLocalizations({
							'de': 'datum',
							'en-GB': 'date',
							'en-US': 'date',
						})
						.setDescription('The date of the month in UTC (i.e. 29)')
						.setDescriptionLocalizations({
							'de': 'Das Datum des Monats in UTC (z.B. 29)',
							'en-GB': 'The date of the month in UTC (i.e. 29)',
							'en-US': 'The date of the month in UTC (i.e. 29)',
						})
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(31)
				)
				.addIntegerOption(option =>
					option
						.setName('month')
						.setNameLocalizations({
							'de': 'monat',
							'en-GB': 'month',
							'en-US': 'month',
						})
						.setDescription('The month in UTC (i.e. 11)')
						.setDescriptionLocalizations({
							'de': 'Der Monat in UTC (z.B. 11)',
							'en-GB': 'The month in UTC (i.e. 11)',
							'en-US': 'The month in UTC (i.e. 11)',
						})
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(12)
				)
				.addIntegerOption(option =>
					option
						.setName('year')
						.setNameLocalizations({
							'de': 'jahr',
							'en-GB': 'year',
							'en-US': 'year',
						})
						.setDescription('The year in UTC (i.e. 2021)')
						.setDescriptionLocalizations({
							'de': 'Das Jahr in UTC (z.B. 2021)',
							'en-GB': 'The year in UTC (i.e. 2021)',
							'en-US': 'The year in UTC (i.e. 2021)',
						})
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option
						.setName('hour')
						.setNameLocalizations({
							'de': 'stunde',
							'en-GB': 'hour',
							'en-US': 'hour',
						})
						.setDescription('The hour in UTC (i.e. 18)')
						.setDescriptionLocalizations({
							'de': 'Die Stunde in UTC (z.B. 18)',
							'en-GB': 'The hour in UTC (i.e. 18)',
							'en-US': 'The hour in UTC (i.e. 18)',
						})
						.setRequired(true)
						.setMinValue(0)
						.setMaxValue(23)
				)
				.addIntegerOption(option =>
					option
						.setName('minute')
						.setNameLocalizations({
							'de': 'minute',
							'en-GB': 'minute',
							'en-US': 'minute',
						})
						.setDescription('The minute in UTC (i.e. 0)')
						.setDescriptionLocalizations({
							'de': 'Die Minute in UTC (z.B. 0)',
							'en-GB': 'The minute in UTC (i.e. 0)',
							'en-US': 'The minute in UTC (i.e. 0)',
						})
						.setRequired(true)
						.setMinValue(0)
						.setMaxValue(59)
				)
				.addChannelOption(option =>
					option
						.setName('channel')
						.setNameLocalizations({
							'de': 'kanal',
							'en-GB': 'channel',
							'en-US': 'channel',
						})
						.setDescription('The channel in which the players should be notified.')
						.setDescriptionLocalizations({
							'de': 'Der Kanal, in dem die Spieler benachrichtigt werden sollen.',
							'en-GB': 'The channel in which the players should be notified.',
							'en-US': 'The channel in which the players should be notified.',
						})
						.setRequired(true)
						.addChannelTypes(Discord.ChannelType.GuildText)
				)
				.addStringOption(option =>
					option
						.setName('matchname')
						.setNameLocalizations({
							'de': 'matchname',
							'en-GB': 'matchname',
							'en-US': 'matchname',
						})
						.setDescription('The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")')
						.setDescriptionLocalizations({
							'de': 'Der Name, den das Match haben soll. (z.B. "ECS: (Qualifiers) vs (Lobby 8)")',
							'en-GB': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
							'en-US': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('mappool')
						.setNameLocalizations({
							'de': 'mappool',
							'en-GB': 'mappool',
							'en-US': 'mappool',
						})
						.setDescription('The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316')
						.setDescriptionLocalizations({
							'de': 'Der Mappool im folgenden Format: NM234826,HD123141,HR123172,FMDT2342316',
							'en-GB': 'The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316',
							'en-US': 'The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('freemodmessage')
						.setNameLocalizations({
							'de': 'freemodnachricht',
							'en-GB': 'freemodmessage',
							'en-US': 'freemodmessage',
						})
						.setDescription('An intruction message to be displayed when the map is played freemod')
						.setDescriptionLocalizations({
							'de': 'Eine Anleitungsnachricht, die angezeigt werden soll, wenn die Karte freemod gespielt wird',
							'en-GB': 'An intruction message to be displayed when the map is played freemod',
							'en-US': 'An intruction message to be displayed when the map is played freemod',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('players')
						.setNameLocalizations({
							'de': 'spieler',
							'en-GB': 'players',
							'en-US': 'players',
						})
						.setDescription('The username, id or link of the players seperated by a \',\' | Teams seperated by a \';\'')
						.setDescriptionLocalizations({
							'de': 'Der Nutzername oder die ID der Spieler, getrennt durch ein \',\' | Teams getrennt durch ein \';\'',
							'en-GB': 'The username, id or link of the players seperated by a \',\' | Teams seperated by a \';\'',
							'en-US': 'The username, id or link of the players seperated by a \',\' | Teams seperated by a \';\'',
						})
						.setRequired(true)
				)
				.addIntegerOption(option =>
					option
						.setName('teamsize')
						.setNameLocalizations({
							'de': 'teamgröße',
							'en-GB': 'teamsize',
							'en-US': 'teamsize',
						})
						.setDescription('The amount of players per team to play at once')
						.setDescriptionLocalizations({
							'de': 'Die Anzahl der Spieler pro Team, die gleichzeitig spielen',
							'en-GB': 'The amount of players per team to play at once',
							'en-US': 'The amount of players per team to play at once',
						})
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(16)
				)
				.addBooleanOption(option =>
					option
						.setName('usenofail')
						.setNameLocalizations({
							'de': 'nutzenofail',
							'en-GB': 'usenofail',
							'en-US': 'usenofail',
						})
						.setDescription('Should nofail be applied to all maps?')
						.setDescriptionLocalizations({
							'de': 'Soll nofail auf allen maps angewendet werden?',
							'en-GB': 'Should nofail be applied to all maps?',
							'en-US': 'Should nofail be applied to all maps?',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('score')
						.setNameLocalizations({
							'de': 'score',
							'en-GB': 'score',
							'en-US': 'score',
						})
						.setDescription('What is the winning condition of the match?')
						.setDescriptionLocalizations({
							'de': 'Was ist die Gewinnbedingung des Spiels?',
							'en-GB': 'What is the winning condition of the match?',
							'en-US': 'What is the winning condition of the match?',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Score v1', value: '0' },
							{ name: 'Score v2', value: '3' },
							{ name: 'Accuracy', value: '1' },
						)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('scheduled')
				.setNameLocalizations({
					'de': 'geplant',
					'en-GB': 'scheduled',
					'en-US': 'scheduled',
				})
				.setDescription('Show what matches you have scheduled')
				.setDescriptionLocalizations({
					'de': 'Zeige an, welche Spiele du geplant hast',
					'en-GB': 'Show what matches you have scheduled',
					'en-US': 'Show what matches you have scheduled',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setNameLocalizations({
					'de': 'entfernen',
					'en-GB': 'remove',
					'en-US': 'remove',
				})
				.setDescription('Remove matches that you have scheduled over the bot')
				.setDescriptionLocalizations({
					'de': 'Entferne Spiele, die du über den Bot geplant hast',
					'en-GB': 'Remove matches that you have scheduled over the bot',
					'en-US': 'Remove matches that you have scheduled over the bot',
				})
				.addIntegerOption(option =>
					option
						.setName('internalid')
						.setNameLocalizations({
							'de': 'interneid',
							'en-GB': 'internalid',
							'en-US': 'internalid',
						})
						.setDescription('The internal ID which can be found when using /osu-referee scheduled')
						.setDescriptionLocalizations({
							'de': 'Die interne ID, die du mit /osu-referee geplant findest',
							'en-GB': 'The internal ID which can be found when using /osu-referee scheduled',
							'en-US': 'The internal ID which can be found when using /osu-referee scheduled',
						})
						.setRequired(true)
				)
		),
	// 			// {
	// 			// 	'name': '1v1',
	// 			// 	'description': 'Lets you schedule a match which is being reffed by the bot',
	// 			// 	'type': 1, // 1 is type SUB_COMMAND
	// 			// 	'options': [
	// 			// 		{
	// 			// 			'name': 'date',
	// 			// 			'description': 'The date of the month in UTC (i.e. 29)',
	// 			// 			'type': 4,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'month',
	// 			// 			'description': 'The month in UTC (i.e. 11)',
	// 			// 			'type': 4,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'year',
	// 			// 			'description': 'The year in UTC (i.e. 2021)',
	// 			// 			'type': 4,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'hour',
	// 			// 			'description': 'The hour in UTC (i.e. 18)',
	// 			// 			'type': 4,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'minute',
	// 			// 			'description': 'The minute in UTC (i.e. 0)',
	// 			// 			'type': 4,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'channel',
	// 			// 			'description': 'The channel in which the players should be notified.',
	// 			// 			'type': 7,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'matchname',
	// 			// 			'description': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
	// 			// 			'type': 3,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'mappool',
	// 			// 			'description': 'The mappool in the following format: NM234826,HD123141,HR123172. Available mods: NM,HD,HR,DT,FM,TB',
	// 			// 			'type': 3,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'bestof',
	// 			// 			'description': 'The best of',
	// 			// 			'type': 4,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'bans',
	// 			// 			'description': 'The amount of bans for each player.',
	// 			// 			'type': 4,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'players',
	// 			// 			'description': 'The username, id or link of the players seperated by a \',\'',
	// 			// 			'type': 3,
	// 			// 			'required': true
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'pickbanorder',
	// 			// 			'description': 'What is the pick and ban order?',
	// 			// 			'type': 3,
	// 			// 			'required': true,
	// 			// 			'choices': [
	// 			// 				{
	// 			// 					'name': 'Determined: Roll Winner Bans Second and Picks First (Bans: ABAB)',
	// 			// 					'value': '1'
	// 			// 				},
	// 			// 				{
	// 			// 					'name': 'Determined: Roll Winner Bans Second and Picks First (Bans: ABBA)',
	// 			// 					'value': '2'
	// 			// 				},
	// 			// 				{
	// 			// 					'name': 'Choice: Roll Winner chooses Ban Second and Pick First or opposite (Bans: ABAB)',
	// 			// 					'value': '3'
	// 			// 				},
	// 			// 				{
	// 			// 					'name': 'Choice: Roll Winner chooses Ban Second and Pick First or opposite (Bans: ABBA)',
	// 			// 					'value': '4'
	// 			// 				},
	// 			// 				{
	// 			// 					'name': 'Choice: Roll Winner chooses Ban First and Pick First or opposite (Bans: ABAB)',
	// 			// 					'value': '5'
	// 			// 				},
	// 			// 				{
	// 			// 					'name': 'Choice: Roll Winner chooses Ban First and Pick First or opposite (Bans: ABBA)',
	// 			// 					'value': '6'
	// 			// 				},
	// 			// 			]
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'usenofail',
	// 			// 			'description': 'Should nofail be applied to all maps?',
	// 			// 			'type': 5,
	// 			// 			'required': true,
	// 			// 		},
	// 			// 		{
	// 			// 			'name': 'score',
	// 			// 			'description': 'What is the winning condition of the match?',
	// 			// 			'type': 3,
	// 			// 			'required': true,
	// 			// 			'choices': [
	// 			// 				{
	// 			// 					'name': 'Score v1',
	// 			// 					'value': '0'
	// 			// 				},
	// 			// 				{
	// 			// 					'name': 'Score v2',
	// 			// 					'value': '3'
	// 			// 				},
	// 			// 				{
	// 			// 					'name': 'Accuracy',
	// 			// 					'value': '1'
	// 			// 				}
	// 			// 			]
	// 			// 		},
	// 			// 	]
	// 			// },
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		if (interaction.options.getSubcommand() === 'soloqualifiers' || interaction.options.getSubcommand() === 'teamqualifiers') {
			let matchname = interaction.options.getString('matchname');
			let date = new Date();
			date.setUTCSeconds(0);
			date.setUTCMinutes(interaction.options.getInteger('minute'));
			date.setUTCHours(interaction.options.getInteger('hour'));
			date.setUTCDate(interaction.options.getInteger('date'));
			date.setUTCMonth(interaction.options.getInteger('month') - 1);
			date.setUTCFullYear(interaction.options.getInteger('year'));
			let useNoFail = interaction.options.getBoolean('usenofail');
			let scoreMode = interaction.options.getString('score');
			let freemodMessage = interaction.options.getString('freemodmessage');
			let teamsize = 1;

			if (interaction.options.getSubcommand() === 'teamqualifiers') {
				teamsize = interaction.options.getInteger('teamsize');
			}

			let channel = interaction.options.getChannel('channel');
			if (channel.type !== Discord.ChannelType.GuildText) {
				return interaction.followUp(`<#${channel.id}> is not a valid text channel.`);
			}

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			let players = interaction.options.getString('players');

			if (interaction.options.getSubcommand() === 'soloqualifiers') {
				players = players.replaceAll(',', ';');
			}

			let teams = players.split(';');

			let dbPlayers = [];
			for (let i = 0; i < teams.length; i++) {
				let team = [];
				for (let j = 0; j < teams[i].split(',').length; j++) {
					// eslint-disable-next-line no-undef
					process.send('osu!API');
					const response = await osuApi.getUser({ u: getIDFromPotentialOsuLink(teams[i].split(',')[j]), m: 0 })
						.then(async (user) => {
							updateOsuDetailsforUser(interaction.client, user, 0);

							//TODO: add attributes and logdatabasequeries
							logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 1');
							const dbDiscordUser = await DBDiscordUsers.findOne({
								where: {
									userId: {
										[Op.not]: null
									},
									osuUserId: user.id
								},
							});

							if (dbDiscordUser) {
								// Add the user to the team
								team.push(dbDiscordUser.id);
							} else {
								return interaction.followUp(`\`${user.name}\` doesn't have their account connected. Please tell them to connect their account using </osu-link connect:1064502370710605836>.`);
							}
						})
						.catch(err => {
							if (err.message === 'Not found') {
								return interaction.followUp(`Could not find user \`${getIDFromPotentialOsuLink(teams[i].split(',')[j]).replace(/`/g, '')}\`.`);
							} else {
								console.error(err);
								return interaction.followUp(`The bot ran into an error processing the user ${getIDFromPotentialOsuLink(teams[i].split(',')[j])}. Please try again.`);
							}
						});

					if (response) {
						return;
					}
				}
				//Push the team to the array
				dbPlayers.push(team.join(','));
			}

			let dbMaps = [];
			let maps = interaction.options.getString('mappool').split(',');
			let mappoolReadable = interaction.options.getString('mappool');

			for (let j = 0; j < maps.length; j++) {
				if (!maps[j].match(/[a-zA-Z]*\d+/gm)) {
					return interaction.followUp(`${maps[j]} is not a valid map`);
				}

				let mods = maps[j].replace(/\d*/gm, '');

				if (mods.length % 2 !== 0) {
					return interaction.followUp(`${maps[j]} does not have a valid mod combination`);
				}

				let modBits = 0;

				for (let i = 0; i < mods.length; i += 2) {
					let mod = mods.substr(i, 2).toUpperCase();

					if (mod === 'NM' || mod === 'FM') {
						continue;
					}

					mod = getModBits(mod);

					if (mod === 0) {
						return interaction.followUp(`${maps[j]} does not have a valid mod combination`);
					}

					modBits += mod;
				}

				let beatmapId = maps[j].replace(/[a-zA-Z]*/gm, '');

				let dbBeatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: modBits });

				if (dbBeatmap) {
					dbMaps.push(dbBeatmap.id);
				} else {
					return interaction.followUp(`The beatmap \`${beatmapId}\` could not be found.`);
				}
			}

			let now = new Date();
			if (now > date) {
				return interaction.followUp('You are trying to schedule a match in the past which is not allowed.');
			} else if (now.setUTCDate(now.getUTCDate() + 14) < date) {
				return interaction.followUp('You are trying to schedule a match more than 2 weeks in the future which is not allowed.');
			}

			date.setUTCMinutes(date.getUTCMinutes() - 15);

			logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue create');
			DBProcessQueue.create({ guildId: interaction.guildId, task: 'tourneyMatchNotification', priority: 10, additions: `${interaction.user.id};${channel.id};${dbMaps.join(',')};${dbPlayers.join('|')};${useNoFail};${matchname};${mappoolReadable};${scoreMode};${freemodMessage};${teamsize}`, date: date });
			return interaction.editReply('The match has been scheduled. The players will be informed as soon as it happens. To look at your scheduled matches please use </osu-referee scheduled:1064502493226225664>');
		} else if (interaction.options.getSubcommand() === 'scheduled') {
			let scheduledMatches = [];
			//Get all scheduled matches that still need to notify
			//TODO: add attributes and logdatabasequeries
			logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 1');
			const tourneyMatchNotifications = await DBProcessQueue.findAll({
				where: {
					guildId: interaction.guildId,
					task: 'tourneyMatchNotification'
				}
			});

			for (let i = 0; i < tourneyMatchNotifications.length; i++) {
				//Get the match data from the additions field
				let additions = tourneyMatchNotifications[i].additions.split(';');
				let players = additions[3].replaceAll('|', ',').split(',');
				let dbPlayers = [];
				for (let j = 0; j < players.length; j++) {
					//TODO: add attributes and logdatabasequeries
					logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 2');
					const dbDiscordUser = await DBDiscordUsers.findOne({
						where: { id: players[j] }
					});
					dbPlayers.push(dbDiscordUser);
				}

				// Sort players by id desc
				dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

				players = additions[3];
				for (let j = 0; j < dbPlayers.length; j++) {
					players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
				}

				//Get the match date from the date the task is scheduled to
				const matchDate = tourneyMatchNotifications[i].date;
				//Increase the matchDate by 15 minutes to get the date the match actually starts (Because notifications happen 15 minutes earlier)
				matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 15);

				scheduledMatches.push(`\`\`\`Scheduled:\nInternal ID: ${tourneyMatchNotifications[i].id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${players}\nMappool: ${additions[6]}\`\`\``);
			}

			//TODO: add attributes and logdatabasequeries
			logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 2');
			const tourneyMatchReferees = await DBProcessQueue.findAll({
				where: {
					guildId: interaction.guildId,
					task: 'tourneyMatchReferee'
				}
			});

			for (let i = 0; i < tourneyMatchReferees.length; i++) {
				let additions = tourneyMatchReferees[i].additions.split(';');
				let players = additions[3].replaceAll('|', ',').split(',');
				let dbPlayers = [];
				for (let j = 0; j < players.length; j++) {
					//TODO: add attributes and logdatabasequeries
					logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 3');
					const dbDiscordUser = await DBDiscordUsers.findOne({
						where: { id: players[j] }
					});
					dbPlayers.push(dbDiscordUser);
				}

				// Sort players by id desc
				dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

				players = additions[3];
				for (let j = 0; j < dbPlayers.length; j++) {
					players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
				}

				const matchDate = tourneyMatchReferees[i].date;
				matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 10);

				scheduledMatches.push(`\`\`\`Scheduled (Already pinged):\nInternal ID: ${tourneyMatchReferees[i].id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${players}\nMappool: ${additions[6]}\`\`\``);
			}

			if (!scheduledMatches.length) {
				return interaction.followUp('No matches scheduled.');
			} else {
				let scheduledMatchString = '';

				for (let i = 0; i < scheduledMatches.length; i++) {
					if (scheduledMatchString.length + scheduledMatches[i].length > 2000) {
						await interaction.followUp(scheduledMatchString);
						scheduledMatchString = '';
					}
					scheduledMatchString += scheduledMatches[i];
				}

				if (scheduledMatchString.length) {
					await interaction.followUp(scheduledMatchString);
				}
			}
		} else if (interaction.options.getSubcommand() === 'remove') {
			const internalId = interaction.options._hoistedOptions[0].value;
			//TODO: add attributes and logdatabasequeries
			logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 3');
			const processQueueTask = await DBProcessQueue.findOne({
				where: {
					id: internalId,
					guildId: interaction.guildId
				}
			});

			if (processQueueTask && (processQueueTask.task === 'tourneyMatchNotification' || processQueueTask.task === 'tourneyMatchReferee')) {
				let additions = processQueueTask.additions.split(';');
				let players = additions[3].replaceAll('|', ',').split(',');
				let dbPlayers = [];
				for (let j = 0; j < players.length; j++) {
					//TODO: add attributes and logdatabasequeries
					logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 4');
					const dbDiscordUser = await DBDiscordUsers.findOne({
						where: { id: players[j] }
					});
					dbPlayers.push(dbDiscordUser);
				}

				// Sort players by id desc
				dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

				players = additions[3];
				for (let j = 0; j < dbPlayers.length; j++) {
					players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
				}

				const matchDate = processQueueTask.date;
				if (processQueueTask.task === 'tourneyMatchNotification') {
					matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 15);
				} else if (processQueueTask.task === 'tourneyMatchReferee') {
					matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 10);
				}

				interaction.followUp(`The following match has been removed and is no longer scheduled to happen:\n\`\`\`Internal ID: ${processQueueTask.id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${players}\nMappool: ${additions[6]}\`\`\``);

				return processQueueTask.destroy();
			}

			return interaction.followUp('I couldn\'t find a scheduled match created by you with that internal ID.\nTo see what ID you need to put please use </osu-referee scheduled:1064502493226225664>');
		}
	},
};