const { DBOsuMultiScores, DBProcessQueue, DBDiscordUsers, DBElitiriCupSignUp, DBElitiriCupSubmissions, DBOsuForumPosts, DBDuelRatingHistory } = require('../dbObjects');
const { pause, logDatabaseQueries, getUserDuelStarRating, cleanUpDuplicateEntries, saveOsuMultiScores, humanReadable, multiToBanchoScore, getOsuBeatmap, getMods } = require('../utils');
const osu = require('node-osu');
const { developers, currentElitiriCup } = require('../config.json');
const { Op } = require('sequelize');
const Discord = require('discord.js');
const ObjectsToCsv = require('objects-to-csv');

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

		let manageChannels = (1 << 4).toString();
		let manageGuild = (1 << 5).toString();
		let manageMessages = (1 << 13).toString();
		let manageRoles = (1 << 28).toString();

		if (args[0] === 'guildCommands') {
			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: '8ball',
			// 		description: 'Answers with a random 8-Ball message',
			// 		dm_permission: true,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageRoles,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageRoles,
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
			// 		dm_permission: true,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
			// 		description: 'Sends an info card about the developers'
			// 		dm_permission: true,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'cuddle',
			// 		description: 'Lets you send a gif to cuddle a user',
			// 		dm_permission: false,
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
			// 		dm_permission: true,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
			// 		dm_permission: false,
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
			// 		dm_permission: true,
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
			// 		dm_permission: false,
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
			// 		dm_permission: false,
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
			// 		dm_permission: false,
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
			// 		dm_permission: true,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'logging',
			// 		description: 'Lets you set up a message to be sent when someone leaves the server',
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
			// 		name: 'osu-autohost',
			// 		description: 'Hosts an automated lobby ingame',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'password',
			// 				'description': 'Leave empty for a public room',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'condition',
			// 				'description': 'What is the winning condition of the match?',
			// 				'type': 3,
			// 				'choices': [
			// 					{
			// 						'name': 'Score v1',
			// 						'value': '0'
			// 					},
			// 					{
			// 						'name': 'Score v2',
			// 						'value': '3'
			// 					},
			// 					{
			// 						'name': 'Accuracy',
			// 						'value': '1'
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'mods',
			// 				'description': 'The active modpools to be chosen from (Ex: "NM,HR,DT")',
			// 				'type': 3,
			// 			},
			// 			{
			// 				'name': 'nmstarrating',
			// 				'description': 'A custom difficulty for NM maps',
			// 				'type': 10, // 10 is type NUMBER
			// 			},
			// 			{
			// 				'name': 'hdstarrating',
			// 				'description': 'A custom difficulty for HD maps',
			// 				'type': 10, // 10 is type NUMBER
			// 			},
			// 			{
			// 				'name': 'hrstarrating',
			// 				'description': 'A custom difficulty for HR maps',
			// 				'type': 10, // 10 is type NUMBER
			// 			},
			// 			{
			// 				'name': 'dtstarrating',
			// 				'description': 'A custom difficulty for DT maps',
			// 				'type': 10, // 10 is type NUMBER
			// 			},
			// 			{
			// 				'name': 'fmstarrating',
			// 				'description': 'A custom difficulty for FM maps',
			// 				'type': 10, // 10 is type NUMBER
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-beatmap',
			// 		description: 'Sends an info card about the specified beatmap',
			// 		dm_permission: true,
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
			// 		name: 'osu-bingo',
			// 		description: 'Play a game of osu!bingo',
			// 		dm_permission: false,
			// 		options: [
			// 			{
			// 				'name': 'player1team2',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'lowerstarrating',
			// 				'description': 'The lower star rating limit',
			// 				'type': 10, // 10 is type NUMBER
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'higherstarrating',
			// 				'description': 'The higher star rating limit',
			// 				'type': 10, // 10 is type NUMBER
			// 				'required': false,
			// 			},
			// 			{
			// 				'name': 'requirement',
			// 				'description': 'The minimum requirement for the score',
			// 				'type': 3,
			// 				'choices': [
			// 					{
			// 						'name': 'S',
			// 						'value': 'S'
			// 					},
			// 					{
			// 						'name': 'A',
			// 						'value': 'A'
			// 					},
			// 					{
			// 						'name': 'Pass (Default)',
			// 						'value': 'Pass'
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'player1team3',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player1team4',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player1team5',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player2team1',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player2team2',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player2team3',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player2team4',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player2team5',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player3team1',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player3team2',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player3team3',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player3team4',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'player3team5',
			// 				'description': 'A player',
			// 				'type': 6, // 6 is type USER
			// 				'required': false
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-bws',
			// 		description: 'Sends info about the BWS rank of the specified player',
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'match1v1',
			// 				'description': 'Create a 1v1 match',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'opponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of',
			// 						'type': 4, // 4 is type INTEGER
			// 						'choices': [
			// 							{
			// 								'name': 'Best of 13',
			// 								'value': 13
			// 							},
			// 							{
			// 								'name': 'Best of 11',
			// 								'value': 11
			// 							},
			// 							{
			// 								'name': 'Best of 9',
			// 								'value': 9
			// 							},
			// 							{
			// 								'name': 'Best of 7 (Default)',
			// 								'value': 7
			// 							},
			// 							{
			// 								'name': 'Best of 5',
			// 								'value': 5
			// 							},
			// 							{
			// 								'name': 'Best of 3',
			// 								'value': 3
			// 							},
			// 							{
			// 								'name': 'Best of 1',
			// 								'value': 1
			// 							}
			// 						]
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
			// 				'description': 'Create a 2v2 match',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'teammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'firstopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of',
			// 						'type': 4, // 4 is type INTEGER
			// 						'choices': [
			// 							{
			// 								'name': 'Best of 13',
			// 								'value': 13
			// 							},
			// 							{
			// 								'name': 'Best of 11',
			// 								'value': 11
			// 							},
			// 							{
			// 								'name': 'Best of 9',
			// 								'value': 9
			// 							},
			// 							{
			// 								'name': 'Best of 7 (Default)',
			// 								'value': 7
			// 							},
			// 							{
			// 								'name': 'Best of 5',
			// 								'value': 5
			// 							},
			// 							{
			// 								'name': 'Best of 3',
			// 								'value': 3
			// 							},
			// 							{
			// 								'name': 'Best of 1',
			// 								'value': 1
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'ranked',
			// 						'description': 'Should only ranked maps be played?',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'match3v3',
			// 				'description': 'Create a 3v3 match',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'firstteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'firstopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of',
			// 						'type': 4, // 4 is type INTEGER
			// 						'choices': [
			// 							{
			// 								'name': 'Best of 13',
			// 								'value': 13
			// 							},
			// 							{
			// 								'name': 'Best of 11',
			// 								'value': 11
			// 							},
			// 							{
			// 								'name': 'Best of 9',
			// 								'value': 9
			// 							},
			// 							{
			// 								'name': 'Best of 7 (Default)',
			// 								'value': 7
			// 							},
			// 							{
			// 								'name': 'Best of 5',
			// 								'value': 5
			// 							},
			// 							{
			// 								'name': 'Best of 3',
			// 								'value': 3
			// 							},
			// 							{
			// 								'name': 'Best of 1',
			// 								'value': 1
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'ranked',
			// 						'description': 'Should only ranked maps be played?',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'match4v4',
			// 				'description': 'Create a 4v4 match',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'firstteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'firstopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of',
			// 						'type': 4, // 4 is type INTEGER
			// 						'choices': [
			// 							{
			// 								'name': 'Best of 13',
			// 								'value': 13
			// 							},
			// 							{
			// 								'name': 'Best of 11',
			// 								'value': 11
			// 							},
			// 							{
			// 								'name': 'Best of 9',
			// 								'value': 9
			// 							},
			// 							{
			// 								'name': 'Best of 7 (Default)',
			// 								'value': 7
			// 							},
			// 							{
			// 								'name': 'Best of 5',
			// 								'value': 5
			// 							},
			// 							{
			// 								'name': 'Best of 3',
			// 								'value': 3
			// 							},
			// 							{
			// 								'name': 'Best of 1',
			// 								'value': 1
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'ranked',
			// 						'description': 'Should only ranked maps be played?',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'match5v5',
			// 				'description': 'Create a 5v5 match',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'firstteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'firstopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fifthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of',
			// 						'type': 4, // 4 is type INTEGER
			// 						'choices': [
			// 							{
			// 								'name': 'Best of 13',
			// 								'value': 13
			// 							},
			// 							{
			// 								'name': 'Best of 11',
			// 								'value': 11
			// 							},
			// 							{
			// 								'name': 'Best of 9',
			// 								'value': 9
			// 							},
			// 							{
			// 								'name': 'Best of 7 (Default)',
			// 								'value': 7
			// 							},
			// 							{
			// 								'name': 'Best of 5',
			// 								'value': 5
			// 							},
			// 							{
			// 								'name': 'Best of 3',
			// 								'value': 3
			// 							},
			// 							{
			// 								'name': 'Best of 1',
			// 								'value': 1
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'ranked',
			// 						'description': 'Should only ranked maps be played?',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'match6v6',
			// 				'description': 'Create a 6v6 match.',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'firstteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fifthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'firstopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fifthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'sixthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of',
			// 						'type': 4, // 4 is type INTEGER
			// 						'choices': [
			// 							{
			// 								'name': 'Best of 13',
			// 								'value': 13
			// 							},
			// 							{
			// 								'name': 'Best of 11',
			// 								'value': 11
			// 							},
			// 							{
			// 								'name': 'Best of 9',
			// 								'value': 9
			// 							},
			// 							{
			// 								'name': 'Best of 7 (Default)',
			// 								'value': 7
			// 							},
			// 							{
			// 								'name': 'Best of 5',
			// 								'value': 5
			// 							},
			// 							{
			// 								'name': 'Best of 3',
			// 								'value': 3
			// 							},
			// 							{
			// 								'name': 'Best of 1',
			// 								'value': 1
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'ranked',
			// 						'description': 'Should only ranked maps be played?',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'match7v7',
			// 				'description': 'Create a 7v7 match',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'firstteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fifthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'sixthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'firstopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fifthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'sixthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'seventhopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of',
			// 						'type': 4, // 4 is type INTEGER
			// 						'choices': [
			// 							{
			// 								'name': 'Best of 13',
			// 								'value': 13
			// 							},
			// 							{
			// 								'name': 'Best of 11',
			// 								'value': 11
			// 							},
			// 							{
			// 								'name': 'Best of 9',
			// 								'value': 9
			// 							},
			// 							{
			// 								'name': 'Best of 7 (Default)',
			// 								'value': 7
			// 							},
			// 							{
			// 								'name': 'Best of 5',
			// 								'value': 5
			// 							},
			// 							{
			// 								'name': 'Best of 3',
			// 								'value': 3
			// 							},
			// 							{
			// 								'name': 'Best of 1',
			// 								'value': 1
			// 							}
			// 						]
			// 					},
			// 					{
			// 						'name': 'ranked',
			// 						'description': 'Should only ranked maps be played?',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'match8v8',
			// 				'description': 'Create a 8v8 match',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'firstteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fifthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'sixthteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'seventhteammate',
			// 						'description': 'A teammate',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'firstopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'secondopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'thirdopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fourthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'fifthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'sixthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'seventhopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'eigthopponent',
			// 						'description': 'An opponent',
			// 						'type': 6, // 6 is type USER
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'starrating',
			// 						'description': 'The star rating you wanna play on',
			// 						'type': 10, // 10 is type NUMBER
			// 					},
			// 					{
			// 						'name': 'bestof',
			// 						'description': 'The best of',
			// 						'type': 4, // 4 is type INTEGER
			// 						'choices': [
			// 							{
			// 								'name': 'Best of 13',
			// 								'value': 13
			// 							},
			// 							{
			// 								'name': 'Best of 11',
			// 								'value': 11
			// 							},
			// 							{
			// 								'name': 'Best of 9',
			// 								'value': 9
			// 							},
			// 							{
			// 								'name': 'Best of 7 (Default)',
			// 								'value': 7
			// 							},
			// 							{
			// 								'name': 'Best of 5',
			// 								'value': 5
			// 							},
			// 							{
			// 								'name': 'Best of 3',
			// 								'value': 3
			// 							},
			// 							{
			// 								'name': 'Best of 1',
			// 								'value': 1
			// 							}
			// 						]
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
			// 					{
			// 						'name': 'csv',
			// 						'description': 'Should a csv file be attached',
			// 						'type': 5, // 5 is type BOOLEAN
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
			// 		dm_permission: false,
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
			// 		dm_permission: true,
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
			// 		name: 'osu-mapleaderboard',
			// 		description: 'Sends an info card about the leaderboard on the specified beatmap',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'id',
			// 				'description': 'beatmap ID',
			// 				'type': 3,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'server',
			// 				'description': 'The server you want to get the leaderboard from',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'Bancho',
			// 						'value': '--b'
			// 					},
			// 					{
			// 						'name': 'Tournaments',
			// 						'value': '--tournaments'
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'mode',
			// 				'description': 'The gamemode you want to get the leaderboard from',
			// 				'type': 3,
			// 				'required': false,
			// 				'choices': [
			// 					{
			// 						'name': 'osu',
			// 						'value': '--osu'
			// 					},
			// 					{
			// 						'name': 'taiko',
			// 						'value': '--taiko'
			// 					},
			// 					{
			// 						'name': 'catch',
			// 						'value': '--catch'
			// 					},
			// 					{
			// 						'name': 'mania',
			// 						'value': '--mania'
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'amount',
			// 				'description': 'The amount of scores you want to get',
			// 				'type': 4,
			// 			}
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-matchscore',
			// 		description: 'Sends an evaluation of how valuable all the players in the match were',
			// 		dm_permission: true,
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
			// 				'name': 'calculation',
			// 				'description': 'How the matchscore should be calculated',
			// 				'type': 3,
			// 				'choices': [
			// 					{
			// 						'name': 'Mixed (Default)',
			// 						'value': 'mixed'
			// 					},
			// 					{
			// 						'name': 'Sum (favors all-rounders)',
			// 						'value': 'sum'
			// 					},
			// 					{
			// 						'name': 'Average (favors niche players)',
			// 						'value': 'avg'
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'skiplast',
			// 				'description': 'The amount of maps to ignore from the end of the match',
			// 				'type': 4,
			// 			},
			// 			{
			// 				'name': 'ezmultiplier',
			// 				'description': 'The EZ multiplier for the match (Default: 1.7)',
			// 				'type': 4,
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-matchtrack',
			// 		description: 'Tracks the progress of a match',
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 						'name': 'timeframe',
			// 						'description': 'Since when should the scores be taken into account',
			// 						'type': 3,
			// 						'required': false,
			// 						'choices': [
			// 							{
			// 								'name': '1 month',
			// 								'value': '1m'
			// 							},
			// 							{
			// 								'name': '3 months',
			// 								'value': '3m'
			// 							},
			// 							{
			// 								'name': '6 months',
			// 								'value': '6m'
			// 							},
			// 							{
			// 								'name': '1 year (default)',
			// 								'value': '1y'
			// 							},
			// 							{
			// 								'name': '2 years',
			// 								'value': '2y'
			// 							},
			// 							{
			// 								'name': 'All time',
			// 								'value': 'all'
			// 							},
			// 						]
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
			// 						'name': 'timeframe',
			// 						'description': 'Since when should the scores be taken into account',
			// 						'type': 3,
			// 						'required': false,
			// 						'choices': [
			// 							{
			// 								'name': '1 month',
			// 								'value': '1m'
			// 							},
			// 							{
			// 								'name': '3 months',
			// 								'value': '3m'
			// 							},
			// 							{
			// 								'name': '6 months',
			// 								'value': '6m'
			// 							},
			// 							{
			// 								'name': '1 year (default)',
			// 								'value': '1y'
			// 							},
			// 							{
			// 								'name': '2 years',
			// 								'value': '2y'
			// 							},
			// 							{
			// 								'name': 'All time',
			// 								'value': 'all'
			// 							},
			// 						]
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'showgraph',
			// 				'description': 'Show the rank graph',
			// 				'type': 5, // 5 is type BOOLEAN
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
			// 						'description': 'The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'freemodmessage',
			// 						'description': 'An intruction message to be displayed when the map is played freemod',
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
			// 				'name': 'teamqualifiers',
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
			// 						'description': 'The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'freemodmessage',
			// 						'description': 'An intruction message to be displayed when the map is played freemod',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'players',
			// 						'description': 'The username, id or link of the players seperated by a \',\' | Teams seperated by a \';\'',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'teamsize',
			// 						'description': 'The amount of players per team to play at once',
			// 						'type': 4,
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 				]
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
			// 			{
			// 				'name': 'csv',
			// 				'description': 'Should a csv file be attached',
			// 				'type': 5, // 5 is type BOOLEAN
			// 			},
			// 		]
			// 	},
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-mostplayed',
			// 		description: 'Sends an info card about the most played maps',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'user',
			// 				'description': 'Get the stats for a user',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'amount',
			// 						'description': 'The amount of most played maps to be displayed',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'server',
			// 						'description': 'The server from which the results will be displayed',
			// 						'type': 3,
			// 						'required': false,
			// 						'choices': [
			// 							{
			// 								'name': 'Bancho',
			// 								'value': 'b',
			// 							},
			// 							{
			// 								'name': 'Ripple',
			// 								'value': 'r',
			// 							},
			// 							{
			// 								'name': 'Tournaments',
			// 								'value': 'tournaments',
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'username',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'username2',
			// 						'description': 'The username, id or link of the player',
			// 						'type': 3,
			// 						'required': false
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
			// 				]
			// 			},
			// 			{
			// 				'name': 'tourneybeatmaps',
			// 				'description': 'Get the stats for a beatmap',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'amount',
			// 						'description': 'The amount of most played maps to be displayed',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'page',
			// 						'description': 'The page of the results',
			// 						'type': 4,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'dontfiltermm',
			// 						'description': 'Should matchmaking (ETX/o!mm) matches not be filtered out',
			// 						'type': 5, // 5 is type BOOLEAN
			// 						'required': false
			// 					},
			// 					// {
			// 					// 	'name': 'modpool',
			// 					// 	'description': 'The modpool the maps appeared in',
			// 					// 	'type': 3,
			// 					// 	'required': false,
			// 					// 	'choices': [
			// 					// 		{
			// 					// 			'name': 'NM',
			// 					// 			'value': 'NM',
			// 					// 		},
			// 					// 		{
			// 					// 			'name': 'HD',
			// 					// 			'value': 'HD',
			// 					// 		},
			// 					// 		{
			// 					// 			'name': 'HR',
			// 					// 			'value': 'HR',
			// 					// 		},
			// 					// 		{
			// 					// 			'name': 'DT',
			// 					// 			'value': 'DT',
			// 					// 		},
			// 					// 		{
			// 					// 			'name': 'FM',
			// 					// 			'value': 'FM',
			// 					// 		}
			// 					// 	]
			// 					// },
			// 					{
			// 						'name': 'csv',
			// 						'description': 'Should a csv file be attached',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-tournament',
			// 		description: 'Sends a .txt file with all the data for the tournament matches with this acronym',
			// 		dm_permission: true,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
			// 		options: [
			// 			{
			// 				'name': 'enable',
			// 				'description': 'Lets you add a new user to track',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'usernames',
			// 						'description': 'The user(s) to track (separate them with a \',\')',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'topplays',
			// 						'description': 'Which modes should be tracked',
			// 						'type': 3,
			// 						'choices': [
			// 							{
			// 								'name': 'osu! only',
			// 								'value': 'o',
			// 							},
			// 							{
			// 								'name': 'taiko only',
			// 								'value': 't',
			// 							},
			// 							{
			// 								'name': 'catch only',
			// 								'value': 'c',
			// 							},
			// 							{
			// 								'name': 'mania only',
			// 								'value': 'm',
			// 							},
			// 							{
			// 								'name': 'osu! & taiko',
			// 								'value': 'ot',
			// 							},
			// 							{
			// 								'name': 'osu! & catch',
			// 								'value': 'oc',
			// 							},
			// 							{
			// 								'name': 'osu! & mania',
			// 								'value': 'om',
			// 							},
			// 							{
			// 								'name': 'taiko & catch',
			// 								'value': 'tc',
			// 							},
			// 							{
			// 								'name': 'taiko & mania',
			// 								'value': 'tm',
			// 							},
			// 							{
			// 								'name': 'catch & mania',
			// 								'value': 'cm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & catch',
			// 								'value': 'otc',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & mania',
			// 								'value': 'otm',
			// 							},
			// 							{
			// 								'name': 'osu!, catch & mania',
			// 								'value': 'ocm',
			// 							},
			// 							{
			// 								'name': 'taiko, catch & mania',
			// 								'value': 'tcm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko, catch & mania',
			// 								'value': 'otcm',
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'leaderboardplays',
			// 						'description': 'Which modes should be tracked',
			// 						'type': 3,
			// 						'choices': [
			// 							{
			// 								'name': 'osu! only',
			// 								'value': 'o',
			// 							},
			// 							{
			// 								'name': 'taiko only',
			// 								'value': 't',
			// 							},
			// 							{
			// 								'name': 'catch only',
			// 								'value': 'c',
			// 							},
			// 							{
			// 								'name': 'mania only',
			// 								'value': 'm',
			// 							},
			// 							{
			// 								'name': 'osu! & taiko',
			// 								'value': 'ot',
			// 							},
			// 							{
			// 								'name': 'osu! & catch',
			// 								'value': 'oc',
			// 							},
			// 							{
			// 								'name': 'osu! & mania',
			// 								'value': 'om',
			// 							},
			// 							{
			// 								'name': 'taiko & catch',
			// 								'value': 'tc',
			// 							},
			// 							{
			// 								'name': 'taiko & mania',
			// 								'value': 'tm',
			// 							},
			// 							{
			// 								'name': 'catch & mania',
			// 								'value': 'cm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & catch',
			// 								'value': 'otc',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & mania',
			// 								'value': 'otm',
			// 							},
			// 							{
			// 								'name': 'osu!, catch & mania',
			// 								'value': 'ocm',
			// 							},
			// 							{
			// 								'name': 'taiko, catch & mania',
			// 								'value': 'tcm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko, catch & mania',
			// 								'value': 'otcm',
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'ameobea',
			// 						'description': 'Which modes should be updated for ameobea.me/osutrack/',
			// 						'type': 3,
			// 						'choices': [
			// 							{
			// 								'name': 'osu! only',
			// 								'value': 'o',
			// 							},
			// 							{
			// 								'name': 'taiko only',
			// 								'value': 't',
			// 							},
			// 							{
			// 								'name': 'catch only',
			// 								'value': 'c',
			// 							},
			// 							{
			// 								'name': 'mania only',
			// 								'value': 'm',
			// 							},
			// 							{
			// 								'name': 'osu! & taiko',
			// 								'value': 'ot',
			// 							},
			// 							{
			// 								'name': 'osu! & catch',
			// 								'value': 'oc',
			// 							},
			// 							{
			// 								'name': 'osu! & mania',
			// 								'value': 'om',
			// 							},
			// 							{
			// 								'name': 'taiko & catch',
			// 								'value': 'tc',
			// 							},
			// 							{
			// 								'name': 'taiko & mania',
			// 								'value': 'tm',
			// 							},
			// 							{
			// 								'name': 'catch & mania',
			// 								'value': 'cm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & catch',
			// 								'value': 'otc',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko & mania',
			// 								'value': 'otm',
			// 							},
			// 							{
			// 								'name': 'osu!, catch & mania',
			// 								'value': 'ocm',
			// 							},
			// 							{
			// 								'name': 'taiko, catch & mania',
			// 								'value': 'tcm',
			// 							},
			// 							{
			// 								'name': 'osu!, taiko, catch & mania',
			// 								'value': 'otcm',
			// 							},
			// 						]
			// 					},
			// 					{
			// 						'name': 'showameobeaupdate',
			// 						'description': 'Should messages be sent when ameobea is updated',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'medals',
			// 						'description': 'Should achieved medals be tracked',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'duelrating',
			// 						'description': 'Should duel rating changes be tracked',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'matchactivity',
			// 						'description': 'Should matches be tracked',
			// 						'type': 3,
			// 						'choices': [
			// 							{
			// 								'name': 'Notify on matches',
			// 								'value': 'matches',
			// 							},
			// 							{
			// 								'name': 'Notify on matches and auto matchtrack',
			// 								'value': 'matches (auto matchtrack)',
			// 							},
			// 						]
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'disable',
			// 				'description': 'Stop tracking a user',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'usernames',
			// 						'description': 'The user(s) to stop tracking (separate them with a \',\')',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'topplays',
			// 						'description': 'Stop tracking top plays',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'leaderboardplays',
			// 						'description': 'Stop tracking leaderboard plays',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'ameobea',
			// 						'description': 'Stop tracking ameobea updates',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'showameobeaupdates',
			// 						'description': 'Stop tracking showing ameobea updates',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'medals',
			// 						'description': 'Stop tracking medals',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'duelrating',
			// 						'description': 'Stop tracking duel rating changes',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
			// 					{
			// 						'name': 'matchactivity',
			// 						'description': 'Stop tracking match activity',
			// 						'type': 5, // 5 is type BOOLEAN
			// 					},
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

			// let wrappedYears = [];

			// for (let i = 2018; i <= new Date().getFullYear() - 1; i++) {
			// 	wrappedYears.push({
			// 		'name': i.toString(),
			// 		'value': i,
			// 	});
			// }

			// wrappedYears.reverse();

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'osu-wrapped',
			// 		description: 'Sums up the year in osu! for a user',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'username',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'year',
			// 				'description': 'The year to get the wrapped for',
			// 				'type': 4,
			// 				'required': false,
			// 				'choices': wrappedYears
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'pat',
			// 		description: 'Lets you send a gif to pat a user',
			// 		dm_permission: false,
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
			// 		dm_permission: false,
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
			// 		name: 'prune',
			// 		description: 'Delete recent messages',
			// 		dm_permission: false,
			// 		default_member_permissions: manageMessages,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageRoles,
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
			// 		dm_permission: true,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'reminders-delete',
			// 		description: 'Delete a selected reminder',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'id',
			// 				'description': 'Id of the reminder (can be found by using /reminders command)',
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
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'id',
			// 				'description': 'Id of the reminder (can be found by using /reminders command)',
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 		dm_permission: true,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'server-info',
			// 		description: 'Sends an info card about the server'
			// 		dm_permission: false,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'settings',
			// 		description: 'Sends an info card about the settings of the bot for the server'
			// 		dm_permission: false,
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'ship',
			// 		description: 'Lets you check how compatible two users are.',
			// 		dm_permission: true,
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
			// 		dm_permission: false,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageChannels,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
			// 		dm_permission: true,
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
			// 		name: 'tournament-feed',
			// 		description: 'Toggles receiving new tournament notifications',
			// 		dm_permission: true,
			// 		options: [
			// 			{
			// 				'name': 'togglenotifications',
			// 				'description': 'Toggles receiving notifications',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'settings',
			// 				'description': 'Update your settings with this command',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'gamemode',
			// 						'description': 'Set to "All" for all gamemodes use "s/t/c/m" or a combination of them for modes',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'badged',
			// 						'description': 'Should you only get notifications for badged tournaments',
			// 						'type': 5, // 5 is type BOOLEAN
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
			// 	data: {
			// 		name: 'user-profile',
			// 		description: 'Sends an info card about the specified user',
			// 		dm_permission: true,
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
			// 		dm_permission: true,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
			// 		dm_permission: true,
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
			// 		dm_permission: false,
			// 		default_member_permissions: manageGuild,
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
					dm_permission: true,
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
					default_member_permissions: manageRoles,
					dm_permission: false,
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
					default_member_permissions: manageRoles,
					dm_permission: false,
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
					dm_permission: true,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
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
					description: 'Sends an info card about the developers',
					dm_permission: true,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'cuddle',
					description: 'Lets you send a gif to cuddle a user',
					dm_permission: false,
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
					dm_permission: true,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
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
					dm_permission: false,
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
					dm_permission: true,
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
					dm_permission: false,
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
					dm_permission: false,
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
					dm_permission: false,
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
					description: 'Sends a link to add the bot to a server',
					dm_permission: true,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'logging',
					description: 'Lets you set up a message to be sent when someone leaves the server',
					dm_permission: false,
					default_member_permissions: manageGuild,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
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
					name: 'osu-autohost',
					description: 'Hosts an automated lobby ingame',
					dm_permission: true,
					options: [
						{
							'name': 'password',
							'description': 'Leave empty for a public room',
							'type': 3,
						},
						{
							'name': 'condition',
							'description': 'What is the winning condition of the match?',
							'type': 3,
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
						{
							'name': 'mods',
							'description': 'The active modpools to be chosen from (Ex: "NM,HR,DT")',
							'type': 3,
						},
						{
							'name': 'nmstarrating',
							'description': 'A custom difficulty for NM maps',
							'type': 10, // 10 is type NUMBER
						},
						{
							'name': 'hdstarrating',
							'description': 'A custom difficulty for HD maps',
							'type': 10, // 10 is type NUMBER
						},
						{
							'name': 'hrstarrating',
							'description': 'A custom difficulty for HR maps',
							'type': 10, // 10 is type NUMBER
						},
						{
							'name': 'dtstarrating',
							'description': 'A custom difficulty for DT maps',
							'type': 10, // 10 is type NUMBER
						},
						{
							'name': 'fmstarrating',
							'description': 'A custom difficulty for FM maps',
							'type': 10, // 10 is type NUMBER
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-beatmap',
					description: 'Sends an info card about the specified beatmap',
					dm_permission: true,
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
					name: 'osu-bingo',
					description: 'Play a game of osu!bingo',
					dm_permission: false,
					options: [
						{
							'name': 'player1team2',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': true
						},
						{
							'name': 'lowerstarrating',
							'description': 'The lower star rating limit',
							'type': 10, // 10 is type NUMBER
							'required': false,
						},
						{
							'name': 'higherstarrating',
							'description': 'The higher star rating limit',
							'type': 10, // 10 is type NUMBER
							'required': false,
						},
						{
							'name': 'requirement',
							'description': 'The minimum requirement for the score',
							'type': 3,
							'choices': [
								{
									'name': 'S',
									'value': 'S'
								},
								{
									'name': 'A',
									'value': 'A'
								},
								{
									'name': 'Pass (Default)',
									'value': 'Pass'
								},
							]
						},
						{
							'name': 'player1team3',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player1team4',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player1team5',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player2team1',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player2team2',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player2team3',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player2team4',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player2team5',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player3team1',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player3team2',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player3team3',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player3team4',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
						{
							'name': 'player3team5',
							'description': 'A player',
							'type': 6, // 6 is type USER
							'required': false
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-bws',
					description: 'Sends info about the BWS rank of the specified player',
					dm_permission: true,
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
					dm_permission: true,
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
					dm_permission: true,
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
					dm_permission: true,
					options: [
						{
							'name': 'match1v1',
							'description': 'Create a 1v1 match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'opponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
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
							'description': 'Create a 2v2 match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'teammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'firstopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'match3v3',
							'description': 'Create a 3v3 match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'firstopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'match4v4',
							'description': 'Create a 4v4 match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'firstopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'match5v5',
							'description': 'Create a 5v5 match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'firstopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fifthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'match6v6',
							'description': 'Create a 6v6 match.',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fifthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'firstopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fifthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'sixthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'match7v7',
							'description': 'Create a 7v7 match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fifthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'sixthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'firstopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fifthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'sixthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'seventhopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'match8v8',
							'description': 'Create a 8v8 match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fifthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'sixthteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'seventhteammate',
									'description': 'A teammate',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'firstopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fifthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'sixthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'seventhopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'eigthopponent',
									'description': 'An opponent',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating you wanna play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
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
								{
									'name': 'csv',
									'description': 'Should a csv file be attached',
									'type': 5, // 5 is type BOOLEAN
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
					dm_permission: false,
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
					dm_permission: true,
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
					name: 'osu-mapleaderboard',
					description: 'Sends an info card about the leaderboard on the specified beatmap',
					dm_permission: true,
					options: [
						{
							'name': 'id',
							'description': 'beatmap ID',
							'type': 3,
							'required': true
						},
						{
							'name': 'server',
							'description': 'The server you want to get the leaderboard from',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'Bancho',
									'value': 'bancho'
								},
								{
									'name': 'Tournaments',
									'value': 'tournaments'
								},
							]
						},
						{
							'name': 'mode',
							'description': 'The gamemode you want to get the leaderboard from',
							'type': 3,
							'required': false,
							'choices': [
								{
									'name': 'osu',
									'value': '--osu'
								},
								{
									'name': 'taiko',
									'value': '--taiko'
								},
								{
									'name': 'catch',
									'value': '--catch'
								},
								{
									'name': 'mania',
									'value': '--mania'
								},
							]
						},
						{
							'name': 'amount',
							'description': 'The amount of scores you want to get',
							'type': 4,
						}
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-matchscore',
					description: 'Sends an evaluation of how valuable all the players in the match were',
					dm_permission: true,
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
							'name': 'calculation',
							'description': 'How the matchscore should be calculated',
							'type': 3,
							'choices': [
								{
									'name': 'Mixed (Default)',
									'value': 'mixed'
								},
								{
									'name': 'Sum (favors all-rounders)',
									'value': 'sum'
								},
								{
									'name': 'Average (favors niche players)',
									'value': 'avg'
								},
							]
						},
						{
							'name': 'skiplast',
							'description': 'The amount of maps to ignore from the end of the match',
							'type': 4,
						},
						{
							'name': 'ezmultiplier',
							'description': 'The EZ multiplier for the match (Default: 1.7)',
							'type': 4,
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-matchtrack',
					description: 'Tracks the progress of a match',
					dm_permission: true,
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
					dm_permission: true,
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
									'name': 'timeframe',
									'description': 'Since when should the scores be taken into account',
									'type': 3,
									'required': false,
									'choices': [
										{
											'name': '1 month',
											'value': '1m'
										},
										{
											'name': '3 months',
											'value': '3m'
										},
										{
											'name': '6 months',
											'value': '6m'
										},
										{
											'name': '1 year (default)',
											'value': '1y'
										},
										{
											'name': '2 years',
											'value': '2y'
										},
										{
											'name': 'All time',
											'value': 'all'
										},
									]
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
									'name': 'timeframe',
									'description': 'Since when should the scores be taken into account',
									'type': 3,
									'required': false,
									'choices': [
										{
											'name': '1 month',
											'value': '1m'
										},
										{
											'name': '3 months',
											'value': '3m'
										},
										{
											'name': '6 months',
											'value': '6m'
										},
										{
											'name': '1 year (default)',
											'value': '1y'
										},
										{
											'name': '2 years',
											'value': '2y'
										},
										{
											'name': 'All time',
											'value': 'all'
										},
									]
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
					dm_permission: true,
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
					dm_permission: true,
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'showgraph',
							'description': 'Show the rank graph',
							'type': 5, // 5 is type BOOLEAN
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
					dm_permission: true,
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
					dm_permission: true,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
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
									'description': 'The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316',
									'type': 3,
									'required': true
								},
								{
									'name': 'freemodmessage',
									'description': 'An intruction message to be displayed when the map is played freemod',
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
							'name': 'teamqualifiers',
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
									'description': 'The mappool in the following format: NM234826,HD123141,HR123172,FMDT2342316',
									'type': 3,
									'required': true
								},
								{
									'name': 'freemodmessage',
									'description': 'An intruction message to be displayed when the map is played freemod',
									'type': 3,
									'required': true
								},
								{
									'name': 'players',
									'description': 'The username, id or link of the players seperated by a \',\' | Teams seperated by a \';\'',
									'type': 3,
									'required': true
								},
								{
									'name': 'teamsize',
									'description': 'The amount of players per team to play at once',
									'type': 4,
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
						// {
						// 	'name': '1v1',
						// 	'description': 'Lets you schedule a match which is being reffed by the bot',
						// 	'type': 1, // 1 is type SUB_COMMAND
						// 	'options': [
						// 		{
						// 			'name': 'date',
						// 			'description': 'The date of the month in UTC (i.e. 29)',
						// 			'type': 4,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'month',
						// 			'description': 'The month in UTC (i.e. 11)',
						// 			'type': 4,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'year',
						// 			'description': 'The year in UTC (i.e. 2021)',
						// 			'type': 4,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'hour',
						// 			'description': 'The hour in UTC (i.e. 18)',
						// 			'type': 4,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'minute',
						// 			'description': 'The minute in UTC (i.e. 0)',
						// 			'type': 4,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'channel',
						// 			'description': 'The channel in which the players should be notified.',
						// 			'type': 7,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'matchname',
						// 			'description': 'The name that the match should have. (i.e. "ECS: (Qualifiers) vs (Lobby 8)")',
						// 			'type': 3,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'mappool',
						// 			'description': 'The mappool in the following format: NM234826,HD123141,HR123172. Available mods: NM,HD,HR,DT,FM,TB',
						// 			'type': 3,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'bestof',
						// 			'description': 'The best of',
						// 			'type': 4,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'bans',
						// 			'description': 'The amount of bans for each player.',
						// 			'type': 4,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'players',
						// 			'description': 'The username, id or link of the players seperated by a \',\'',
						// 			'type': 3,
						// 			'required': true
						// 		},
						// 		{
						// 			'name': 'pickbanorder',
						// 			'description': 'What is the pick and ban order?',
						// 			'type': 3,
						// 			'required': true,
						// 			'choices': [
						// 				{
						// 					'name': 'Determined: Roll Winner Bans Second and Picks First (Bans: ABAB)',
						// 					'value': '1'
						// 				},
						// 				{
						// 					'name': 'Determined: Roll Winner Bans Second and Picks First (Bans: ABBA)',
						// 					'value': '2'
						// 				},
						// 				{
						// 					'name': 'Choice: Roll Winner chooses Ban Second and Pick First or opposite (Bans: ABAB)',
						// 					'value': '3'
						// 				},
						// 				{
						// 					'name': 'Choice: Roll Winner chooses Ban Second and Pick First or opposite (Bans: ABBA)',
						// 					'value': '4'
						// 				},
						// 				{
						// 					'name': 'Choice: Roll Winner chooses Ban First and Pick First or opposite (Bans: ABAB)',
						// 					'value': '5'
						// 				},
						// 				{
						// 					'name': 'Choice: Roll Winner chooses Ban First and Pick First or opposite (Bans: ABBA)',
						// 					'value': '6'
						// 				},
						// 			]
						// 		},
						// 		{
						// 			'name': 'usenofail',
						// 			'description': 'Should nofail be applied to all maps?',
						// 			'type': 5,
						// 			'required': true,
						// 		},
						// 		{
						// 			'name': 'score',
						// 			'description': 'What is the winning condition of the match?',
						// 			'type': 3,
						// 			'required': true,
						// 			'choices': [
						// 				{
						// 					'name': 'Score v1',
						// 					'value': '0'
						// 				},
						// 				{
						// 					'name': 'Score v2',
						// 					'value': '3'
						// 				},
						// 				{
						// 					'name': 'Accuracy',
						// 					'value': '1'
						// 				}
						// 			]
						// 		},
						// 	]
						// },
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
					dm_permission: true,
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
					dm_permission: true,
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
					dm_permission: true,
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
					dm_permission: true,
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
					dm_permission: true,
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
								},
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
						{
							'name': 'csv',
							'description': 'Should a csv file be attached',
							'type': 5, // 5 is type BOOLEAN
						},
					]
				},
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-mostplayed',
					description: 'Sends an info card about the most played maps',
					dm_permission: true,
					options: [
						{
							'name': 'user',
							'description': 'Get the stats for a user',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
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
						{
							'name': 'tourneybeatmaps',
							'description': 'Get the stats for a beatmap',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'amount',
									'description': 'The amount of most played maps to be displayed',
									'type': 4,
									'required': false
								},
								{
									'name': 'page',
									'description': 'The page of the results',
									'type': 4,
									'required': false
								},
								{
									'name': 'dontfiltermm',
									'description': 'Should matchmaking (ETX/o!mm) matches not be filtered out',
									'type': 5, // 5 is type BOOLEAN
									'required': false
								},
								// {
								// 	'name': 'modpool',
								// 	'description': 'The modpool the maps appeared in',
								// 	'type': 3,
								// 	'required': false,
								// 	'choices': [
								// 		{
								// 			'name': 'NM',
								// 			'value': 'NM',
								// 		},
								// 		{
								// 			'name': 'HD',
								// 			'value': 'HD',
								// 		},
								// 		{
								// 			'name': 'HR',
								// 			'value': 'HR',
								// 		},
								// 		{
								// 			'name': 'DT',
								// 			'value': 'DT',
								// 		},
								// 		{
								// 			'name': 'FM',
								// 			'value': 'FM',
								// 		}
								// 	]
								// },
								{
									'name': 'csv',
									'description': 'Should a csv file be attached',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-tournament',
					description: 'Sends a .txt file with all the data for the tournament matches with this acronym',
					dm_permission: true,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
					options: [
						{
							'name': 'enable',
							'description': 'Lets you add a new user to track',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'usernames',
									'description': 'The user(s) to track (separate them with a \',\')',
									'type': 3,
									'required': true
								},
								{
									'name': 'topplays',
									'description': 'Which modes should be tracked',
									'type': 3,
									'choices': [
										{
											'name': 'osu! only',
											'value': 'o',
										},
										{
											'name': 'taiko only',
											'value': 't',
										},
										{
											'name': 'catch only',
											'value': 'c',
										},
										{
											'name': 'mania only',
											'value': 'm',
										},
										{
											'name': 'osu! & taiko',
											'value': 'ot',
										},
										{
											'name': 'osu! & catch',
											'value': 'oc',
										},
										{
											'name': 'osu! & mania',
											'value': 'om',
										},
										{
											'name': 'taiko & catch',
											'value': 'tc',
										},
										{
											'name': 'taiko & mania',
											'value': 'tm',
										},
										{
											'name': 'catch & mania',
											'value': 'cm',
										},
										{
											'name': 'osu!, taiko & catch',
											'value': 'otc',
										},
										{
											'name': 'osu!, taiko & mania',
											'value': 'otm',
										},
										{
											'name': 'osu!, catch & mania',
											'value': 'ocm',
										},
										{
											'name': 'taiko, catch & mania',
											'value': 'tcm',
										},
										{
											'name': 'osu!, taiko, catch & mania',
											'value': 'otcm',
										},
									]
								},
								{
									'name': 'leaderboardplays',
									'description': 'Which modes should be tracked',
									'type': 3,
									'choices': [
										{
											'name': 'osu! only',
											'value': 'o',
										},
										{
											'name': 'taiko only',
											'value': 't',
										},
										{
											'name': 'catch only',
											'value': 'c',
										},
										{
											'name': 'mania only',
											'value': 'm',
										},
										{
											'name': 'osu! & taiko',
											'value': 'ot',
										},
										{
											'name': 'osu! & catch',
											'value': 'oc',
										},
										{
											'name': 'osu! & mania',
											'value': 'om',
										},
										{
											'name': 'taiko & catch',
											'value': 'tc',
										},
										{
											'name': 'taiko & mania',
											'value': 'tm',
										},
										{
											'name': 'catch & mania',
											'value': 'cm',
										},
										{
											'name': 'osu!, taiko & catch',
											'value': 'otc',
										},
										{
											'name': 'osu!, taiko & mania',
											'value': 'otm',
										},
										{
											'name': 'osu!, catch & mania',
											'value': 'ocm',
										},
										{
											'name': 'taiko, catch & mania',
											'value': 'tcm',
										},
										{
											'name': 'osu!, taiko, catch & mania',
											'value': 'otcm',
										},
									]
								},
								{
									'name': 'ameobea',
									'description': 'Which modes should be updated for ameobea.me/osutrack/',
									'type': 3,
									'choices': [
										{
											'name': 'osu! only',
											'value': 'o',
										},
										{
											'name': 'taiko only',
											'value': 't',
										},
										{
											'name': 'catch only',
											'value': 'c',
										},
										{
											'name': 'mania only',
											'value': 'm',
										},
										{
											'name': 'osu! & taiko',
											'value': 'ot',
										},
										{
											'name': 'osu! & catch',
											'value': 'oc',
										},
										{
											'name': 'osu! & mania',
											'value': 'om',
										},
										{
											'name': 'taiko & catch',
											'value': 'tc',
										},
										{
											'name': 'taiko & mania',
											'value': 'tm',
										},
										{
											'name': 'catch & mania',
											'value': 'cm',
										},
										{
											'name': 'osu!, taiko & catch',
											'value': 'otc',
										},
										{
											'name': 'osu!, taiko & mania',
											'value': 'otm',
										},
										{
											'name': 'osu!, catch & mania',
											'value': 'ocm',
										},
										{
											'name': 'taiko, catch & mania',
											'value': 'tcm',
										},
										{
											'name': 'osu!, taiko, catch & mania',
											'value': 'otcm',
										},
									]
								},
								{
									'name': 'showameobeaupdate',
									'description': 'Should messages be sent when ameobea is updated',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'medals',
									'description': 'Should achieved medals be tracked',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'duelrating',
									'description': 'Should duel rating changes be tracked',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'matchactivity',
									'description': 'Should matches be tracked',
									'type': 3,
									'choices': [
										{
											'name': 'Notify on matches',
											'value': 'matches',
										},
										{
											'name': 'Notify on matches and auto matchtrack',
											'value': 'matches (auto matchtrack)',
										},
									]
								},
							]
						},
						{
							'name': 'disable',
							'description': 'Stop tracking a user',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'usernames',
									'description': 'The user(s) to stop tracking (separate them with a \',\')',
									'type': 3,
									'required': true
								},
								{
									'name': 'topplays',
									'description': 'Stop tracking top plays',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'leaderboardplays',
									'description': 'Stop tracking leaderboard plays',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'ameobea',
									'description': 'Stop tracking ameobea updates',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'showameobeaupdates',
									'description': 'Stop tracking showing ameobea updates',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'medals',
									'description': 'Stop tracking medals',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'duelrating',
									'description': 'Stop tracking duel rating changes',
									'type': 5, // 5 is type BOOLEAN
								},
								{
									'name': 'matchactivity',
									'description': 'Stop tracking match activity',
									'type': 5, // 5 is type BOOLEAN
								},
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

			let wrappedYears = [];

			for (let i = 2018; i <= new Date().getFullYear() - 1; i++) {
				wrappedYears.push({
					'name': i.toString(),
					'value': i,
				});
			}

			wrappedYears.reverse();

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'osu-wrapped',
					description: 'Sums up the year in osu! for a user',
					dm_permission: true,
					options: [
						{
							'name': 'username',
							'description': 'The username, id or link of the player',
							'type': 3,
							'required': false
						},
						{
							'name': 'year',
							'description': 'The year to get the wrapped for',
							'type': 4,
							'required': false,
							'choices': wrappedYears
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'pat',
					description: 'Lets you send a gif to pat a user',
					dm_permission: false,
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
					dm_permission: false,
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
					name: 'prune',
					description: 'Delete recent messages',
					dm_permission: false,
					default_member_permissions: manageMessages,
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
					dm_permission: false,
					default_member_permissions: manageRoles,
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
					dm_permission: true,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'reminders-delete',
					description: 'Delete a selected reminder',
					dm_permission: true,
					options: [
						{
							'name': 'id',
							'description': 'Id of the reminder (can be found by using /reminders command)',
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
					dm_permission: true,
					options: [
						{
							'name': 'id',
							'description': 'Id of the reminder (can be found by using /reminders command)',
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
					dm_permission: true,
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
					dm_permission: true,
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
					description: 'Start a round of rollgame',
					dm_permission: true,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'server-info',
					description: 'Sends an info card about the server',
					dm_permission: false,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'settings',
					description: 'Sends an info card about the settings of the bot for the server',
					dm_permission: false,
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'ship',
					description: 'Lets you check how compatible two users are.',
					dm_permission: true,
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
					dm_permission: false,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
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
					dm_permission: false,
					default_member_permissions: manageChannels,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
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
					dm_permission: true,
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
					name: 'tournament-feed',
					description: 'Toggles receiving new tournament notifications',
					dm_permission: true,
					options: [
						{
							'name': 'togglenotifications',
							'description': 'Toggles receiving notifications',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'settings',
							'description': 'Update your settings with this command',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'gamemode',
									'description': 'Set to "All" for all gamemodes use "s/t/c/m" or a combination of them for modes',
									'type': 3,
									'required': false
								},
								{
									'name': 'badged',
									'description': 'Should you only get notifications for badged tournaments',
									'type': 5, // 5 is type BOOLEAN
									'required': false
								},
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).commands.post({
				data: {
					name: 'user-profile',
					description: 'Sends an info card about the specified user',
					dm_permission: true,
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
					dm_permission: true,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
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
					dm_permission: true,
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
					dm_permission: false,
					default_member_permissions: manageGuild,
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
				// eslint-disable-next-line no-console
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
				// eslint-disable-next-line no-console
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

			// eslint-disable-next-line no-console
			console.log(mapScoreAmount);
		} else if (args[0] === 'updateServerDuelRatings') {
			let sentMessage = await msg.reply('Processing...');
			await msg.guild.members.fetch()
				.then(async (guildMembers) => {

					const members = [];
					guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));

					for (let i = 0; i < members.length; i++) {
						if (i % 25 === 0) {
							sentMessage.edit(`${i} out of ${members.length} done`);
						}
						logDatabaseQueries(4, 'commands/admin.js DBDiscordUsers');
						const discordUser = await DBDiscordUsers.findOne({
							where: {
								userId: members[i].id
							},
						});

						if (discordUser) {
							await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: msg.client });
						}
					}

					sentMessage.delete();
				})
				.catch(error => {
					console.error(error);
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
					console.error(error);
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
		} else if (args[0] === 'tournamentFeedCommand') {
			await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
				data: {
					name: 'tournamentfeed-admin',
					description: 'Allows for managing the tournament feed',
					default_member_permissions: '0',
					options: [
						{
							'name': 'update',
							'description': 'Allows for updating the tournament feed',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'id',
									'description': 'The forum post id',
									'type': 3,
									'required': true
								},
								{
									'name': 'format',
									'description': 'The format of the tournament',
									'type': 3,
									'required': false
								},
								{
									'name': 'rankrange',
									'description': 'The rankrange of the tournament',
									'type': 3,
									'required': false
								},
								{
									'name': 'gamemode',
									'description': 'The gamemode of the tournament',
									'type': 3,
									'required': false
								},
								{
									'name': 'notes',
									'description': 'Additional information about the tournament',
									'type': 3,
									'required': false
								},
								{
									'name': 'bws',
									'description': 'Is the rank range bws',
									'type': 5, // 5 is type BOOLEAN
									'required': false
								},
								{
									'name': 'badged',
									'description': 'Is the tourney going for badged',
									'type': 5, // 5 is type BOOLEAN
									'required': false
								},
								{
									'name': 'outdated',
									'description': 'Is the tournament post outdated',
									'type': 5, // 5 is type BOOLEAN
									'required': false
								},
								{
									'name': 'notournament',
									'description': 'Is the post not a tournament',
									'type': 5, // 5 is type BOOLEAN
									'required': false
								},
							]
						},
						{
							'name': 'ping',
							'description': 'Shares a new tournament',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'id',
									'description': 'The forum post id',
									'type': 3,
									'required': true
								}
							]
						},
						{
							'name': 'delete',
							'description': 'Deletes a saved tournament record',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'id',
									'description': 'The forum post id',
									'type': 3,
									'required': true
								}
							]
						},
						{
							'name': 'list',
							'description': 'Show open forum posts',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				},
			});
		} else if (args[0] === 'clearForumPosts') {
			let forumPosts = await DBOsuForumPosts.findAll();
			for (let i = 0; i < forumPosts.length; i++) {
				await forumPosts[i].destroy();
			}
		} else if (args[0] === 'runningMatches') {
			let importMatchTasks = await DBProcessQueue.findAll({
				where: {
					task: 'importMatch',
				}
			});

			for (let i = 0; i < importMatchTasks.length; i++) {
				await msg.reply(`https://osu.ppy.sh/mp/${importMatchTasks[i].additions}`);
			}
		} else if (args[0] === 'deleteDiscordUser') {
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: args[1]
				}
			});

			if (discordUser) {
				await discordUser.destroy();
				return await msg.reply('Deleted discord user');
			}

			return await msg.reply('Could not find discord user');
		} else if (args[0] === 'resetSavedPPValues') {
			// Reset saved pp values in DBOsuMultiScores using an update statement
			await msg.reply('Resetting...');
			let count = await DBOsuMultiScores.update({
				pp: null,
			}, {
				where: {
					pp: {
						[Op.ne]: null
					}
				}
			});

			return msg.reply(`Reset ${humanReadable(count)} scores' pp values`);
		} else if (args[0] === 'duelAdminCommand') {
			await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
				data: {
					name: 'osu-duel-admin',
					description: 'Duel admin commands',
					default_member_permissions: '0',
					options: [
						{
							'name': 'createduel1v1',
							'description': 'Creates a duel match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstplayer',
									'description': 'The first player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondplayer',
									'description': 'The second player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating to play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
						{
							'name': 'createduel2v2',
							'description': 'Creates a duel match',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'firstplayer',
									'description': 'The first player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'secondplayer',
									'description': 'The second player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'thirdplayer',
									'description': 'The third player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'fourthplayer',
									'description': 'The fourth player',
									'type': 6, // 6 is type USER
									'required': true
								},
								{
									'name': 'starrating',
									'description': 'The star rating to play on',
									'type': 10, // 10 is type NUMBER
								},
								{
									'name': 'bestof',
									'description': 'The best of',
									'type': 4, // 4 is type INTEGER
									'choices': [
										{
											'name': 'Best of 13',
											'value': 13
										},
										{
											'name': 'Best of 11',
											'value': 11
										},
										{
											'name': 'Best of 9',
											'value': 9
										},
										{
											'name': 'Best of 7 (Default)',
											'value': 7
										},
										{
											'name': 'Best of 5',
											'value': 5
										},
										{
											'name': 'Best of 3',
											'value': 3
										},
										{
											'name': 'Best of 1',
											'value': 1
										}
									]
								},
								{
									'name': 'ranked',
									'description': 'Should only ranked maps be played?',
									'type': 5, // 5 is type BOOLEAN
								},
							]
						},
					]
				},
			});
		} else if (args[0] === 'averageRating') {
			let discordUsers = await DBDiscordUsers.findAll({
				where: {
					osuUserId: {
						[Op.gt]: 0
					},
					osuPP: {
						[Op.gt]: 0
					},
					osuDuelStarRating: {
						[Op.gt]: 0
					},
					osuDuelProvisional: {
						[Op.not]: true,
					}
				}
			});

			let totalRating = 0;
			let totalPlayers = 0;

			for (let i = 0; i < discordUsers.length; i++) {
				let discordUser = discordUsers[i];

				if (discordUser.osuRank && parseInt(discordUser.osuRank) >= parseInt(args[1]) && parseInt(discordUser.osuRank) <= parseInt(args[2])) {
					totalRating += parseFloat(discordUser.osuDuelStarRating);
					totalPlayers++;
				}
			}

			let averageRating = totalRating / totalPlayers;

			return msg.reply(`The average rating for players ranked ${args[1]} to ${args[2]} is ${averageRating.toFixed(2)}`);
		} else if (args[0] === 'serverTourneyTops') {
			if (args.length < 3) {
				return msg.reply('Correct usage: `e!admin serverTourneyTops amountPerPlayer <onlyRanked: true/false> [@Elitebotix]`');
			}

			let amountPerPlayer = parseInt(args[1]);
			let onlyRanked = false;

			if (args[2] === 'true') {
				onlyRanked = true;
			}

			let processingMessage = await msg.reply('Processing...');

			let osuAccounts = [];
			await msg.guild.members.fetch()
				.then(async (guildMembers) => {
					const members = [];
					guildMembers.each(member => members.push(member.id));

					logDatabaseQueries(4, 'commands/admin.js DBDiscordUsers serverTourneyTops');
					const discordUsers = await DBDiscordUsers.findAll({
						where: {
							userId: {
								[Op.in]: members
							},
							osuUserId: {
								[Op.not]: null,
							}
						},
					});

					for (let i = 0; i < discordUsers.length; i++) {
						osuAccounts.push({
							userId: discordUsers[i].userId,
							osuUserId: discordUsers[i].osuUserId,
							osuName: discordUsers[i].osuName,
						});
					}
				})
				.catch(err => {
					console.error(err);
				});

			let tourneyTops = [];

			for (let i = 0; i < osuAccounts.length; i++) {
				await processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Account ${i + 1}/${osuAccounts.length})...`);

				let lastUpdate = new Date();
				//Get all scores from tournaments
				logDatabaseQueries(4, 'commands/osu-top.js DBOsuMultiScores');
				let multiScores = await DBOsuMultiScores.findAll({
					where: {
						osuUserId: osuAccounts[i].osuUserId,
						mode: 'Standard',
						tourneyMatch: true,
						score: {
							[Op.gte]: 10000
						}
					}
				});

				if (new Date() - lastUpdate > 15000) {
					processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Found ${multiScores.length} scores) (Account ${i + 1}/${osuAccounts.length})...`);
					lastUpdate = new Date();
				}

				for (let j = 0; j < multiScores.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Removing irrelevant scores from ${multiScores.length} found scores) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}

					if (parseInt(multiScores[j].score) <= 10000 && getMods(parseInt(multiScores[j].gameRawMods) + parseInt(multiScores[j].rawMods)).includes('RX')) {
						multiScores.splice(j, 1);
						j--;
					}
				}

				let multisToUpdate = [];
				for (let j = 0; j < multiScores.length; j++) {
					if (!multiScores[j].maxCombo && !multisToUpdate.includes(multiScores[j].matchId)) {
						multisToUpdate.push(multiScores[j].matchId);
					}
				}

				for (let j = 0; j < multisToUpdate.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Updating legacy matches ${j + 1}/${multisToUpdate.length}) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					await osuApi.getMatch({ mp: multisToUpdate[j] })
						.then(async (match) => {
							await saveOsuMultiScores(match);
						})
						.catch(() => {
							//Nothing
						});
					await pause(5000);
				}

				if (multisToUpdate.length) {
					//Get all scores from tournaments
					logDatabaseQueries(4, 'commands/osu-top.js DBOsuMultiScores2');
					multiScores = await DBOsuMultiScores.findAll({
						where: {
							osuUserId: osuAccounts[i].osuUserId,
							mode: 'Standard',
							tourneyMatch: true,
							score: {
								[Op.gte]: 10000
							}
						}
					});
				}

				if (new Date() - lastUpdate > 15000) {
					processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Found ${multiScores.length} scores after legacy match update) (Account ${i + 1}/${osuAccounts.length})...`);
					lastUpdate = new Date();
				}

				for (let j = 0; j < multiScores.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Removing irrelevant data from ${multiScores.length} found scores after legacy match update) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}
					if (parseInt(multiScores[j].score) <= 10000 || multiScores[j].teamType === 'Tag Team vs' || multiScores[j].teamType === 'Tag Co-op') {
						multiScores.splice(j, 1);
						j--;
					}
				}

				//Translate the scores to bancho scores
				for (let j = 0; j < multiScores.length; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Score ${j + 1}/${multiScores.length}) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}
					if (parseInt(multiScores[j].gameRawMods) % 2 === 1) {
						multiScores[j].gameRawMods = parseInt(multiScores[j].gameRawMods) - 1;
					}
					if (parseInt(multiScores[j].rawMods) % 2 === 1) {
						multiScores[j].rawMods = parseInt(multiScores[j].rawMods) - 1;
					}
					multiScores[j] = await multiToBanchoScore(multiScores[j]);

					if (!multiScores[j].pp || parseFloat(multiScores[j].pp) > 2000 || !parseFloat(multiScores[j].pp)) {
						multiScores.splice(j, 1);
						j--;
						continue;
					}
				}

				//Sort scores by pp
				quicksortPP(multiScores);

				//Remove duplicates by beatmapId
				for (let j = 0; j < multiScores.length; j++) {
					for (let k = j + 1; k < multiScores.length; k++) {
						if (multiScores[j].beatmapId === multiScores[k].beatmapId) {
							multiScores.splice(k, 1);
							k--;
						}
					}
				}

				//Feed the scores into the array
				let scoreCount = 0;
				for (let j = 0; j < multiScores.length && scoreCount < amountPerPlayer; j++) {
					if (new Date() - lastUpdate > 15000) {
						processingMessage.edit(`Processing ${osuAccounts[i].osuName} (Adding score ${j + 1}/${amountPerPlayer} to the output) (Account ${i + 1}/${osuAccounts.length})...`);
						lastUpdate = new Date();
					}
					multiScores[j].beatmap = await getOsuBeatmap({ beatmapId: multiScores[j].beatmapId });
					if (onlyRanked) {
						if (!multiScores[j].beatmap || multiScores[j].beatmap && multiScores[j].beatmap.approvalStatus !== 'Approved' && multiScores[j].beatmap.approvalStatus !== 'Ranked') {
							continue;
						}
					}
					if (multiScores[j].pp) {
						tourneyTops.push(multiScores[j]);
						scoreCount++;
					}
				}
			}

			let exportScores = [];

			for (let i = 0; i < tourneyTops.length; i++) {
				if (tourneyTops[i].beatmap) {
					exportScores.push({
						osuUserId: tourneyTops[i].user.id,
						pp: tourneyTops[i].pp,
						approvalStatus: tourneyTops[i].beatmap.approvalStatus,
						beatmapId: tourneyTops[i].beatmapId,
						score: tourneyTops[i].score,
						raw_date: tourneyTops[i].raw_date,
						rank: tourneyTops[i].rank,
						raw_mods: tourneyTops[i].raw_mods,
						title: tourneyTops[i].beatmap.title,
						artist: tourneyTops[i].beatmap.artist,
						difficulty: tourneyTops[i].beatmap.difficulty,
						mode: tourneyTops[i].beatmap.mode,
					});
				} else {
					exportScores.push({
						osuUserId: tourneyTops[i].user.id,
						pp: tourneyTops[i].pp,
						approvalStatus: 'Deleted',
						beatmapId: tourneyTops[i].beatmapId,
						score: tourneyTops[i].score,
						raw_date: tourneyTops[i].raw_date,
						rank: tourneyTops[i].rank,
						raw_mods: tourneyTops[i].raw_mods,
						title: 'Unavailable',
						artist: 'Unavailable',
						difficulty: 'Unavailable',
						mode: 'Unavailable',
					});
				}
			}

			processingMessage.delete();

			let data = [];
			for (let i = 0; i < exportScores.length; i++) {
				data.push(exportScores[i]);

				if (i % 10000 === 0 && i > 0 || exportScores.length - 1 === i) {
					let csv = new ObjectsToCsv(data);
					csv = await csv.toString();
					// eslint-disable-next-line no-undef
					const buffer = Buffer.from(csv);
					//Create as an attachment
					const attachment = new Discord.MessageAttachment(buffer, `${msg.guild.name}-tournament-topplays.csv`);

					await msg.reply({ content: `${msg.guild.name} - Tournament Top Plays`, files: [attachment] });
					data = [];
				}
			}
		} else if (args[0] === 'restart') {

			let guildSizes = await msg.client.shard.fetchClientValues('guilds.cache.size');
			let startDates = await msg.client.shard.fetchClientValues('startDate');
			let duels = await msg.client.shard.fetchClientValues('duels');
			let other = await msg.client.shard.fetchClientValues('otherMatches');
			let matchtracks = await msg.client.shard.fetchClientValues('matchTracks');
			let bingoMatches = await msg.client.shard.fetchClientValues('bingoMatches');
			let update = await msg.client.shard.fetchClientValues('update');

			// eslint-disable-next-line no-console
			console.log('duels', duels);
			// eslint-disable-next-line no-console
			console.log('other', other);
			// eslint-disable-next-line no-console
			console.log('matchtracks', matchtracks);

			let output = `Options: \`all\`, \`free\`, \`shardId\`, \`update\`, \`free&update\`\n\`\`\`Cur.: ${msg.client.shardId} | Started          | Guilds | Duels | Other | Matchtrack | Bingo | Update\n`;
			for (let i = 0; i < guildSizes.length; i++) {
				output = output + '--------|------------------|--------|-------|-------|------------|-------|--------\n';
				let startDate = new Date(startDates[i]);
				let startedString = `${startDate.getUTCHours().toString().padStart(2, '0')}:${startDate.getUTCMinutes().toString().padStart(2, '0')} ${startDate.getUTCDate().toString().padStart(2, '0')}.${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${startDate.getUTCFullYear()}`;
				let guildSize = guildSizes[i].toString().padStart(6, ' ');
				let duelSize = duels[i].length.toString().padStart(5, ' ');
				let otherSize = other[i].length.toString().padStart(5, ' ');
				let matchtrackSize = matchtracks[i].length.toString().padStart(10, ' ');
				let bingoMatchSize = bingoMatches[i].toString().padStart(5, ' ');
				let updateString = update[i].toString().padStart(6, ' ');
				output = output + `Shard ${i} | ${startedString} | ${guildSize} | ${duelSize} | ${otherSize} | ${matchtrackSize} | ${bingoMatchSize} | ${updateString}\n`;
			}
			output = output + '```';
			await msg.reply(output);

			// Restart relevant ones
			await msg.client.shard.broadcastEval(async (c, { condition }) => {
				if (condition === 'all' ||
					condition === 'free' && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks === 0 && c.bingoMatches === 0 ||
					!isNaN(condition) && c.shardId === parseInt(condition) ||
					condition === 'free&update' && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks.length === 0 && c.bingoMatches === 0 && c.update === 1) {

					// eslint-disable-next-line no-undef
					process.exit();
				} else if (condition === 'update') {
					c.update = 1;
				}
			}, { context: { condition: args[1] } });
			return;
		} else if (args[0] === 'resetSavedRatings') {
			let deleted = await DBDuelRatingHistory.destroy({
				where: {
					id: {
						[Op.gt]: 0,
					},
				}
			});

			await msg.reply(`Deleted ${deleted} duel rating histories.`);

			let updated = await DBDiscordUsers.update({
				lastDuelRatingUpdate: null,
			}, {
				where: {
					lastDuelRatingUpdate: {
						[Op.not]: null,
					},
				},
				silent: true
			});

			return await msg.reply(`Updated ${updated} discord users.`);
		} else if (args[0] === 'removeProcessQueueTask') {
			await DBProcessQueue.destroy({
				where: {
					id: args[1],
				}
			});

			return await msg.reply('Deleted the processqueue entry.');
		} else {
			msg.reply('Invalid command');
		}

		msg.reply('Done.');
	},
};

function quicksortPP(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partitionPP(list, start, end);
		quicksortPP(list, start, p - 1);
		quicksortPP(list, p + 1, end);
	}
	return list;
}

function partitionPP(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].pp) >= parseFloat(pivot.pp)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}