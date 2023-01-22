const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'help',
	description: 'List all commands or get info about a specific command.',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'general',
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		if (interaction.options._subcommand === 'command') {
			let commandname = interaction.options.getString('commandname');

			let { commands } = interaction.client;

			const command = commands.get(commandname) || commands.find(c => c.aliases && c.aliases.includes(commandname));

			if (!command) {
				return await interaction.editReply({ content: 'That\'s not a valid command!', ephemeral: true });
			}

			const data = [];
			//Push information about the command + extra information if necessary
			data.push(`**Name:** ${command.name}`);
			if (command.description) data.push(`**Description:** ${command.description}`);
			data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);
			data.push('To stay informed about changes go to [the official server](https://discord.com/invite/Asz5Gfe) and follow <#804658828883787784>');

			return await interaction.editReply(data.join('\n'));
		} else if (interaction.options._subcommand === 'category') {
			let category = interaction.options.getString('categoryname');

			let { commands } = interaction.client;

			commands = commands.filter(command => command.tags === category).map(command => command.name);

			//filter commands collection for noCooldownMessage and push the result
			const data = [];
			data.push(`\`${commands.join('`, `')}\``);
			data.push('\nYou can use </help category:1064502107832594484> to get a list of commands for a specific category!');
			data.push('You can send </help command:1064502107832594484> to get info on a specific command!');
			data.push('To stay informed about changes go to [the official server](https://discord.com/invite/Asz5Gfe) and follow <#804658828883787784>');

			return await interaction.editReply(data.join('\n'));
		}
	},
};