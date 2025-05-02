const { developers, showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('node:fs');

const peopleThatWantData = [
	'146092837723832320' // Stage
];

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
		.setDefaultMemberPermissions(PermissionFlagsBits.Everyone)
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
				.setAutocomplete(true)
		)
		.addAttachmentOption(option =>
			option.setName('file')
				.setDescription('The file for the command')
				.setRequired(false)
		),
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === 'command') {
			const adminCommands = fs.readdirSync('./commands/admin');

			let filtered = adminCommands.filter(filename => filename.toLowerCase().includes(focusedOption.value.toLowerCase()));

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
		} else if (focusedOption.name === 'argument') {
			const command = interaction.options.getString('command').split(' | ')[0];

			const commandModule = require(`./admin/${command}.js`);

			if (commandModule.autocomplete) {
				try {
					await commandModule.autocomplete(interaction);
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
						console.error(error);
					}
				}
			}
		}
	},
	async execute(msg, args, interaction) {
		if (!developers.includes(interaction.user.id) && !(interaction.options.getString('command') === 'verifiedMatches' && peopleThatWantData.includes(interaction.user.id))) {
			try {
				return await interaction.reply({ content: 'Only developers may use this command.', flags: MessageFlags.Ephemeral });
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
			await interaction.editReply('There was an error trying to execute that command!');
			return console.error(error);
		}
	},
};