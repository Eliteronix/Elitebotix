const { DBOsuMultiScores, DBProcessQueue } = require('../dbObjects');
const { saveOsuMultiScores, pause } = require('../utils');
const osu = require('node-osu');
const { developers } = require('../config.json');

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
	async execute(msg, args) {
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
			// 		name: 'admincommands',
			// 		description: 'Adapt if server-admin commands should be shown or not',
			// 		options: [
			// 			{
			// 				'name': 'show',
			// 				'description': 'Should the commands for server-admins be shown?',
			// 				'type': 5,
			// 				'required': true
			// 			}
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
			// 		description: 'Sends feedback to the dev',
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
			// 		name: 'osu-leaderboard',
			// 		description: 'Sends a leaderboard of all the players in the guild that have their account connected',
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
			// 					}
			// 				]
			// 			},
			// 			{
			// 				'name': 'custom-react-to-play',
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
			// 						'description': 'The mappool in the following format: NM234826,HD123141,HR123172',
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
			// 						'description': 'Which types of scores should the graph evaluate?',
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
			// 				'name': 'username6',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username7',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username8',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username9',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username10',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username11',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username12',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username13',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username14',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username15',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'username16',
			// 				'description': 'The username, id or link of the player',
			// 				'type': 3,
			// 				'required': false
			// 			}
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
			// 				'name': 'scaled',
			// 				'description': 'Should the graph be scaled by the total evaluation?',
			// 				'type': 5,
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'scores',
			// 				'description': 'Which types of scores should the graph evaluate?',
			// 				'type': 3,
			// 				'required': true,
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
			// 				'required': true
			// 			},
			// 			{
			// 				'name': 'runningaverage',
			// 				'description': 'Should a running average be shown instead?',
			// 				'type': 5,
			// 				'required': true
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
			// 		name: 'osu-top',
			// 		description: 'Sends an info card about the topplays of the specified player',
			// 		options: [
			// 			{
			// 				'name': 'new',
			// 				'description': 'Should the newest topplays be shown?',
			// 				'type': 5,
			// 				'required': false
			// 			},
			// 			{
			// 				'name': 'amount',
			// 				'description': 'The amount of topplays to be displayed',
			// 				'type': 4,
			// 				'required': false
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
			// 		name: 'weather',
			// 		description: 'Sends info about the weather of the given location',
			// 		options: [
			// 			{
			// 				'name': 'unit',
			// 				'description': 'The unit that should be used',
			// 				'type': 3,
			// 				'required': true,
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
			// 				'required': true
			// 			}
			// 		]
			// 	}
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
					name: 'admincommands',
					description: 'Adapt if server-admin commands should be shown or not',
					options: [
						{
							'name': 'show',
							'description': 'Should the commands for server-admins be shown?',
							'type': 5,
							'required': true
						}
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
					description: 'Sends feedback to the dev',
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
					name: 'osu-leaderboard',
					description: 'Sends a leaderboard of all the players in the guild that have their account connected',
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
								}
							]
						},
						{
							'name': 'custom-react-to-play',
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
									'description': 'The mappool in the following format: NM234826,HD123141,HR123172',
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
									'description': 'Which types of scores should the graph evaluate?',
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
						}
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
							'name': 'scaled',
							'description': 'Should the graph be scaled by the total evaluation?',
							'type': 5,
							'required': true
						},
						{
							'name': 'scores',
							'description': 'Which types of scores should the graph evaluate?',
							'type': 3,
							'required': true,
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
							'required': true
						},
						{
							'name': 'runningaverage',
							'description': 'Should a running average be shown instead?',
							'type': 5,
							'required': true
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
					name: 'osu-top',
					description: 'Sends an info card about the topplays of the specified player',
					options: [
						{
							'name': 'new',
							'description': 'Should the newest topplays be shown?',
							'type': 5,
							'required': false
						},
						{
							'name': 'amount',
							'description': 'The amount of topplays to be displayed',
							'type': 4,
							'required': false
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
					name: 'weather',
					description: 'Sends info about the weather of the given location',
					options: [
						{
							'name': 'unit',
							'description': 'The unit that should be used',
							'type': 3,
							'required': true,
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
							'required': true
						}
					]
				}
			});
		} else if (args[0] === 'removeGlobalCommands') {
			const commands = await msg.client.api.applications(msg.client.user.id).commands.get();
			for (let i = 0; i < commands.length; i++) {
				await msg.client.api.applications(msg.client.user.id).commands(commands[i].id).delete();
			}
		} else if (args[0] === 'recalculateMultiScores') {
			//recalculate existing scores in the db
			const allScores = await DBOsuMultiScores.findAll();

			for (let i = 0; i < allScores.length; i++) {
				let matchId = allScores[i].matchId;
				for (let j = 0; j < allScores.length; j++) {
					if (allScores[j].matchId === matchId) {
						allScores.splice(j, 1);
						j--;
					}
				}

				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				await pause(250);

				await osuApi.getMatch({ mp: matchId })
					.then(async (match) => {
						const allMatchScores = await DBOsuMultiScores.findAll({
							where: { matchId: match.id }
						});

						for (let j = 0; j < allMatchScores.length; j++) {
							await allMatchScores[j].destroy();
						}

						saveOsuMultiScores(match);

						console.log('MatchId done:', matchId);
					})
					.catch(error => {
						console.log('MatchId went into an error (Not found):', matchId, error);
					});
			}
			console.log('Done');
		} else if (args[0] === 'fixMultiTourneyScores') {
			const allScores = await DBOsuMultiScores.findAll({
				where: { tourneyMatch: false }
			});

			allScores.forEach(score => {
				if (score.matchName.toLowerCase().match(/.+: (.+) vs (.+)/g) || score.matchName.toLowerCase().match(/.+: (.+) vs. (.+)/g)) {
					score.tourneyMatch = true;
					score.save();
					console.log(score.matchName);
				}
			});
		} else if (args[0] === 'saveMultiMatches') {
			DBProcessQueue.create({ guildId: 'None', task: 'saveMultiMatches', additions: `${args[1]}`, priority: 0 });
		} else if (args[0] === 'sendMultis') {
			for (let i = parseInt(args[1]); i < parseInt(args[2]); i++) {
				msg.reply(`https://osu.ppy.sh/community/matches/${i}`);
			}
		}

		msg.reply('Done.');
	},
};