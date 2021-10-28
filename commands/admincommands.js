const { Permissions } = require('discord.js');

module.exports = {
	name: 'admincommands',
	//aliases: ['developer'],
	description: 'Allows you to toggle admin commands on and off',
	//usage: '<bug/feature/request> <description>',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
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
		if (msg) {
			return msg.reply('Please use the slash command. (`/admincommands`)');
		}

		let show = false;

		for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
			if (interaction.options._hoistedOptions[i].name === 'show' && interaction.options._hoistedOptions[i].value) {
				show = true;
			}
		}

		let serverAdminCommands = ['activityrole', 'autorole', 'goodbye-message', 'logging', 'osu-track', 'prefix', 'prune', 'reactionrole', 'starboard', 'tempvoice'];

		if (show) {
			await interaction.deferReply();

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.post({
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

			interaction.editReply(`Server-admin commands will be shown:\n\`${serverAdminCommands.join('`, `')}\``);
		} else {
			await interaction.deferReply();

			const commands = await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.get();
			for (let i = 0; i < commands.length; i++) {
				if (serverAdminCommands.includes(commands[i].name)) {
					await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands(commands[i].id).delete();
				}
			}

			interaction.editReply('Server-admin commands will no longer be shown.');
		}
	},
};