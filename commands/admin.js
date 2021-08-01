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
					name: 'cuddle',
					description: 'Lets you send a gif to cuddle a user',
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
					name: 'creator',
					description: 'Sends an info card about the developer'
				}
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

			// const yes = await msg.client.api.applications(msg.client.user.id).guilds('800641468321759242').commands.get();
			// console.log(yes);
			// msg.client.api.applications(msg.client.user.id).guilds('800641468321759242').commands('871448630224113724').delete();
		}

		msg.channel.send('Done.');
	},
};