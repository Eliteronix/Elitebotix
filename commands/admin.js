const { DBOsuMultiScores, DBProcessQueue, DBDiscordUsers, DBElitiriCupSignUp, DBElitiriCupSubmissions } = require('../dbObjects');
const { pause, logDatabaseQueries, getUserDuelStarRating, cleanUpDuplicateEntries, saveOsuMultiScores } = require('../utils');
const osu = require('node-osu');
const { developers, currentElitiriCup } = require('../config.json');

module.exports = {
	name: 'admin',
	//aliases: ['developer'],
	description: 'Sends a message with the bots server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (!developers.includes(msg.author.id)) {
			return;
		}

		if (args[0] === 'guildCommands') {

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: '8ball',
			// 		description: 'Answers with a random 8-Ball message',
			// 		options: [
			// 			{
			// 				'name': 'question',
			// 				'description': 'The question that should be answered',
			// 				'type': 3,
			// 				'required': true
			// 			}
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'activityrole',
			// 		description: 'Lets you set up roles which will be assigned based on useractivity',
			// 		options: [
			// 			{
			// 				'name': 'add',
			// 				'description': 'Lets you add a new role which will be assigned based on useractivity',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role that should be an activityrole',
			// 						'type': 8,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'rank',
			// 						'description': 'The required rank for getting the role',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'percentage',
			// 						'description': 'The required topx% rank for getting the role',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'points',
			// 						'description': 'The required points for getting the role',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'remove',
			// 				'description': 'Remove an existing activityrole',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role that should no longer be an activityrole',
			// 						'type': 8, // 8 is type ROLE
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'list',
			// 				'description': 'Show which activityroles are set up',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'autorole',
			// 		description: 'Lets you set up roles that will be automatically assigned on joining',
			// 		options: [
			// 			{
			// 				'name': 'add',
			// 				'description': 'Lets you add a new role that will be automatically assigned on joining',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role that should be an autorole',
			// 						'type': 8,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'remove',
			// 				'description': 'Remove an existing autorole',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role that should no longer be an autorole',
			// 						'type': 8, // 8 is type ROLE
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'list',
			// 				'description': 'Show which autoroles are set up',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'birthday',
			// 		description: 'Sets your birthday',
			// 		type: 1,
			// 		required: true,
			// 		options: [
			// 			{
			// 				'name': 'set',
			// 				'description': 'Sets your birthday',
			// 				'type': 1,
			// 				'required': false,
			// 				'options': [
			// 					{
			// 						'name': 'date',
			// 						'description': 'The date of the month in UTC (i.e. 29)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'month',
			// 						'description': 'The month in UTC (i.e. 11)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'enable',
			// 				'description': 'Enables your birthday announcement on this server',
			// 				'type': 1,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'disable',
			// 				'description': 'Enables your birthday announcement on this server',
			// 				'type': 1,
			// 				'required': false
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'birthday-admin',
			// 		description: 'Manage birthday announcements on your server',
			// 		type: 1,
			// 		required: true,
			// 		options: [
			// 			{
			// 				'name': 'enable',
			// 				'description': 'Enables birthday announcements on the server',
			// 				'type': 1,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'disable',
			// 				'description': 'Disables birthday announcements on the server',
			// 				'type': 1,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'channel',
			// 				'description': 'Sets the channel for birthday announcements',
			// 				'type': 1,
			// 				'required': false,
			// 				'options': [
			// 					{
			// 						'name': 'set',
			// 						'description': 'Sets the channel for birthday announcements',
			// 						'type': 7,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'creator',
			// 		description: 'Sends an info card about the developer'
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'cuddle',
			// 		description: 'Lets you send a gif to cuddle a user',
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to cuddle',
			// 				'type': 6, // 6 is type USER
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to cuddle',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to cuddle',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to cuddle',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to cuddle',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'feedback',
			// 		description: 'Sends feedback to the devs',
			// 		options: [
			// 			{
			// 				'name': 'type',
			// 				'description': 'The type of feedback',
			// 				'type': 3,
			// 				'required': true,
			// 				'choices': [
			// 					{
			// 						'name': 'bug',
			// 						'value': 'bug'
			// 					},
			// 					{
			// 						'name': 'feature',
			// 						'value': 'feature'
			// 					},
			// 					{
			// 						'name': 'feedback',
			// 						'value': 'feedback'
			// 					},
			// 					{
			// 						'name': 'question',
			// 						'value': 'question'
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'feedback',
			// 				'description': 'The feedback message',
			// 				'type': 3,
			// 				'required': true,
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'goodbye-message',
			// 		description: 'Lets you set up a message to be sent when someone leaves the server',
			// 		options: [
			// 			{
			// 				'name': 'current',
			// 				'description': 'Shows the current goodbye-message',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disable',
			// 				'description': 'Disables goodbye-messages',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'set',
			// 				'description': 'Allows you to set a new goodbye-message in the current channel',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'message',
			// 						'description': 'The message to be sent (use "@member" to mention the member)',
			// 						'type': 3, // 3 is type STRING
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'guild-leaderboard',
			// 		description: 'Sends a leaderboard of the top users in the guild',
			// 		options: [
			// 			{
			// 				'name': 'page',
			// 				'description': 'The page of the leaderboard to display',
			// 				'type': 4,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'help',
			// 		description: 'List all commands or get info about a specific command',
			// 		options: [
			// 			{
			// 				'name': 'list',
			// 				'description': 'Get a list of all commands',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'category',
			// 				'description': 'Get a list of commands for a category',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'categoryname',
			// 						'description': 'The name of the category',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'general',
			// 								'value': 'general'
			// 							},
			// 							{
			// 								'name': 'osu',
			// 								'value': 'osu'
			// 							},
			// 							{
			// 								'name': 'misc',
			// 								'value': 'misc'
			// 							},
			// 							{
			// 								'name': 'server-admin',
			// 								'value': 'server-admin'
			// 							}
			// 						]
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'command',
			// 				'description': 'Get help for a command',
			// 				'type': 1,
			// 				'options': [
			// 					{
			// 						'name': 'commandname',
			// 						'description': 'The name of the command',
			// 						'type': 3,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'hug',
			// 		description: 'Lets you send a gif to hug a user',
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to hug',
			// 				'type': 6, // 6 is type USER
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to hug',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to hug',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to hug',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to hug',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'kiss',
			// 		description: 'Lets you send a gif to kiss a user',
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to kiss',
			// 				'type': 6, // 6 is type USER
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to kiss',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to kiss',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to kiss',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to kiss',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'leaderboard',
			// 		description: 'Sends a leaderboard of the top users in the guild',
			// 		options: [
			// 			{
			// 				'name': 'type',
			// 				'description': 'Sends a leaderboard of all the players in the guild that have their account connected',
			// 				'type': 3,
			// 				'required': true,
			// 				'choices': [
			// 					{
			// 						'name': 'server',
			// 						'value': 'server'
			// 					},
			// 					{
			// 						'name': 'osu',
			// 						'value': 'osu'
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'page',
			// 				'description': 'The page of the leaderboard to display',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'mode',
			// 				'description': 'The osu! mode you want as your main',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'standard',
			// 						'value': '--s'
			// 					},
			// 					{
			// 						'name': 'taiko',
			// 						'value': '--t'
			// 					},
			// 					{
			// 						'name': 'catch',
			// 						'value': '--c'
			// 					},
			// 					{
			// 						'name': 'mania',
			// 						'value': '--m'
			// 					}
			// 				]
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'link',
			// 		description: 'Sends a link to add the bot to a server'
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'logging',
			// 		description: 'Lets you set up a message to be sent when someone leaves the server',
			// 		options: [
			// 			{
			// 				'name': 'list',
			// 				'description': 'Shows the current logging settings',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'channel',
			// 				'description': 'Set the channel that is supposed to log the information',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'channel',
			// 						'description': 'The channel that is supposed to log the information',
			// 						'type': 7, // 7 is type CHANNEL
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'toggleevent',
			// 				'description': 'Allows you to toggle if an event should be logged',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'eventname',
			// 						'description': 'The eventname found in the list embeds',
			// 						'type': 3, // 3 is type STRING
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'name-sync',
			// 		description: 'Allows you to sync discord player names to ingame names (and ranks)',
			// 		options: [
			// 			{
			// 				'name': 'setting',
			// 				'description': 'The setting for the name sync',
			// 				'type': 3,
			// 				'required': true,
			// 				'choices': [
			// 					{
			// 						'name': 'disable',
			// 						'value': 'disable'
			// 					},
			// 					{
			// 						'name': 'osu! name',
			// 						'value': 'osuname'
			// 					},
			// 					{
			// 						'name': 'osu! name and rank',
			// 						'value': 'osunameandrank'
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-beatmap',
			// 		description: 'Sends an info card about the specified beatmap',
			// 		options: [
			// 			{
			// 				'name': 'id',
			// 				'description': 'The id or link of the beatmap to display',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'mods',
			// 				'description': 'The mod combination that should be displayed (i.e. NM, HDHR, ...)',
			// 				'type': 3,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'tourney',
			// 				'description': 'Should additional tournament data be attached?',
			// 				'type': 5,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'id2',
			// 				'description': 'The id or link of the beatmap to display',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'id3',
			// 				'description': 'The id or link of the beatmap to display',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'id4',
			// 				'description': 'The id or link of the beatmap to display',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'id5',
			// 				'description': 'The id or link of the beatmap to display',
			// 				'type': 3,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-bws',
			// 		description: 'Sends info about the BWS rank of the specified player',
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player to calculate',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player to calculate',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player to calculate',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player to calculate',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player to calculate',
			// 				'type': 3,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-compare',
			// 		description: 'Sends an info card about the score of the specified player on the last map sent into the channel',
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player to compare',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player to compare',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player to compare',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player to compare',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player to compare',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-derank',
			// 		description: 'Reranks players based on their duel rating compared to others',
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player to calculate',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-duel',
			// 		description: 'Lets you play matches which are being reffed by the bot',
			// 		options: [
			// 			{
			// 				'name': 'match1v1',
			// 				'description': 'Lets you instantly create a Bo7 match against an opponent',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'opponent',
			// 						'description': 'The opponent you want to play against',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on. For example: 6.25',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'ranked',
			// 						'description': 'Should only ranked maps be played?',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'queue1v1',
			// 				'description': 'Lets you queue up for a Bo7 match against an opponent',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'queue1v1-leave',
			// 				'description': 'Lets you leave the queue for Bo7 matches',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'match2v2',
			// 				'description': 'Lets you instantly create a Bo7 match with 3 other players',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'teammate',
			// 						'description': 'The opponent you want to play against',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'firstopponent',
			// 						'description': 'The opponent you want to play against',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondopponent',
			// 						'description': 'The opponent you want to play against',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on. For example: 6.25',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'ranked',
			// 						'description': 'Should only ranked maps be played?',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'rating',
			// 				'description': 'Get shown what a users rating is',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'username',
			// 						'description': 'The username, id or link of the player to get the rating for',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'historical',
			// 						'description': 'The amount of historical data to be shown.',
			// 						'type': 3,
			// 						'required': false,
			// 						'choices': [
			// 							{
			// 								'name': 'Only the current data',
			// 								'value': '0'
			// 							},
			// 							{
			// 								'name': 'Including last year',
			// 								'value': '1'
			// 							},
			// 							{
			// 								'name': 'All historical data',
			// 								'value': '99'
			// 							}
			// 						]
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'rating-leaderboard',
			// 				'description': 'Get a leaderboard of the duel star ratings',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'page',
			// 						'description': 'The page of the leaderboard to display',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'data',
			// 				'description': 'Get shown what a users rating is based on',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'username',
			// 						'description': 'The username, id or link of the player to get the rating for',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'rating-spread',
			// 				'description': 'Get shown how the ranks are spread across all connected users',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'rating-updates',
			// 				'description': 'Get notified when your rating changes',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'enabled',
			// 						'description': 'Change if updates should be sent or not',
			// 						'type': 5,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-leaderboard',
			// 		description: 'Sends a leaderboard of all the players in the guild that have their account connected',
			// 		options: [
			// 			{
			// 				'name': 'page',
			// 				'description': 'The page of the leaderboard to display',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'mode',
			// 				'description': 'The osu! mode you want as your main',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'standard',
			// 						'value': '--s'
			// 					},
			// 					{
			// 						'name': 'taiko',
			// 						'value': '--t'
			// 					},
			// 					{
			// 						'name': 'catch',
			// 						'value': '--c'
			// 					},
			// 					{
			// 						'name': 'mania',
			// 						'value': '--m'
			// 					}
			// 				]
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-link',
			// 		description: 'Allows you to link your Discord Account to your osu! Account',
			// 		options: [
			// 			{
			// 				'name': 'connect',
			// 				'description': 'Connect your discord account to your osu! account',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'username',
			// 						'description': 'Your osu! username or alternatively id',
			// 						'type': 3,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'current',
			// 				'description': 'Get information on your current connection to an osu! account',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disconnect',
			// 				'description': 'Disconnect your discord account from your osu! account',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'verify',
			// 				'description': 'Resend the verification code ingame or confirm your verification',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'code',
			// 						'description': 'The verification code sent to you in osu! DMs',
			// 						'type': 3,
			// 						'required': false
			// 					}
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-matchscore',
			// 		description: 'Sends an evaluation of how valuable all the players in the match were',
			// 		options: [
			// 			{
			// 				'name': 'match',
			// 				'description': 'Match ID or link',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'warmups',
			// 				'description': 'The amount of warmups played',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'average',
			// 				'description': 'True means unplayed maps will be ignored',
			// 				'type': 5,
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-matchtrack',
			// 		description: 'Tracks the progress of a match',
			// 		options: [
			// 			{
			// 				'name': 'match',
			// 				'description': 'Match ID or link',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-matchup',
			// 		description: 'Sends an info card about the matchups between the specified players',
			// 		options: [
			// 			{
			// 				'name': '1v1',
			// 				'description': 'Get an info card about the matchups between the specified players',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'username',
			// 						'description': 'The name of a player to compare with',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'username2',
			// 						'description': 'The name of a player to compare with',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'scores',
			// 						'description': 'Which types of scores should the matchup evaluate?',
			// 						'type': 3,
			// 						'required': false,
			// 						'choices': [
			// 							{
			// 								'name': 'Only Score v2',
			// 								'value': '--v2'
			// 							},
			// 							{
			// 								'name': 'Only Score v1',
			// 								'value': '--v1'
			// 							},
			// 							{
			// 								'name': 'All Scores',
			// 								'value': '--vx'
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'tourney',
			// 						'description': 'Should it only count scores from tournaments?',
			// 						'type': 5,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'teamvs',
			// 				'description': 'Get an info card about the matchups between the specified teams',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'teamsize',
			// 						'description': 'The amount of players that are playing against each other on the maps',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'team1player1',
			// 						'description': 'The first user of the first team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team1player2',
			// 						'description': 'The second user of the first team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team1player3',
			// 						'description': 'The third user of the first team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team1player4',
			// 						'description': 'The fourth user of the first team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team1player5',
			// 						'description': 'The fifth user of the first team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team1player6',
			// 						'description': 'The sixth user of the first team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team1player7',
			// 						'description': 'The seventh user of the first team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team1player8',
			// 						'description': 'The eighth user of the first team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team2player1',
			// 						'description': 'The first user of the second team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team2player2',
			// 						'description': 'The second user of the second team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team2player3',
			// 						'description': 'The third user of the second team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team2player4',
			// 						'description': 'The fourth user of the second team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team2player5',
			// 						'description': 'The fifth user of the second team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team2player6',
			// 						'description': 'The sixth user of the second team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team2player7',
			// 						'description': 'The seventh user of the second team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'team2player8',
			// 						'description': 'The eighth user of the second team',
			// 						'type': 3,
			// 					},
			// 					{
			// 						'name': 'scores',
			// 						'description': 'Which types of scores should the matchup evaluate?',
			// 						'type': 3,
			// 						'required': false,
			// 						'choices': [
			// 							{
			// 								'name': 'Only Score v2',
			// 								'value': '--v2'
			// 							},
			// 							{
			// 								'name': 'Only Score v1',
			// 								'value': '--v1'
			// 							},
			// 							{
			// 								'name': 'All Scores',
			// 								'value': '--vx'
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'tourney',
			// 						'description': 'Should it only count scores from tournaments?',
			// 						'type': 5,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-motd',
			// 		description: 'Manage your Maps of the Day registration and create custom rounds',
			// 		options: [
			// 			{
			// 				'name': 'register',
			// 				'description': 'Register for the daily Maps of the Day competition',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'unregister',
			// 				'description': 'Register from the daily Maps of the Day competition',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'server',
			// 				'description': 'Get a link to the server of the daily Maps of the Day competition',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'mute',
			// 				'description': 'Mute the MOTD messages for the specified amount',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'years',
			// 						'description': 'The years until the reminder',
			// 						'type': 4,
			// 					},
			// 					{
			// 						'name': 'months',
			// 						'description': 'The months until the reminder',
			// 						'type': 4,
			// 					},
			// 					{
			// 						'name': 'weeks',
			// 						'description': 'The weeks until the reminder',
			// 						'type': 4,
			// 					},
			// 					{
			// 						'name': 'days',
			// 						'description': 'The days until the reminder',
			// 						'type': 4,
			// 					},
			// 					{
			// 						'name': 'hours',
			// 						'description': 'The hours until the reminder',
			// 						'type': 4,
			// 					},
			// 					{
			// 						'name': 'minutes',
			// 						'description': 'The minutes until the reminder',
			// 						'type': 4,
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'unmute',
			// 				'description': 'Unmute the MOTD messages',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'custom-fixed-players',
			// 				'description': 'Create a custom MOTD sort of competition with a fixed player list',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'lowerstars',
			// 						'description': 'The lower star rating limit for the custom lobby',
			// 						'type': 10, // 10 is type Number
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'higherstars',
			// 						'description': 'The higher star rating limit for the custom lobby',
			// 						'type': 10, // 10 is type Number
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'scoreversion',
			// 						'description': 'The score version for the custom lobby',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Score v1',
			// 								'value': '0'
			// 							},
			// 							{
			// 								'name': 'Score v2',
			// 								'value': '3'
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'username',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'username2',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'username3',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username4',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username5',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username6',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username7',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username8',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username9',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username10',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username11',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username12',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username13',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username14',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username15',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username16',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'mappool',
			// 						'description': 'The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'custom-react-to-play',
			// 				'description': 'Create a custom MOTD sort of competition where players can react to join',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'lowerstars',
			// 						'description': 'The lower star rating limit for the custom lobby',
			// 						'type': 10, // 10 is type Number
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'higherstars',
			// 						'description': 'The higher star rating limit for the custom lobby',
			// 						'type': 10, // 10 is type Number
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'scoreversion',
			// 						'description': 'The score version for the custom lobby',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Score v1',
			// 								'value': '0'
			// 							},
			// 							{
			// 								'name': 'Score v2',
			// 								'value': '3'
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'mappool',
			// 						'description': 'The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-profile',
			// 		description: 'Sends an info card about the specified player',
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'o-p',
			// 		description: 'Sends an info card about the specified player',
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-recent',
			// 		description: 'Sends an info card about the specified player',
			// 		options: [
			// 			{
			// 				'name': 'pass',
			// 				'description': 'Show the recent pass?',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'True',
			// 						'value': '--pass'
			// 					},

			// 				]
			// 			},
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'ors',
			// 		description: 'Sends an info card about the last score of the specified player',
			// 		options: [
			// 			{
			// 				'name': 'pass',
			// 				'description': 'Show the recent pass?',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'True',
			// 						'value': '--pass'
			// 					},

			// 				]
			// 			},
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-referee',
			// 		description: 'Lets you schedule matches which are being reffed by the bot',
			// 		options: [
			// 			{
			// 				'name': 'soloqualifiers',
			// 				'description': 'Lets you schedule a match which is being reffed by the bot',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'date',
			// 						'description': 'The date of the month in UTC (i.e. 29)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'month',
			// 						'description': 'The month in UTC (i.e. 11)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'year',
			// 						'description': 'The year in UTC (i.e. 2021)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'hour',
			// 						'description': 'The hour in UTC (i.e. 18)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'minute',
			// 						'description': 'The minute in UTC (i.e. 0)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'channel',
			// 						'description': 'The channel in which the players should be notified.',
			// 						'type': 7,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'matchname',
			// 						'description': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'mappool',
			// 						'description': 'The mappool in the following format: NM234826,HD123141,HR123172. Available mods: NM, HD, HR, DT',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'players',
			// 						'description': 'The username, id or link of the players seperated by a \',\'',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'usenofail',
			// 						'description': 'Should nofail be applied to all maps?',
			// 						'type': 5,
			// 						'required': true,
			// 					},
			// 					{
			// 						'name': 'score',
			// 						'description': 'What is the winning condition of the match?',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Score v1',
			// 								'value': '0'
			// 							},
			// 							{
			// 								'name': 'Score v2',
			// 								'value': '3'
			// 							},
			// 							{
			// 								'name': 'Accuracy',
			// 								'value': '1'
			// 							}
			// 						]
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': '1v1',
			// 				'description': 'Lets you schedule a match which is being reffed by the bot',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'date',
			// 						'description': 'The date of the month in UTC (i.e. 29)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'month',
			// 						'description': 'The month in UTC (i.e. 11)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'year',
			// 						'description': 'The year in UTC (i.e. 2021)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'hour',
			// 						'description': 'The hour in UTC (i.e. 18)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'minute',
			// 						'description': 'The minute in UTC (i.e. 0)',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'channel',
			// 						'description': 'The channel in which the players should be notified.',
			// 						'type': 7,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'matchname',
			// 						'description': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'mappool',
			// 						'description': 'The mappool in the following format: NM234826,HD123141,HR123172. Available mods: NM,HD,HR,DT,FM,TB',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of for the match.',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'bans',
			// 						'description': 'The amount of bans for each player.',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'players',
			// 						'description': 'The username, id or link of the players seperated by a \',\'',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'pickbanorder',
			// 						'description': 'What is the pick and ban order?',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Determined: Roll Winner Bans Second and Picks First (Bans: ABAB)',
			// 								'value': '1'
			// 							},
			// 							{
			// 								'name': 'Determined: Roll Winner Bans Second and Picks First (Bans: ABBA)',
			// 								'value': '2'
			// 							},
			// 							{
			// 								'name': 'Choice: Roll Winner chooses Ban Second and Pick First or opposite (Bans: ABAB)',
			// 								'value': '3'
			// 							},
			// 							{
			// 								'name': 'Choice: Roll Winner chooses Ban Second and Pick First or opposite (Bans: ABBA)',
			// 								'value': '4'
			// 							},
			// 							{
			// 								'name': 'Choice: Roll Winner chooses Ban First and Pick First or opposite (Bans: ABAB)',
			// 								'value': '5'
			// 							},
			// 							{
			// 								'name': 'Choice: Roll Winner chooses Ban First and Pick First or opposite (Bans: ABBA)',
			// 								'value': '6'
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'usenofail',
			// 						'description': 'Should nofail be applied to all maps?',
			// 						'type': 5,
			// 						'required': true,
			// 					},
			// 					{
			// 						'name': 'score',
			// 						'description': 'What is the winning condition of the match?',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Score v1',
			// 								'value': '0'
			// 							},
			// 							{
			// 								'name': 'Score v2',
			// 								'value': '3'
			// 							},
			// 							{
			// 								'name': 'Accuracy',
			// 								'value': '1'
			// 							}
			// 						]
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'scheduled',
			// 				'description': 'Show what matches you have scheduled',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'remove',
			// 				'description': 'Remove matches that you have scheduled over the bot',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'internalid',
			// 						'description': 'The internal ID which can be found when using /osu-referee scheduled',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-schedule',
			// 		description: 'Sends an info graph about the schedules of the players',
			// 		options: [
			// 			{
			// 				'name': 'weekday',
			// 				'description': 'The day of the week to filter the schedule for',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Monday',
			// 						'value': '1'
			// 					},
			// 					{
			// 						'name': 'Tuesday',
			// 						'value': '2'
			// 					},
			// 					{
			// 						'name': 'Wednesday',
			// 						'value': '3'
			// 					},
			// 					{
			// 						'name': 'Thursday',
			// 						'value': '4'
			// 					},
			// 					{
			// 						'name': 'Friday',
			// 						'value': '5'
			// 					},
			// 					{
			// 						'name': 'Saturday',
			// 						'value': '6'
			// 					},
			// 					{
			// 						'name': 'Sunday',
			// 						'value': '0'
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'team1player1',
			// 				'description': 'The first user of the first team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team1player2',
			// 				'description': 'The second user of the first team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team1player3',
			// 				'description': 'The third user of the first team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team1player4',
			// 				'description': 'The fourth user of the first team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team1player5',
			// 				'description': 'The fifth user of the first team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team1player6',
			// 				'description': 'The sixth user of the first team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team1player7',
			// 				'description': 'The seventh user of the first team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team1player8',
			// 				'description': 'The eighth user of the first team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team2player1',
			// 				'description': 'The first user of the second team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team2player2',
			// 				'description': 'The second user of the second team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team2player3',
			// 				'description': 'The third user of the second team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team2player4',
			// 				'description': 'The fourth user of the second team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team2player5',
			// 				'description': 'The fifth user of the second team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team2player6',
			// 				'description': 'The sixth user of the second team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team2player7',
			// 				'description': 'The seventh user of the second team',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'team2player8',
			// 				'description': 'The eighth user of the second team',
			// 				'type': 3,
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-score',
			// 		description: 'Sends an info card about the score of the specified player on the map',
			// 		options: [
			// 			{
			// 				'name': 'beatmap',
			// 				'description': 'The beatmap id or link',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'mods',
			// 				'description': 'The mod combination that should be displayed (i.e. all, NM, HDHR, ...)',
			// 				'type': 3,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'gamemode',
			// 				'description': 'Gamemode',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Standard',
			// 						'value': '--s',
			// 					},
			// 					{
			// 						'name': 'Mania',
			// 						'value': '--m',
			// 					},
			// 					{
			// 						'name': 'Catch The Beat',
			// 						'value': '--c',
			// 					},
			// 					{
			// 						'name': 'Taiko',
			// 						'value': '--t',
			// 					},
			// 				]
			// 			}, {
			// 				'name': 'server',
			// 				'description': 'The server from which the results will be displayed',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Bancho',
			// 						'value': '--b',
			// 					},
			// 					{
			// 						'name': 'Ripple',
			// 						'value': '--r',
			// 					},
			// 					{
			// 						'name': 'Tournaments',
			// 						'value': '--tournaments',
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-set',
			// 		description: 'Allows you to set your main mode and server',
			// 		options: [
			// 			{
			// 				'name': 'mode',
			// 				'description': 'Change the main mode when handling the bot',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'mode',
			// 						'description': 'The osu! mode you want as your main',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'standard',
			// 								'value': 'standard'
			// 							},
			// 							{
			// 								'name': 'taiko',
			// 								'value': 'taiko'
			// 							},
			// 							{
			// 								'name': 'catch',
			// 								'value': 'catch'
			// 							},
			// 							{
			// 								'name': 'mania',
			// 								'value': 'mania'
			// 							}
			// 						]
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'server',
			// 				'description': 'Change the main server when handling the bot',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'server',
			// 						'description': 'The osu! server you want as your main',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'bancho',
			// 								'value': 'bancho'
			// 							},
			// 							{
			// 								'name': 'ripple',
			// 								'value': 'ripple'
			// 							}
			// 						]
			// 					}
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-skills',
			// 		description: 'Sends an info card about the skills of the specified player',
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'scaled',
			// 				'description': 'Should the graph be scaled by the total evaluation?',
			// 				'type': 5,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'scores',
			// 				'description': 'Which types of scores should the graph evaluate?',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Only Score v2',
			// 						'value': '--v2'
			// 					},
			// 					{
			// 						'name': 'Only Score v1',
			// 						'value': '--v1'
			// 					},
			// 					{
			// 						'name': 'All Scores',
			// 						'value': '--vx'
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'tourney',
			// 				'description': 'Should it only count scores from tournaments?',
			// 				'type': 5,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'runningaverage',
			// 				'description': 'Should a running average be shown instead?',
			// 				'type': 5,
			// 				'required': false
			// 			}
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-top',
			// 		description: 'Sends an info card about the topplays of the specified player',
			// 		options: [
			// 			{
			// 				'name': 'sorting',
			// 				'description': 'Sort your top plays by...',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Approach Rate',
			// 						'value': '--ar',
			// 					},
			// 					{
			// 						'name': 'Circle Size',
			// 						'value': '--cs',
			// 					},
			// 					{
			// 						'name': 'Overall Difficulty',
			// 						'value': '--od',
			// 					},
			// 					{
			// 						'name': 'HP Drain',
			// 						'value': '--hp',
			// 					},
			// 					{
			// 						'name': 'Beats Per Minute',
			// 						'value': '--bpm',
			// 					},
			// 					{
			// 						'name': 'Length',
			// 						'value': '--length',
			// 					},
			// 					{
			// 						'name': 'Recent',
			// 						'value': '--new',
			// 					},
			// 					{
			// 						'name': 'Star Rating',
			// 						'value': '--sr',
			// 					},
			// 	]
			// 			},
			// 			{
			// 				'name': 'ascending',
			// 				'description': 'Sort your top plays in ascending order?',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'True',
			// 						'value': '--asc'
			// 					},

			// 				]
			// 			},
			// 			{
			// 				'name': 'amount',
			// 				'description': 'The amount of topplays to be displayed',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'gamemode',
			// 				'description': 'Gamemode',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Standard',
			// 						'value': 's',
			// 					},
			// 					{
			// 						'name': 'Mania',
			// 						'value': 'm',
			// 					},
			// 					{
			// 						'name': 'Catch The Beat',
			// 						'value': 'c',
			// 					},
			// 					{
			// 						'name': 'Taiko',
			// 						'value': 't',
			// 					},
			// 				]
			// 			}, {
			// 				'name': 'server',
			// 				'description': 'The server from which the results will be displayed',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Bancho',
			// 						'value': 'b',
			// 					},
			// 					{
			// 						'name': 'Ripple',
			// 						'value': 'r',
			// 					},
			// 					{
			// 						'name': 'Tournaments',
			// 						'value': 'tournaments',
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-mostplayed',
			// 		description: 'Sends an info card about the most played maps of the specified player',
			// 		options: [
			// 			{
			// 				'name': 'amount',
			// 				'description': 'The amount of most played maps to be displayed',
			// 				'type': 4,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'server',
			// 				'description': 'The server from which the results will be displayed',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Bancho',
			// 						'value': 'b',
			// 					},
			// 					{
			// 						'name': 'Ripple',
			// 						'value': 'r',
			// 					},
			// 					{
			// 						'name': 'Tournaments',
			// 						'value': 'tournaments',
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username2',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username3',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username4',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username5',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-tournament',
			// 		description: 'Sends a .txt file with all the data for the tournament matches with this acronym',
			// 		options: [
			// 			{
			// 				'name': 'acronym',
			// 				'description': 'The acronym of the tournament',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-track',
			// 		description: 'Tracks new scores set by the specified users',
			// 		options: [
			// 			{
			// 				'name': 'add',
			// 				'description': 'Lets you add a new user to track',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'username',
			// 						'description': 'The user to track',
			// 						'type': 3,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'remove',
			// 				'description': 'Stop tracking a user',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'username',
			// 						'description': 'The user to stop tracking',
			// 						'type': 3,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'list',
			// 				'description': 'Show which users are being tracked in the channel',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'pat',
			// 		description: 'Lets you send a gif to pat a user',
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to pat',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'poll',
			// 		description: 'Start a vote / poll',
			// 		options: [
			// 			{
			// 				'name': 'months',
			// 				'description': 'The months until the end of the poll',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'weeks',
			// 				'description': 'The weeks until the end of the poll',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'days',
			// 				'description': 'The days until the end of the poll',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'hours',
			// 				'description': 'The hours until the end of the poll',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'minutes',
			// 				'description': 'The minutes until the end of the poll',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'topic',
			// 				'description': 'The poll topic',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'option1',
			// 				'description': 'The first option of the poll',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'option2',
			// 				'description': 'The second option of the poll',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'option3',
			// 				'description': 'The third option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option4',
			// 				'description': 'The fourth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option5',
			// 				'description': 'The fifth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option6',
			// 				'description': 'The sixth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option7',
			// 				'description': 'The seventh option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option8',
			// 				'description': 'The eigth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option9',
			// 				'description': 'The ninth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'option10',
			// 				'description': 'The tenth option of the poll',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'prefix',
			// 		description: 'Change the bot\'s prefix on the server for chat commands',
			// 		options: [
			// 			{
			// 				'name': 'prefix',
			// 				'description': 'The new bot prefix',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'prune',
			// 		description: 'Delete recent messages',
			// 		options: [
			// 			{
			// 				'name': 'amount',
			// 				'description': 'The amount of messages to delete',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reactionrole',
			// 		description: 'Set up roles that users can assign themselves',
			// 		options: [
			// 			{
			// 				'name': 'embedadd',
			// 				'description': 'Create a new embed for reactionroles',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'name',
			// 						'description': 'The name of the embed',
			// 						'type': 3,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'embedremove',
			// 				'description': 'Remove an existing embed',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'embedchange',
			// 				'description': 'Change an existing embed',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'property',
			// 						'description': 'The property to change',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Title',
			// 								'value': 'title'
			// 							},
			// 							{
			// 								'name': 'Description',
			// 								'value': 'description'
			// 							},
			// 							{
			// 								'name': 'Color',
			// 								'value': 'color'
			// 							},
			// 							{
			// 								'name': 'Image',
			// 								'value': 'image'
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'value',
			// 						'description': 'The new title/description/color/image URL',
			// 						'type': 3,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'roleadd',
			// 				'description': 'Add a role to an embed',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'emoji',
			// 						'description': 'The emoji to represent the role',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'role',
			// 						'description': 'The emoji to represent the role',
			// 						'type': 8, // 8 is type ROLE
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'description',
			// 						'description': 'The description for the reactionrole',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'roleremove',
			// 				'description': 'Remove an existing reactionrole',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'emoji',
			// 						'description': 'The emoji that represents the role',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'rolechange',
			// 				'description': 'Change an existing reactionrole',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'embedid',
			// 						'description': 'The ID of the embed',
			// 						'type': 4,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'emoji',
			// 						'description': 'The emoji that represents the role',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'property',
			// 						'description': 'The property to change',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Emoji',
			// 								'value': 'emoji'
			// 							},
			// 							{
			// 								'name': 'Description',
			// 								'value': 'description'
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'value',
			// 						'description': 'The new emoji/description',
			// 						'type': 3,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reminders',
			// 		description: 'Sends your set reminders',
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reminders-delete',
			// 		description: 'Delete a selected reminder',
			// 		options: [
			// 			{
			// 				'name': 'id',
			// 				'description': 'Id of the reminder (can be found by using e!reminders command)',
			// 				'type': 4,
			// 				'required': true
			// 			}
			// 		],
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reminders-edit',
			// 		description: 'Edit your reminders',
			// 		options: [
			// 			{
			// 				'name': 'id',
			// 				'description': 'Id of the reminder (can be found by using e!reminders command)',
			// 				'type': 4,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'message',
			// 				'description': 'The message of the reminder',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'years',
			// 				'description': 'The years until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'months',
			// 				'description': 'The months until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'weeks',
			// 				'description': 'The weeks until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'days',
			// 				'description': 'The days until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'hours',
			// 				'description': 'The hours until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'minutes',
			// 				'description': 'The minutes until the reminder',
			// 				'type': 4,
			// 				'required': false,
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'remindme',
			// 		description: 'Sends a reminder at the specified time',
			// 		options: [
			// 			{
			// 				'name': 'message',
			// 				'description': 'The message of the reminder',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'years',
			// 				'description': 'The years until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'months',
			// 				'description': 'The months until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'weeks',
			// 				'description': 'The weeks until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'days',
			// 				'description': 'The days until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'hours',
			// 				'description': 'The hours until the reminder',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'minutes',
			// 				'description': 'The minutes until the reminder',
			// 				'type': 4,
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'roll',
			// 		description: 'Rolls a number between 1 and 100 or 1 and the number specified',
			// 		options: [
			// 			{
			// 				'name': 'maximum',
			// 				'description': 'The maximum number you can roll',
			// 				'type': 4,
			// 				'required': false
			// 			}
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'rollgame',
			// 		description: 'Start a round of rollgame'
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'server-info',
			// 		description: 'Sends an info card about the server'
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'settings',
			// 		description: 'Sends an info card about the settings of the bot for the server'
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'ship',
			// 		description: 'Lets you check how compatible two users are.',
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user or name to ship',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user or name to ship',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'slap',
			// 		description: 'Lets you send a gif to slap a user',
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to slap',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'starboard',
			// 		description: 'Highlight favourite messages with a star emoji!',
			// 		options: [
			// 			{
			// 				'name': 'enable',
			// 				'description': 'Enable the starboard for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disable',
			// 				'description': 'Disable the starboard for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'channel',
			// 				'description': 'Set the starboard channel where starred messages get sent to',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'channel',
			// 						'description': 'The channel to send messages to',
			// 						'type': 7, // 7 is type CHANNEL
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'minimum',
			// 				'description': 'Set the minimum amount of stars needed to highlight',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'amount',
			// 						'description': 'The minimum amount of stars needed',
			// 						'type': 4,
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'tempvoice',
			// 		description: 'Create temporary voice- and textchannels',
			// 		options: [
			// 			{
			// 				'name': 'enablevoice',
			// 				'description': 'Enable temporary voices for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disablevoice',
			// 				'description': 'Disable temporary voices for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'enabletext',
			// 				'description': 'Enable temporary textchannels along voices for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disabletext',
			// 				'description': 'Disable temporary textchannels along voices for the server',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'ticket',
			// 		description: 'Create and manage tickets',
			// 		options: [
			// 			{
			// 				'name': 'create',
			// 				'description': 'Create a ticket',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'issue',
			// 						'description': 'The issue description for your ticket',
			// 						'type': 3,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'state',
			// 				'description': 'Manage a ticket\'s workflow state',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'state',
			// 						'description': 'The ticket\'s workflow state',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Responded',
			// 								'value': 'responded'
			// 							},
			// 							{
			// 								'name': 'In action',
			// 								'value': 'action'
			// 							},
			// 							{
			// 								'name': 'Close',
			// 								'value': 'close'
			// 							}
			// 						]
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'addrole',
			// 				'description': 'Add a role to a ticket',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role to add to the ticket',
			// 						'type': 8,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'removerole',
			// 				'description': 'Remove a role from a ticket',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role to remove from the ticket',
			// 						'type': 8,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'time',
			// 		description: 'Sends current time of the given location',
			// 		options: [
			// 			{
			// 				'name': 'location',
			// 				'description': 'The location of which you want to find out the time',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'user-profile',
			// 		description: 'Sends an info card about the specified user',
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user2',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user3',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user4',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'user5',
			// 				'description': 'The user to send the info card of',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'weather-set',
			// 		description: 'Allows you to set the default degree type/location for the weather command',
			// 		options: [
			// 			{
			// 				'name': 'location',
			// 				'description': 'The location name or zip',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'location',
			// 						'description': 'The location name or zip',
			// 						'type': 3,
			// 						'required': true,
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'unit',
			// 				'description': 'The unit that should be used',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'unit',
			// 						'description': 'The unit that should be used',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Celcius',
			// 								'value': 'c'
			// 							},
			// 							{
			// 								'name': 'Fahrenheit',
			// 								'value': 'f'
			// 							},
			// 						]
			// 					}
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'weather-track',
			// 		description: 'Get hourly/daily weather updates for a specified location',
			// 		options: [
			// 			{
			// 				'name': 'list',
			// 				'description': 'List the currently tracked locations',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'add',
			// 				'description': 'Track a new location',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'location',
			// 						'description': 'The location or zipcode to track',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'frequency',
			// 						'description': 'The tracking frequency',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Daily',
			// 								'value': 'daily'
			// 							},
			// 							{
			// 								'name': 'Hourly',
			// 								'value': 'hourly'
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'unit',
			// 						'description': 'The tracking unit',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Celcius',
			// 								'value': 'c'
			// 							},
			// 							{
			// 								'name': 'Fahrenheit',
			// 								'value': 'f'
			// 							}
			// 						]
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'remove',
			// 				'description': 'Stop tracking a location',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'unit',
			// 						'description': 'The tracking unit',
			// 						'type': 3,
			// 						'required': true,
			// 						'choices': [
			// 							{
			// 								'name': 'Celcius',
			// 								'value': 'c'
			// 							},
			// 							{
			// 								'name': 'Fahrenheit',
			// 								'value': 'f'
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'location',
			// 						'description': 'The location or zipcode to track',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 				]
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'weather',
			// 		description: 'Sends info about the weather of the given location',
			// 		options: [
			// 			{
			// 				'name': 'unit',
			// 				'description': 'The unit that should be used',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'celcius',
			// 						'value': 'c'
			// 					},
			// 					{
			// 						'name': 'fahrenheit',
			// 						'value': 'f'
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'location',
			// 				'description': 'The location name or zip',
			// 				'type': 3,
			// 				'required': false
			// 			}
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'welcome-message',
			// 		description: 'Lets you set up a message to be sent when someone joins the server',
			// 		options: [
			// 			{
			// 				'name': 'current',
			// 				'description': 'Shows the current welcome-message',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'disable',
			// 				'description': 'Disables welcome-messages',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'set',
			// 				'description': 'Allows you to set a new welcome-message in the current channel',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'message',
			// 						'description': 'The message to be sent (use "@member" to mention the member)',
			// 						'type': 3, // 3 is type STRING
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 		]
			// 	},
			// });

		} else if (args[0] === 'removeGuildCommands') {
			const commands = await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.get();
			for (let i = 0; i < commands.length; i++) {
				await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands(commands[i].id).delete();
			}
		} else if (args[0] === 'globalCommands') {
			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: '8ball',
					description: 'Answers with a random 8-Ball message',
					options: [
						{
							'name': 'question',
							'description': 'The question that should be answered',
							'type': 3,
							'required': true
						}
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'activityrole',
					description: 'Lets you set up roles which will be assigned based on useractivity',
					options: [
						{
							'name': 'add',
							'description': 'Lets you add a new role which will be assigned based on useractivity',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'role',
									'description': 'The role that should be an activityrole',
									'type': 8,
									'required': true
								},
								{
									'name': 'rank',
									'description': 'The required rank for getting the role',
									'type': 4,
									'required': false
								},
								{
									'name': 'percentage',
									'description': 'The required topx% rank for getting the role',
									'type': 4,
									'required': false
								},
								{
									'name': 'points',
									'description': 'The required points for getting the role',
									'type': 4,
									'required': false
								},
							]
						},
						{
							'name': 'remove',
							'description': 'Remove an existing activityrole',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'role',
									'description': 'The role that should no longer be an activityrole',
									'type': 8, // 8 is type ROLE
									'required': true
								}
							]
						},
						{
							'name': 'list',
							'description': 'Show which activityroles are set up',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'autorole',
					description: 'Lets you set up roles that will be automatically assigned on joining',
					options: [
						{
							'name': 'add',
							'description': 'Lets you add a new role that will be automatically assigned on joining',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'role',
									'description': 'The role that should be an autorole',
									'type': 8,
									'required': true
								}
							]
						},
						{
							'name': 'remove',
							'description': 'Remove an existing autorole',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'role',
									'description': 'The role that should no longer be an autorole',
									'type': 8, // 8 is type ROLE
									'required': true
								}
							]
						},
						{
							'name': 'list',
							'description': 'Show which autoroles are set up',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'birthday',
					description: 'Sets your birthday',
					type: 1,
					required: true,
					options: [
						{
							'name': 'set',
							'description': 'Sets your birthday',
							'type': 1,
							'required': false,
							'options': [
								{
									'name': 'date',
									'description': 'The date of the month in UTC (i.e. 29)',
									'type': 4,
									'required': true
								},
								{
									'name': 'month',
									'description': 'The month in UTC (i.e. 11)',
									'type': 4,
									'required': true
								},
							]
						},
						{
							'name': 'enable',
							'description': 'Enables your birthday announcement on this server',
							'type': 1,
							'required': false
						},
						{
							'name': 'disable',
							'description': 'Enables your birthday announcement on this server',
							'type': 1,
							'required': false
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'birthday-admin',
					description: 'Manage birthday announcements on your server',
					type: 1,
					required: true,
					options: [
						{
							'name': 'enable',
							'description': 'Enables birthday announcements on the server',
							'type': 1,
							'required': false
						},
						{
							'name': 'disable',
							'description': 'Disables birthday announcements on the server',
							'type': 1,
							'required': false
						},
						{
							'name': 'channel',
							'description': 'Sets the channel for birthday announcements',
							'type': 1,
							'required': false,
							'options': [
								{
									'name': 'set',
									'description': 'Sets the channel for birthday announcements',
									'type': 7,
									'required': true,
								}
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'creator',
					description: 'Sends an info card about the developer'
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'cuddle',
					description: 'Lets you send a gif to cuddle a user',
					options: [
						{
							'name': 'user',
							'description': 'The user to cuddle',
							'type': 6, // 6 is type USER
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user to cuddle',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to cuddle',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to cuddle',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to cuddle',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'feedback',
					description: 'Sends feedback to the devs',
					options: [
						{
							'name': 'type',
							'description': 'The type of feedback',
							'type': 3,
							'required': true,
							'choices': [
								{
									'name': 'bug',
									'value': 'bug'
								},
								{
									'name': 'feature',
									'value': 'feature'
								},
								{
									'name': 'feedback',
									'value': 'feedback'
								},
								{
									'name': 'question',
									'value': 'question'
								}
							]
						},
						{
							'name': 'feedback',
							'description': 'The feedback message',
							'type': 3,
							'required': true,
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'goodbye-message',
					description: 'Lets you set up a message to be sent when someone leaves the server',
					options: [
						{
							'name': 'current',
							'description': 'Shows the current goodbye-message',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disable',
							'description': 'Disables goodbye-messages',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'set',
							'description': 'Allows you to set a new goodbye-message in the current channel',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'message',
									'description': 'The message to be sent (use "@member" to mention the member)',
									'type': 3, // 3 is type STRING
									'required': true
								}
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'guild-leaderboard',
					description: 'Sends a leaderboard of the top users in the guild',
					options: [
						{
							'name': 'page',
							'description': 'The page of the leaderboard to display',
							'type': 4,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'help',
					description: 'List all commands or get info about a specific command',
					options: [
						{
							'name': 'list',
							'description': 'Get a list of all commands',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'category',
							'description': 'Get a list of commands for a category',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'categoryname',
									'description': 'The name of the category',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'general',
											'value': 'general'
										},
										{
											'name': 'osu',
											'value': 'osu'
										},
										{
											'name': 'misc',
											'value': 'misc'
										},
										{
											'name': 'server-admin',
											'value': 'server-admin'
										}
									]
								}
							]
						},
						{
							'name': 'command',
							'description': 'Get help for a command',
							'type': 1,
							'options': [
								{
									'name': 'commandname',
									'description': 'The name of the command',
									'type': 3,
									'required': true
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'hug',
					description: 'Lets you send a gif to hug a user',
					options: [
						{
							'name': 'user',
							'description': 'The user to hug',
							'type': 6, // 6 is type USER
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user to hug',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to hug',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to hug',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to hug',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'kiss',
					description: 'Lets you send a gif to kiss a user',
					options: [
						{
							'name': 'user',
							'description': 'The user to kiss',
							'type': 6, // 6 is type USER
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user to kiss',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to kiss',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to kiss',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to kiss',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'leaderboard',
					description: 'Sends a leaderboard of the top users in the guild',
					options: [
						{
							'name': 'type',
							'description': 'Sends a leaderboard of all the players in the guild that have their account connected',
							'type': 3,
							'required': true,
							'choices': [
								{
									'name': 'server',
									'value': 'server'
								},
								{
									'name': 'osu',
									'value': 'osu'
								}
							]
						},
						{
							'name': 'page',
							'description': 'The page of the leaderboard to display',
							'type': 4,
							'required': false
						},
						{
							'name': 'mode',
							'description': 'The osu! mode you want as your main',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'standard',
									'value': '--s'
								},
								{
									'name': 'taiko',
									'value': '--t'
								},
								{
									'name': 'catch',
									'value': '--c'
								},
								{
									'name': 'mania',
									'value': '--m'
								}
							]
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'link',
					description: 'Sends a link to add the bot to a server'
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'logging',
					description: 'Lets you set up a message to be sent when someone leaves the server',
					options: [
						{
							'name': 'list',
							'description': 'Shows the current logging settings',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'channel',
							'description': 'Set the channel that is supposed to log the information',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'channel',
									'description': 'The channel that is supposed to log the information',
									'type': 7, // 7 is type CHANNEL
									'required': true
								}
							]
						},
						{
							'name': 'toggleevent',
							'description': 'Allows you to toggle if an event should be logged',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'eventname',
									'description': 'The eventname found in the list embeds',
									'type': 3, // 3 is type STRING
									'required': true
								}
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'name-sync',
					description: 'Allows you to sync discord player names to ingame names (and ranks)',
					options: [
						{
							'name': 'setting',
							'description': 'The setting for the name sync',
							'type': 3,
							'required': true,
							'choices': [
								{
									'name': 'disable',
									'value': 'disable'
								},
								{
									'name': 'osu! name',
									'value': 'osuname'
								},
								{
									'name': 'osu! name and rank',
									'value': 'osunameandrank'
								}
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-beatmap',
					description: 'Sends an info card about the specified beatmap',
					options: [
						{
							'name': 'id',
							'description': 'The id or link of the beatmap to display',
							'type': 3,
							'required': true
						},
						{
							'name': 'mods',
							'description': 'The mod combination that should be displayed (i.e. NM, HDHR, ...)',
							'type': 3,
							'required': false,
						},
						{
							'name': 'tourney',
							'description': 'Should additional tournament data be attached?',
							'type': 5,
							'required': false
						},
						{
							'name': 'id2',
							'description': 'The id or link of the beatmap to display',
							'type': 3,
							'required': false
						},
						{
							'name': 'id3',
							'description': 'The id or link of the beatmap to display',
							'type': 3,
							'required': false
						},
						{
							'name': 'id4',
							'description': 'The id or link of the beatmap to display',
							'type': 3,
							'required': false
						},
						{
							'name': 'id5',
							'description': 'The id or link of the beatmap to display',
							'type': 3,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-bws',
					description: 'Sends info about the BWS rank of the specified player',
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player to calculate',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player to calculate',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player to calculate',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player to calculate',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player to calculate',
							'type': 3,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-compare',
					description: 'Sends an info card about the score of the specified player on the last map sent into the channel',
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player to compare',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player to compare',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player to compare',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player to compare',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player to compare',
							'type': 3,
							'required': false
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-derank',
					description: 'Reranks players based on their duel rating compared to others',
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player to calculate',
							'type': 3,
							'required': false
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-duel',
					description: 'Lets you play matches which are being reffed by the bot',
					options: [
						{
							'name': 'match1v1',
							'description': 'Lets you instantly create a Bo7 match against an opponent',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'opponent',
									'description': 'The opponent you want to play against',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on. For example: 6.25',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'queue1v1',
							'description': 'Lets you queue up for a Bo7 match against an opponent',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'queue1v1-leave',
							'description': 'Lets you leave the queue for Bo7 matches',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'match2v2',
							'description': 'Lets you instantly create a Bo7 match with 3 other players',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'teammate',
									'description': 'The opponent you want to play against',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'firstopponent',
									'description': 'The opponent you want to play against',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondopponent',
									'description': 'The opponent you want to play against',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on. For example: 6.25',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'rating',
							'description': 'Get shown what a users rating is',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'username',
									'description': 'The username, id or link of the player to get the rating for',
									'type': 3,
									'required': false
								},
								{
									'name': 'historical',
									'description': 'The amount of historical data to be shown.',
									'type': 3,
									'required': false,
									'choices': [
										{
											'name': 'Only the current data',
											'value': '0'
										},
										{
											'name': 'Including last year',
											'value': '1'
										},
										{
											'name': 'All historical data',
											'value': '99'
										}
									]
								}
							]
						},
						{
							'name': 'rating-leaderboard',
							'description': 'Get a leaderboard of the duel star ratings',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'page',
									'description': 'The page of the leaderboard to display',
									'type': 4,
									'required': false
								},
							]
						},
						{
							'name': 'data',
							'description': 'Get shown what a users rating is based on',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'username',
									'description': 'The username, id or link of the player to get the rating for',
									'type': 3,
									'required': false
								},
							]
						},
						{
							'name': 'rating-spread',
							'description': 'Get shown how the ranks are spread across all connected users',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'rating-updates',
							'description': 'Get notified when your rating changes',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'enabled',
									'description': 'Change if updates should be sent or not',
									'type': 5,
									'required': true
								},
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-leaderboard',
					description: 'Sends a leaderboard of all the players in the guild that have their account connected',
					options: [
						{
							'name': 'page',
							'description': 'The page of the leaderboard to display',
							'type': 4,
							'required': false
						},
						{
							'name': 'mode',
							'description': 'The osu! mode you want as your main',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'standard',
									'value': '--s'
								},
								{
									'name': 'taiko',
									'value': '--t'
								},
								{
									'name': 'catch',
									'value': '--c'
								},
								{
									'name': 'mania',
									'value': '--m'
								}
							]
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-link',
					description: 'Allows you to link your Discord Account to your osu! Account',
					options: [
						{
							'name': 'connect',
							'description': 'Connect your discord account to your osu! account',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'username',
									'description': 'Your osu! username or alternatively id',
									'type': 3,
									'required': true
								}
							]
						},
						{
							'name': 'current',
							'description': 'Get information on your current connection to an osu! account',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disconnect',
							'description': 'Disconnect your discord account from your osu! account',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'verify',
							'description': 'Resend the verification code ingame or confirm your verification',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'code',
									'description': 'The verification code sent to you in osu! DMs',
									'type': 3,
									'required': false
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-matchscore',
					description: 'Sends an evaluation of how valuable all the players in the match were',
					options: [
						{
							'name': 'match',
							'description': 'Match ID or link',
							'type': 3,
							'required': true
						},
						{
							'name': 'warmups',
							'description': 'The amount of warmups played',
							'type': 4,
						},
						{
							'name': 'average',
							'description': 'True means unplayed maps will be ignored',
							'type': 5,
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-matchtrack',
					description: 'Tracks the progress of a match',
					options: [
						{
							'name': 'match',
							'description': 'Match ID or link',
							'type': 3,
							'required': true
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-matchup',
					description: 'Sends an info card about the matchups between the specified players',
					options: [
						{
							'name': '1v1',
							'description': 'Get an info card about the matchups between the specified players',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'username',
									'description': 'The name of a player to compare with',
									'type': 3,
									'required': true
								},
								{
									'name': 'username2',
									'description': 'The name of a player to compare with',
									'type': 3,
								},
								{
									'name': 'scores',
									'description': 'Which types of scores should the matchup evaluate?',
									'type': 3,
									'required': false,
									'choices': [
										{
											'name': 'Only Score v2',
											'value': '--v2'
										},
										{
											'name': 'Only Score v1',
											'value': '--v1'
										},
										{
											'name': 'All Scores',
											'value': '--vx'
										},
									]
								},
								{
									'name': 'tourney',
									'description': 'Should it only count scores from tournaments?',
									'type': 5,
									'required': false
								},
							]
						},
						{
							'name': 'teamvs',
							'description': 'Get an info card about the matchups between the specified teams',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'teamsize',
									'description': 'The amount of players that are playing against each other on the maps',
									'type': 4,
									'required': true
								},
								{
									'name': 'team1player1',
									'description': 'The first user of the first team',
									'type': 3,
								},
								{
									'name': 'team1player2',
									'description': 'The second user of the first team',
									'type': 3,
								},
								{
									'name': 'team1player3',
									'description': 'The third user of the first team',
									'type': 3,
								},
								{
									'name': 'team1player4',
									'description': 'The fourth user of the first team',
									'type': 3,
								},
								{
									'name': 'team1player5',
									'description': 'The fifth user of the first team',
									'type': 3,
								},
								{
									'name': 'team1player6',
									'description': 'The sixth user of the first team',
									'type': 3,
								},
								{
									'name': 'team1player7',
									'description': 'The seventh user of the first team',
									'type': 3,
								},
								{
									'name': 'team1player8',
									'description': 'The eighth user of the first team',
									'type': 3,
								},
								{
									'name': 'team2player1',
									'description': 'The first user of the second team',
									'type': 3,
								},
								{
									'name': 'team2player2',
									'description': 'The second user of the second team',
									'type': 3,
								},
								{
									'name': 'team2player3',
									'description': 'The third user of the second team',
									'type': 3,
								},
								{
									'name': 'team2player4',
									'description': 'The fourth user of the second team',
									'type': 3,
								},
								{
									'name': 'team2player5',
									'description': 'The fifth user of the second team',
									'type': 3,
								},
								{
									'name': 'team2player6',
									'description': 'The sixth user of the second team',
									'type': 3,
								},
								{
									'name': 'team2player7',
									'description': 'The seventh user of the second team',
									'type': 3,
								},
								{
									'name': 'team2player8',
									'description': 'The eighth user of the second team',
									'type': 3,
								},
								{
									'name': 'scores',
									'description': 'Which types of scores should the matchup evaluate?',
									'type': 3,
									'required': false,
									'choices': [
										{
											'name': 'Only Score v2',
											'value': '--v2'
										},
										{
											'name': 'Only Score v1',
											'value': '--v1'
										},
										{
											'name': 'All Scores',
											'value': '--vx'
										},
									]
								},
								{
									'name': 'tourney',
									'description': 'Should it only count scores from tournaments?',
									'type': 5,
									'required': false
								},
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-motd',
					description: 'Manage your Maps of the Day registration and create custom rounds',
					options: [
						{
							'name': 'register',
							'description': 'Register for the daily Maps of the Day competition',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'unregister',
							'description': 'Register from the daily Maps of the Day competition',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'server',
							'description': 'Get a link to the server of the daily Maps of the Day competition',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'mute',
							'description': 'Mute the MOTD messages for the specified amount',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'years',
									'description': 'The years until the reminder',
									'type': 4,
								},
								{
									'name': 'months',
									'description': 'The months until the reminder',
									'type': 4,
								},
								{
									'name': 'weeks',
									'description': 'The weeks until the reminder',
									'type': 4,
								},
								{
									'name': 'days',
									'description': 'The days until the reminder',
									'type': 4,
								},
								{
									'name': 'hours',
									'description': 'The hours until the reminder',
									'type': 4,
								},
								{
									'name': 'minutes',
									'description': 'The minutes until the reminder',
									'type': 4,
								},
							]
						},
						{
							'name': 'unmute',
							'description': 'Unmute the MOTD messages',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'custom-fixed-players',
							'description': 'Create a custom MOTD sort of competition with a fixed player list',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'lowerstars',
									'description': 'The lower star rating limit for the custom lobby',
									'type': 10, // 10 is type Number
									'required': true
								},
								{
									'name': 'higherstars',
									'description': 'The higher star rating limit for the custom lobby',
									'type': 10, // 10 is type Number
									'required': true
								},
								{
									'name': 'scoreversion',
									'description': 'The score version for the custom lobby',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Score v1',
											'value': '0'
										},
										{
											'name': 'Score v2',
											'value': '3'
										}
									]
								},
								{
									'name': 'username',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': true
								},
								{
									'name': 'username2',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': true
								},
								{
									'name': 'username3',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username4',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username5',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username6',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username7',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username8',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username9',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username10',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username11',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username12',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username13',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username14',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username15',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'username16',
									'description': 'The username, id or link of the player',
									'type': 3,
									'required': false
								},
								{
									'name': 'mappool',
									'description': 'The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
									'type': 3,
									'required': false
								},
							]
						},
						{
							'name': 'custom-react-to-play',
							'description': 'Create a custom MOTD sort of competition where players can react to join',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'lowerstars',
									'description': 'The lower star rating limit for the custom lobby',
									'type': 10, // 10 is type Number
									'required': true
								},
								{
									'name': 'higherstars',
									'description': 'The higher star rating limit for the custom lobby',
									'type': 10, // 10 is type Number
									'required': true
								},
								{
									'name': 'scoreversion',
									'description': 'The score version for the custom lobby',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Score v1',
											'value': '0'
										},
										{
											'name': 'Score v2',
											'value': '3'
										}
									]
								},
								{
									'name': 'mappool',
									'description': 'The ids or links of the beatmaps in this format: \'FM1,FM2,FM3,DT1,FM4,FM5,FM6,DT2,FM7,FM8\'',
									'type': 3,
									'required': false
								},
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-profile',
					description: 'Sends an info card about the specified player',
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'o-p',
					description: 'Sends an info card about the specified player',
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-recent',
					description: 'Sends an info card about the specified player',
					options: [
						{
							'name': 'pass',
							'description': 'Show the recent pass?',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'True',
									'value': '--pass'
								},

							]
						},
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'ors',
					description: 'Sends an info card about the last score of the specified player',
					options: [
						{
							'name': 'pass',
							'description': 'Show the recent pass?',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'True',
									'value': '--pass'
								},

							]
						},
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-referee',
					description: 'Lets you schedule matches which are being reffed by the bot',
					options: [
						{
							'name': 'soloqualifiers',
							'description': 'Lets you schedule a match which is being reffed by the bot',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'date',
									'description': 'The date of the month in UTC (i.e. 29)',
									'type': 4,
									'required': true
								},
								{
									'name': 'month',
									'description': 'The month in UTC (i.e. 11)',
									'type': 4,
									'required': true
								},
								{
									'name': 'year',
									'description': 'The year in UTC (i.e. 2021)',
									'type': 4,
									'required': true
								},
								{
									'name': 'hour',
									'description': 'The hour in UTC (i.e. 18)',
									'type': 4,
									'required': true
								},
								{
									'name': 'minute',
									'description': 'The minute in UTC (i.e. 0)',
									'type': 4,
									'required': true
								},
								{
									'name': 'channel',
									'description': 'The channel in which the players should be notified.',
									'type': 7,
									'required': true
								},
								{
									'name': 'matchname',
									'description': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
									'type': 3,
									'required': true
								},
								{
									'name': 'mappool',
									'description': 'The mappool in the following format: NM234826,HD123141,HR123172. Available mods: NM, HD, HR, DT',
									'type': 3,
									'required': true
								},
								{
									'name': 'players',
									'description': 'The username, id or link of the players seperated by a \',\'',
									'type': 3,
									'required': true
								},
								{
									'name': 'usenofail',
									'description': 'Should nofail be applied to all maps?',
									'type': 5,
									'required': true,
								},
								{
									'name': 'score',
									'description': 'What is the winning condition of the match?',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Score v1',
											'value': '0'
										},
										{
											'name': 'Score v2',
											'value': '3'
										},
										{
											'name': 'Accuracy',
											'value': '1'
										}
									]
								},
							]
						},
						{
							'name': 'scheduled',
							'description': 'Show what matches you have scheduled',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'remove',
							'description': 'Remove matches that you have scheduled over the bot',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'internalid',
									'description': 'The internal ID which can be found when using /osu-referee scheduled',
									'type': 4,
									'required': true
								},
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-schedule',
					description: 'Sends an info graph about the schedules of the players',
					options: [
						{
							'name': 'weekday',
							'description': 'The day of the week to filter the schedule for',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Monday',
									'value': '1'
								},
								{
									'name': 'Tuesday',
									'value': '2'
								},
								{
									'name': 'Wednesday',
									'value': '3'
								},
								{
									'name': 'Thursday',
									'value': '4'
								},
								{
									'name': 'Friday',
									'value': '5'
								},
								{
									'name': 'Saturday',
									'value': '6'
								},
								{
									'name': 'Sunday',
									'value': '0'
								},
							]
						},
						{
							'name': 'team1player1',
							'description': 'The first user of the first team',
							'type': 3,
						},
						{
							'name': 'team1player2',
							'description': 'The second user of the first team',
							'type': 3,
						},
						{
							'name': 'team1player3',
							'description': 'The third user of the first team',
							'type': 3,
						},
						{
							'name': 'team1player4',
							'description': 'The fourth user of the first team',
							'type': 3,
						},
						{
							'name': 'team1player5',
							'description': 'The fifth user of the first team',
							'type': 3,
						},
						{
							'name': 'team1player6',
							'description': 'The sixth user of the first team',
							'type': 3,
						},
						{
							'name': 'team1player7',
							'description': 'The seventh user of the first team',
							'type': 3,
						},
						{
							'name': 'team1player8',
							'description': 'The eighth user of the first team',
							'type': 3,
						},
						{
							'name': 'team2player1',
							'description': 'The first user of the second team',
							'type': 3,
						},
						{
							'name': 'team2player2',
							'description': 'The second user of the second team',
							'type': 3,
						},
						{
							'name': 'team2player3',
							'description': 'The third user of the second team',
							'type': 3,
						},
						{
							'name': 'team2player4',
							'description': 'The fourth user of the second team',
							'type': 3,
						},
						{
							'name': 'team2player5',
							'description': 'The fifth user of the second team',
							'type': 3,
						},
						{
							'name': 'team2player6',
							'description': 'The sixth user of the second team',
							'type': 3,
						},
						{
							'name': 'team2player7',
							'description': 'The seventh user of the second team',
							'type': 3,
						},
						{
							'name': 'team2player8',
							'description': 'The eighth user of the second team',
							'type': 3,
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-score',
					description: 'Sends an info card about the score of the specified player on the map',
					options: [
						{
							'name': 'beatmap',
							'description': 'The beatmap id or link',
							'type': 3,
							'required': true
						},
						{
							'name': 'mods',
							'description': 'The mod combination that should be displayed (i.e. all, NM, HDHR, ...)',
							'type': 3,
							'required': false,
						},
						{
							'name': 'gamemode',
							'description': 'Gamemode',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Standard',
									'value': '--s',
								},
								{
									'name': 'Mania',
									'value': '--m',
								},
								{
									'name': 'Catch The Beat',
									'value': '--c',
								},
								{
									'name': 'Taiko',
									'value': '--t',
								},
							]
						}, {
							'name': 'server',
							'description': 'The server from which the results will be displayed',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Bancho',
									'value': '--b',
								},
								{
									'name': 'Ripple',
									'value': '--r',
								},
								{
									'name': 'Tournaments',
									'value': '--tournaments',
								},
							]
						},
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-set',
					description: 'Allows you to set your main mode and server',
					options: [
						{
							'name': 'mode',
							'description': 'Change the main mode when handling the bot',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'mode',
									'description': 'The osu! mode you want as your main',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'standard',
											'value': 'standard'
										},
										{
											'name': 'taiko',
											'value': 'taiko'
										},
										{
											'name': 'catch',
											'value': 'catch'
										},
										{
											'name': 'mania',
											'value': 'mania'
										}
									]
								}
							]
						},
						{
							'name': 'server',
							'description': 'Change the main server when handling the bot',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'server',
									'description': 'The osu! server you want as your main',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'bancho',
											'value': 'bancho'
										},
										{
											'name': 'ripple',
											'value': 'ripple'
										}
									]
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-skills',
					description: 'Sends an info card about the skills of the specified player',
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'scaled',
							'description': 'Should the graph be scaled by the total evaluation?',
							'type': 5,
							'required': false
						},
						{
							'name': 'scores',
							'description': 'Which types of scores should the graph evaluate?',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Only Score v2',
									'value': '--v2'
								},
								{
									'name': 'Only Score v1',
									'value': '--v1'
								},
								{
									'name': 'All Scores',
									'value': '--vx'
								},
							]
						},
						{
							'name': 'tourney',
							'description': 'Should it only count scores from tournaments?',
							'type': 5,
							'required': false
						},
						{
							'name': 'runningaverage',
							'description': 'Should a running average be shown instead?',
							'type': 5,
							'required': false
						}
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-top',
					description: 'Sends an info card about the topplays of the specified player',
					options: [
						{
							'name': 'sorting',
							'description': 'Sort your top plays by...',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Approach Rate',
									'value': '--ar',
								},
								{
									'name': 'Circle Size',
									'value': '--cs',
								},
								{
									'name': 'Overall Difficulty',
									'value': '--od',
								},
								{
									'name': 'HP Drain',
									'value': '--hp',
								},
								{
									'name': 'Beats Per Minute',
									'value': '--bpm',
								},
								{
									'name': 'Length',
									'value': '--length',
								},
								{
									'name': 'Recent',
									'value': '--new',
								},
								{
									'name': 'Star Rating',
									'value': '--sr',
								}
							]
						},
						{
							'name': 'ascending',
							'description': 'Sort your top plays in ascending order?',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'True',
									'value': '--asc'
								},

							]
						},
						{
							'name': 'amount',
							'description': 'The amount of topplays to be displayed',
							'type': 4,
							'required': false
						},
						{
							'name': 'gamemode',
							'description': 'Gamemode',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Standard',
									'value': 's',
								},
								{
									'name': 'Mania',
									'value': 'm',
								},
								{
									'name': 'Catch The Beat',
									'value': 'c',
								},
								{
									'name': 'Taiko',
									'value': 't',
								},
							]
						}, {
							'name': 'server',
							'description': 'The server from which the results will be displayed',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Bancho',
									'value': 'b',
								},
								{
									'name': 'Ripple',
									'value': 'r',
								},
								{
									'name': 'Tournaments',
									'value': 'tournaments',
								},
							]
						},
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-mostplayed',
					description: 'Sends an info card about the most played maps of the specified player',
					options: [
						{
							'name': 'amount',
							'description': 'The amount of most played maps to be displayed',
							'type': 4,
							'required': false
						},
						{
							'name': 'server',
							'description': 'The server from which the results will be displayed',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Bancho',
									'value': 'b',
								},
								{
									'name': 'Ripple',
									'value': 'r',
								},
								{
									'name': 'Tournaments',
									'value': 'tournaments',
								},
							]
						},
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username2',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username3',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username4',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'username5',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-tournament',
					description: 'Sends a .txt file with all the data for the tournament matches with this acronym',
					options: [
						{
							'name': 'acronym',
							'description': 'The acronym of the tournament',
							'type': 3,
							'required': true
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-track',
					description: 'Tracks new scores set by the specified users',
					options: [
						{
							'name': 'add',
							'description': 'Lets you add a new user to track',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'username',
									'description': 'The user to track',
									'type': 3,
									'required': true
								}
							]
						},
						{
							'name': 'remove',
							'description': 'Stop tracking a user',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'username',
									'description': 'The user to stop tracking',
									'type': 3,
									'required': true
								}
							]
						},
						{
							'name': 'list',
							'description': 'Show which users are being tracked in the channel',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'pat',
					description: 'Lets you send a gif to pat a user',
					options: [
						{
							'name': 'user',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to pat',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'poll',
					description: 'Start a vote / poll',
					options: [
						{
							'name': 'months',
							'description': 'The months until the end of the poll',
							'type': 4,
							'required': true
						},
						{
							'name': 'weeks',
							'description': 'The weeks until the end of the poll',
							'type': 4,
							'required': true
						},
						{
							'name': 'days',
							'description': 'The days until the end of the poll',
							'type': 4,
							'required': true
						},
						{
							'name': 'hours',
							'description': 'The hours until the end of the poll',
							'type': 4,
							'required': true
						},
						{
							'name': 'minutes',
							'description': 'The minutes until the end of the poll',
							'type': 4,
							'required': true
						},
						{
							'name': 'topic',
							'description': 'The poll topic',
							'type': 3,
							'required': true
						},
						{
							'name': 'option1',
							'description': 'The first option of the poll',
							'type': 3,
							'required': true
						},
						{
							'name': 'option2',
							'description': 'The second option of the poll',
							'type': 3,
							'required': true
						},
						{
							'name': 'option3',
							'description': 'The third option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option4',
							'description': 'The fourth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option5',
							'description': 'The fifth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option6',
							'description': 'The sixth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option7',
							'description': 'The seventh option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option8',
							'description': 'The eigth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option9',
							'description': 'The ninth option of the poll',
							'type': 3,
							'required': false
						},
						{
							'name': 'option10',
							'description': 'The tenth option of the poll',
							'type': 3,
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'prefix',
					description: 'Change the bot\'s prefix on the server for chat commands',
					options: [
						{
							'name': 'prefix',
							'description': 'The new bot prefix',
							'type': 3,
							'required': true
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'prune',
					description: 'Delete recent messages',
					options: [
						{
							'name': 'amount',
							'description': 'The amount of messages to delete',
							'type': 4,
							'required': true
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reactionrole',
					description: 'Set up roles that users can assign themselves',
					options: [
						{
							'name': 'embedadd',
							'description': 'Create a new embed for reactionroles',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'name',
									'description': 'The name of the embed',
									'type': 3,
									'required': true
								}
							]
						},
						{
							'name': 'embedremove',
							'description': 'Remove an existing embed',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								}
							]
						},
						{
							'name': 'embedchange',
							'description': 'Change an existing embed',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								},
								{
									'name': 'property',
									'description': 'The property to change',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Title',
											'value': 'title'
										},
										{
											'name': 'Description',
											'value': 'description'
										},
										{
											'name': 'Color',
											'value': 'color'
										},
										{
											'name': 'Image',
											'value': 'image'
										}
									]
								},
								{
									'name': 'value',
									'description': 'The new title/description/color/image URL',
									'type': 3,
									'required': true,
								}
							]
						},
						{
							'name': 'roleadd',
							'description': 'Add a role to an embed',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								},
								{
									'name': 'emoji',
									'description': 'The emoji to represent the role',
									'type': 3,
									'required': true
								},
								{
									'name': 'role',
									'description': 'The emoji to represent the role',
									'type': 8, // 8 is type ROLE
									'required': true
								},
								{
									'name': 'description',
									'description': 'The description for the reactionrole',
									'type': 3,
									'required': true
								},
							]
						},
						{
							'name': 'roleremove',
							'description': 'Remove an existing reactionrole',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								},
								{
									'name': 'emoji',
									'description': 'The emoji that represents the role',
									'type': 3,
									'required': true
								},
							]
						},
						{
							'name': 'rolechange',
							'description': 'Change an existing reactionrole',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'embedid',
									'description': 'The ID of the embed',
									'type': 4,
									'required': true
								},
								{
									'name': 'emoji',
									'description': 'The emoji that represents the role',
									'type': 3,
									'required': true
								},
								{
									'name': 'property',
									'description': 'The property to change',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Emoji',
											'value': 'emoji'
										},
										{
											'name': 'Description',
											'value': 'description'
										}
									]
								},
								{
									'name': 'value',
									'description': 'The new emoji/description',
									'type': 3,
									'required': true,
								}
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reminders',
					description: 'Sends your set reminders',
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reminders-delete',
					description: 'Delete a selected reminder',
					options: [
						{
							'name': 'id',
							'description': 'Id of the reminder (can be found by using e!reminders command)',
							'type': 4,
							'required': true
						}
					],
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reminders-edit',
					description: 'Edit your reminders',
					options: [
						{
							'name': 'id',
							'description': 'Id of the reminder (can be found by using e!reminders command)',
							'type': 4,
							'required': true
						},
						{
							'name': 'message',
							'description': 'The message of the reminder',
							'type': 3,
							'required': true
						},
						{
							'name': 'years',
							'description': 'The years until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'months',
							'description': 'The months until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'weeks',
							'description': 'The weeks until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'days',
							'description': 'The days until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'hours',
							'description': 'The hours until the reminder',
							'type': 4,
							'required': false,
						},
						{
							'name': 'minutes',
							'description': 'The minutes until the reminder',
							'type': 4,
							'required': false,
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'remindme',
					description: 'Sends a reminder at the specified time',
					options: [
						{
							'name': 'message',
							'description': 'The message of the reminder',
							'type': 3,
							'required': true
						},
						{
							'name': 'years',
							'description': 'The years until the reminder',
							'type': 4,
						},
						{
							'name': 'months',
							'description': 'The months until the reminder',
							'type': 4,
						},
						{
							'name': 'weeks',
							'description': 'The weeks until the reminder',
							'type': 4,
						},
						{
							'name': 'days',
							'description': 'The days until the reminder',
							'type': 4,
						},
						{
							'name': 'hours',
							'description': 'The hours until the reminder',
							'type': 4,
						},
						{
							'name': 'minutes',
							'description': 'The minutes until the reminder',
							'type': 4,
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'roll',
					description: 'Rolls a number between 1 and 100 or 1 and the number specified',
					options: [
						{
							'name': 'maximum',
							'description': 'The maximum number you can roll',
							'type': 4,
							'required': false
						}
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'rollgame',
					description: 'Start a round of rollgame'
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'server-info',
					description: 'Sends an info card about the server'
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'settings',
					description: 'Sends an info card about the settings of the bot for the server'
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'ship',
					description: 'Lets you check how compatible two users are.',
					options: [
						{
							'name': 'user',
							'description': 'The user or name to ship',
							'type': 3,
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user or name to ship',
							'type': 3,
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'slap',
					description: 'Lets you send a gif to slap a user',
					options: [
						{
							'name': 'user',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': true
						},
						{
							'name': 'user2',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to slap',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'starboard',
					description: 'Highlight favourite messages with a star emoji!',
					options: [
						{
							'name': 'enable',
							'description': 'Enable the starboard for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disable',
							'description': 'Disable the starboard for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'channel',
							'description': 'Set the starboard channel where starred messages get sent to',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'channel',
									'description': 'The channel to send messages to',
									'type': 7, // 7 is type CHANNEL
									'required': true
								}
							]
						},
						{
							'name': 'minimum',
							'description': 'Set the minimum amount of stars needed to highlight',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'amount',
									'description': 'The minimum amount of stars needed',
									'type': 4,
									'required': true
								}
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'tempvoice',
					description: 'Create temporary voice- and textchannels',
					options: [
						{
							'name': 'enablevoice',
							'description': 'Enable temporary voices for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disablevoice',
							'description': 'Disable temporary voices for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'enabletext',
							'description': 'Enable temporary textchannels along voices for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disabletext',
							'description': 'Disable temporary textchannels along voices for the server',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'ticket',
					description: 'Create and manage tickets',
					options: [
						{
							'name': 'create',
							'description': 'Create a ticket',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'issue',
									'description': 'The issue description for your ticket',
									'type': 3,
									'required': true,
								}
							]
						},
						{
							'name': 'state',
							'description': 'Manage a ticket\'s workflow state',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'state',
									'description': 'The ticket\'s workflow state',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Responded',
											'value': 'responded'
										},
										{
											'name': 'In action',
											'value': 'action'
										},
										{
											'name': 'Close',
											'value': 'close'
										}
									]
								}
							]
						},
						{
							'name': 'addrole',
							'description': 'Add a role to a ticket',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'role',
									'description': 'The role to add to the ticket',
									'type': 8,
									'required': true,
								}
							]
						},
						{
							'name': 'removerole',
							'description': 'Remove a role from a ticket',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'role',
									'description': 'The role to remove from the ticket',
									'type': 8,
									'required': true,
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'time',
					description: 'Sends current time of the given location',
					options: [
						{
							'name': 'location',
							'description': 'The location of which you want to find out the time',
							'type': 3,
							'required': true
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'user-profile',
					description: 'Sends an info card about the specified user',
					options: [
						{
							'name': 'user',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user2',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user3',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user4',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'user5',
							'description': 'The user to send the info card of',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'weather-set',
					description: 'Allows you to set the default degree type/location for the weather command',
					options: [
						{
							'name': 'location',
							'description': 'The location name or zip',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'location',
									'description': 'The location name or zip',
									'type': 3,
									'required': true,
								}
							]
						},
						{
							'name': 'unit',
							'description': 'The unit that should be used',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'unit',
									'description': 'The unit that should be used',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Celcius',
											'value': 'c'
										},
										{
											'name': 'Fahrenheit',
											'value': 'f'
										},
									]
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'weather-track',
					description: 'Get hourly/daily weather updates for a specified location',
					options: [
						{
							'name': 'list',
							'description': 'List the currently tracked locations',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'add',
							'description': 'Track a new location',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'location',
									'description': 'The location or zipcode to track',
									'type': 3,
									'required': true
								},
								{
									'name': 'frequency',
									'description': 'The tracking frequency',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Daily',
											'value': 'daily'
										},
										{
											'name': 'Hourly',
											'value': 'hourly'
										},
									]
								},
								{
									'name': 'unit',
									'description': 'The tracking unit',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Celcius',
											'value': 'c'
										},
										{
											'name': 'Fahrenheit',
											'value': 'f'
										}
									]
								}
							]
						},
						{
							'name': 'remove',
							'description': 'Stop tracking a location',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'unit',
									'description': 'The tracking unit',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'Celcius',
											'value': 'c'
										},
										{
											'name': 'Fahrenheit',
											'value': 'f'
										}
									]
								},
								{
									'name': 'location',
									'description': 'The location or zipcode to track',
									'type': 3,
									'required': true
								},
							]
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'weather',
					description: 'Sends info about the weather of the given location',
					options: [
						{
							'name': 'unit',
							'description': 'The unit that should be used',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'celcius',
									'value': 'c'
								},
								{
									'name': 'fahrenheit',
									'value': 'f'
								}
							]
						},
						{
							'name': 'location',
							'description': 'The location name or zip',
							'type': 3,
							'required': false
						}
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'welcome-message',
					description: 'Lets you set up a message to be sent when someone joins the server',
					options: [
						{
							'name': 'current',
							'description': 'Shows the current welcome-message',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'disable',
							'description': 'Disables welcome-messages',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'set',
							'description': 'Allows you to set a new welcome-message in the current channel',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'message',
									'description': 'The message to be sent (use "@member" to mention the member)',
									'type': 3, // 3 is type STRING
									'required': true
								}
							]
						},
					]
				},
			});

		} else if (args[0] === 'removeGlobalCommands') {
			const commands = await msg.client.api.applications(msg.client.user.id).commands.get();
			for (let i = 0; i < commands.length; i++) {
				await msg.client.api.applications(msg.client.user.id).commands(commands[i].id).delete();
			}
		} else if (args[0] === 'saveMultiMatches') {
			const processQueueTasks = await DBProcessQueue.findAll({ where: { task: 'saveMultiMatches' } });
			for (let i = 0; i < processQueueTasks.length; i++) {
				await processQueueTasks[i].destroy();
			}

			let now = new Date();
			DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: `${args[1]}`, priority: 0, date: now });
		} else if (args[0] === 'sendMultis') {
			for (let i = parseInt(args[1]); i < parseInt(args[2]); i++) {
				msg.reply(`https://osu.ppy.sh/community/matches/${i}`);
			}
		} else if (args[0] === 'removeOsuUserConnection') {
			let DBDiscordUser = await DBDiscordUsers.findOne({
				where: { osuUserId: args[1], osuVerified: true }
			});

			if (DBDiscordUser) {
				DBDiscordUser.osuUserId = null;
				DBDiscordUser.osuVerificationCode = null;
				DBDiscordUser.osuVerified = false;
				DBDiscordUser.osuName = null;
				DBDiscordUser.osuBadges = 0;
				DBDiscordUser.osuPP = null;
				DBDiscordUser.osuRank = null;
				DBDiscordUser.taikoPP = null;
				DBDiscordUser.taikoRank = null;
				DBDiscordUser.catchPP = null;
				DBDiscordUser.catchRank = null;
				DBDiscordUser.maniaPP = null;
				DBDiscordUser.maniaRank = null;
				DBDiscordUser.save();
				console.log('Removed osuUserId and verification for:', args[1]);
			} else {
				msg.reply('User not found');
			}
		} else if (args[0] === 'deleteElitiriSignup') {
			let DBElitiriSignup = await DBElitiriCupSignUp.findOne({
				where: { id: args[1] }
			});

			if (DBElitiriSignup) {
				DBElitiriSignup.destroy();
				console.log('Deleted Elitiri Signup:', args[1]);
			} else {
				msg.reply('Signup not found');
			}
		} else if (args[0] === 'updateElitiriRanks') {
			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBElitiriCupSignUp');
			let DBElitiriSignups = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: currentElitiriCup }
			});

			for (let i = 0; i < DBElitiriSignups.length; i++) {
				logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue');
				const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId } });
				if (!existingTask) {
					DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignups[i].userId });
				}
			}
		} else if (args[0] === 'updateElitiriPlayer') {
			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBElitiriCupSignUp');
			let DBElitiriSignup = await DBElitiriCupSignUp.findOne({
				where: { tournamentName: currentElitiriCup, osuUserId: args[1] }
			});

			logDatabaseQueries(4, 'commands/admin.js updateElitiriRanks DBProcessQueue');
			const existingTask = await DBProcessQueue.findOne({ where: { guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignup.userId } });
			if (!existingTask) {
				DBProcessQueue.create({ guildId: 'None', task: 'updateOsuRank', priority: 3, additions: DBElitiriSignup.userId });
			}
			// DBElitiriSignup.osuRank = args[2];
			// DBElitiriSignup.bracketName = args[3] + ' ' + args[4];
			// DBElitiriSignup.save();
		} else if (args[0] === 'multiScoresDBSize') {
			const mapScoreAmount = await DBOsuMultiScores.count();

			console.log(mapScoreAmount);
		} else if (args[0] === 'updateServerDuelRatings') {
			let sentMessage = await msg.reply('Processing...');
			await msg.guild.members.fetch()
				.then(async (guildMembers) => {

					const members = [];
					guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));

					for (let i = 0; i < members.length; i++) {
						await sentMessage.edit(`${i} out of ${members.length} done`);
						logDatabaseQueries(4, 'commands/admin.js DBDiscordUsers');
						const discordUser = await DBDiscordUsers.findOne({
							where: {
								userId: members[i].id
							},
						});

						if (discordUser) {
							await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: msg.client });

							await pause(10000);
						}
					}

					sentMessage.delete();
				})
				.catch(error => {
					console.log(error);
				});
		} else if (args[0] === 'connectTwitch') {
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					osuUserId: args[1]
				}
			});

			discordUser.twitchName = args[2].toLowerCase();
			discordUser.save();
		} else if (args[0] === 'addElitiriTopBracketNMMap') {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			osuApi.getBeatmaps({ b: args[1] })
				.then(async (beatmaps) => {
					DBElitiriCupSubmissions.create({
						osuUserId: '-1',
						osuName: 'ECW 2021 Submission',
						bracketName: 'Top Bracket',
						tournamentName: currentElitiriCup,
						modPool: 'NM',
						title: beatmaps[0].title,
						artist: beatmaps[0].artist,
						difficulty: beatmaps[0].version,
						starRating: beatmaps[0].difficulty.rating,
						drainLength: beatmaps[0].length.drain,
						circleSize: beatmaps[0].difficulty.size,
						approachRate: beatmaps[0].difficulty.approach,
						overallDifficulty: beatmaps[0].difficulty.overall,
						hpDrain: beatmaps[0].difficulty.drain,
						mapper: beatmaps[0].creator,
						beatmapId: beatmaps[0].id,
						beatmapsetId: beatmaps[0].beatmapSetId,
						bpm: beatmaps[0].bpm,
					});
				})
				.catch(error => {
					console.log(error);
				});
		} else if (args[0] === 'patreon') {
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: args[1]
				}
			});

			if (discordUser.patreon) {
				discordUser.patreon = false;
				msg.reply('Patreon status set to false');
			} else {
				discordUser.patreon = true;
				msg.reply('Patreon status set to true');
			}
			discordUser.save();
		} else if (args[0] === 'removeTwitchSyncEnable') {
			let twitchSyncUsers = await DBDiscordUsers.findAll({
				where: {
					twitchOsuMapSync: true
				}
			});

			for (let i = 0; i < twitchSyncUsers.length; i++) {
				twitchSyncUsers[i].twitchOsuMapSync = false;
				await twitchSyncUsers[i].save();
			}
		} else if (args[0] === 'cleanUp') {
			cleanUpDuplicateEntries(true);
		} else if (args[0] === 'disconnectBancho') {
			try {
				await additionalObjects[1].disconnect();
				// eslint-disable-next-line no-undef
				return msg.reply(`Worker ${process.env.pm_id} disconnected`);
			} catch (e) {
				console.log(e);
				// eslint-disable-next-line no-undef
				return msg.reply(`Worker ${process.env.pm_id} errored disconnecting`);
			}
		} else if (args[0] === 'reimportMatch') {
			let matchScores = await DBOsuMultiScores.findAll({
				where: {
					matchId: args[1]
				}
			});

			let processingMessage = await msg.channel.send(`Deleting match scores for match ${args[1]} [0/${matchScores.length}]`);
			for (let i = 0; i < matchScores.length; i++) {
				await matchScores[i].destroy();
				if (i % 25 === 0) {
					await processingMessage.edit(`Deleting match scores for match ${args[1]} [${i + 1}/${matchScores.length}]`);
				}
			}

			await processingMessage.edit(`Reimporting match scores for match ${args[1]}`);

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			return osuApi.getMatch({ mp: args[1] })
				.then(async (match) => {
					await saveOsuMultiScores(match);
					return processingMessage.edit(`Reimported match ${args[1]}`);
				})
				.catch(async (err) => {
					if (err.message === 'Not found') {
						return processingMessage.edit(`Match ${args[1]} not found`);
					} else {
						return processingMessage.edit(`Error reimporting match ${args[1]}`);
					}
				});
		} else {
			msg.reply('Invalid command');
		}

		msg.reply('Done.');
	},
};