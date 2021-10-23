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

		let serverAdminCommands = ['activityrole'];

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
									'description': 'The role that should no longer be an activityrole',
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
							'description': 'Show which activityroles are set up.',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				},
			});

			interaction.reply(`Server-admin commands will be shown:\n\`${serverAdminCommands.join('``, `')}\``);
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