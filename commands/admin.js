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
		if (msg.author.id !== '138273136285057025') {
			return;
		}

		if (args[0] === 'guildCommands') {
			// await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
			// 	data: {
			// 		name: 'activityrole',
			// 		description: 'Assigns roles depending on how active your users are',
			// 		options: [
			// 			{
			// 				'name': 'list',
			// 				'description': 'Get a list of all commands',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 			},
			// 			{
			// 				'name': 'add',
			// 				'description': 'Get a list of commands for a category',
			// 				'type': 1, // 1 is type SUB_COMMAND
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role to add',
			// 						'type': 8, // 8 is type ROLE
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'requirement1',
			// 						'description': 'topx/topx%/xpoints -> replace x with a number',
			// 						'type': 3,
			// 						'required': true
			// 					},
			// 					{
			// 						'name': 'requirement2',
			// 						'description': 'topx/topx%/xpoints -> replace x with a number',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 					{
			// 						'name': 'requirement3',
			// 						'description': 'topx/topx%/xpoints -> replace x with a number',
			// 						'type': 3,
			// 						'required': false
			// 					},
			// 				]
			// 			},
			// 			{
			// 				'name': 'remove',
			// 				'description': 'Get help for a command',
			// 				'type': 1,
			// 				'options': [
			// 					{
			// 						'name': 'role',
			// 						'description': 'The role to add',
			// 						'type': 8, // 8 is type ROLE
			// 						'required': true
			// 					}
			// 				]
			// 			},
			// 		]
			// 	}
			// });

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
				data: {
					name: 'creator',
					description: 'Sends an info card about the developer'
				}
			});

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
				data: {
					name: 'link',
					description: 'Sends a link to add the bot to a server'
				}
			});

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({
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

			// const yes = await msg.client.api.applications(msg.client.user.id).guilds('800641468321759242').commands.get();
			// console.log(yes);
			// msg.client.api.applications(msg.client.user.id).guilds('800641468321759242').commands('871448630224113724').delete();
		}

		msg.channel.send('Done.');
	},
};