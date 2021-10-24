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

		let serverAdminCommands = ['activityrole', 'autorole', 'goodbye-message', 'logging'];

		if (show) {
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
									'type': 7, // 3 is type CHANNEL
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

			interaction.reply(`Server-admin commands will be shown:\n\`${serverAdminCommands.join('`, `')}\``);
		} else {
			const commands = await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands.get();
			for (let i = 0; i < commands.length; i++) {
				if (serverAdminCommands.includes(commands[i].name)) {
					await additionalObjects[0].api.applications(additionalObjects[0].user.id).guilds(interaction.guildId).commands(commands[i].id).delete();
				}
			}

			interaction.reply('Server-admin commands will no longer be shown.');
		}
	},
};