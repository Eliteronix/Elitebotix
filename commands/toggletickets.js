const { DBGuilds } = require('../dbObjects');
const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'toggletickets',
	description: 'Toggles the tickets setting for the server',
	botPermissions: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ManageRoles],
	botPermissionsTranslated: 'Manage Channels and Manage Roles',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('toggletickets')
		.setNameLocalizations({
			'de': 'ticketseinausschalten',
			'en-GB': 'toggletickets',
			'en-US': 'toggletickets',
		})
		.setDescription('Toggles the tickets setting for the server')
		.setDescriptionLocalizations({
			'de': 'Schaltet die Ticketeinstellung für den Server um',
			'en-GB': 'Toggles the tickets setting for the server',
			'en-US': 'Toggles the tickets setting for the server',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}
		//TODO: add attributes
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: interaction.guildId },
		});

		//Check if guild exists in db
		if (guild) {
			//reverse dadmode and save dataset
			if (guild.ticketsEnabled === true) {
				guild.ticketsEnabled = false;
			} else {
				guild.ticketsEnabled = true;
			}
			guild.save();

			//output change
			if (guild.ticketsEnabled) {
				await interaction.editReply('Tickets have been enabled');
			} else {
				await interaction.editReply('Tickets have been disabled');
			}
		} else {
			//Create guild in db if it wasn't there yet and disable it by default
			DBGuilds.create({ guildId: interaction.guildId, guildName: interaction.guild.name, ticketsEnabled: true });
			await interaction.editReply('Tickets have been enabled');
		}
	},
};