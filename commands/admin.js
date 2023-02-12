const { developers, showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');

module.exports = {
	name: 'admin',
	description: 'Sends a message with the bots server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 1,
	tags: 'debug',
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('Admin commands')
		.setDMPermission(true)
		.setDefaultMemberPermissions('0')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('Command to run')
				.setRequired(true)
				.setAutocomplete(true)
		)
		.addStringOption(option =>
			option.setName('argument')
				.setDescription('Argument for the command')
				.setRequired(false)
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		const adminCommands = fs.readdirSync('./commands/admin');

		let filtered = adminCommands.filter(filename => filename.includes(focusedValue));

		filtered = filtered.slice(0, 25);

		try {
			await interaction.respond(
				filtered.map(file => {
					const command = require(`./admin/${file}`);

					return { name: `${command.name} | ${command.usage}`, value: command.name };
				}),
			);
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
		}
	},
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (!developers.includes(interaction.user.id)) {
			try {
				return await interaction.reply({ content: 'Only developers may use this command.', ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}
		}

		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		try {
			const command = require(`./admin/${interaction.options.getString('command')}.js`);

			return await command.execute(interaction);
		} catch (error) {
			interaction.editReply('There was an error trying to execute that command!');
			return console.error(error);
		}
	},
};