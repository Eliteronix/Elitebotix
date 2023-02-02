const { showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	name: 'help',
	description: 'List all commands or get info about a specific command.',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('help')
		.setNameLocalizations({
			'de': 'hilfe',
			'en-GB': 'help',
			'en-US': 'help',
		})
		.setDescription('List all commands or get info about a specific command')
		.setDescriptionLocalizations({
			'de': 'Listet alle Befehle auf oder gibt Informationen zu einem bestimmten Befehl',
			'en-GB': 'List all commands or get info about a specific command',
			'en-US': 'List all commands or get info about a specific command',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('category')
				.setNameLocalizations({
					'de': 'kategorie',
					'en-GB': 'category',
					'en-US': 'category',
				})
				.setDescription('Get a list of commands for a category')
				.setDescriptionLocalizations({
					'de': 'Listet alle Befehle einer Kategorie auf',
					'en-GB': 'Get a list of commands for a category',
					'en-US': 'Get a list of commands for a category',
				})
				.addStringOption(option =>
					option
						.setName('categoryname')
						.setNameLocalizations({
							'de': 'kategorienname',
							'en-GB': 'categoryname',
							'en-US': 'categoryname',
						})
						.setDescription('The name of the category')
						.setDescriptionLocalizations({
							'de': 'Der Name der Kategorie',
							'en-GB': 'The name of the category',
							'en-US': 'The name of the category',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'general', value: 'general' },
							{ name: 'osu!', value: 'osu' },
							{ name: 'misc', value: 'misc' },
							{ name: 'server-admin', value: 'server-admin' },
						)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('command')
				.setNameLocalizations({
					'de': 'befehl',
					'en-GB': 'command',
					'en-US': 'command',
				})
				.setDescription('Get info about a specific command')
				.setDescriptionLocalizations({
					'de': 'Gibt Informationen zu einem bestimmten Befehl',
					'en-GB': 'Get info about a specific command',
					'en-US': 'Get info about a specific command',
				})
				.addStringOption(option =>
					option
						.setName('commandname')
						.setNameLocalizations({
							'de': 'befehlsname',
							'en-GB': 'commandname',
							'en-US': 'commandname',
						})
						.setDescription('The name of the command')
						.setDescriptionLocalizations({
							'de': 'Der Name des Befehls',
							'en-GB': 'The name of the command',
							'en-US': 'The name of the command',
						})
						.setRequired(true)
						.setAutocomplete(true)
				)
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		let { commands } = interaction.client;

		commands = commands.filter(command => command.tags !== 'debug').map(command => command.name);

		let filtered = commands.filter(choice => choice.startsWith(focusedValue));

		filtered = filtered.slice(0, 25);

		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
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