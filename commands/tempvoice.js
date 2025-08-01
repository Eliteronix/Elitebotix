const { DBGuilds } = require('../dbObjects');
const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'tempvoice',
	description: 'Toggles the temporary channel setting for the server',
	botPermissions: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages, Manage Channels, Manage Roles and Move Members',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('tempvoice')
		.setNameLocalizations({
			'de': 'tempvoice',
			'en-GB': 'tempvoice',
			'en-US': 'tempvoice',
		})
		.setDescription('Toggles the temporary channel setting for the server')
		.setDescriptionLocalizations({
			'de': 'Aktiviert/Deaktiviert temporäre Kanäle für den Server',
			'en-GB': 'Toggles the temporary channel setting for the server',
			'en-US': 'Toggles the temporary channel setting for the server',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
		.addSubcommand(subcommand =>
			subcommand
				.setName('enablevoice')
				.setNameLocalizations({
					'de': 'aktivierevoice',
					'en-GB': 'enablevoice',
					'en-US': 'enablevoice',
				})
				.setDescription('Enable temporary voices for the server')
				.setDescriptionLocalizations({
					'de': 'Aktiviert temporäre Sprachkanäle für den Server',
					'en-GB': 'Enable temporary voices for the server',
					'en-US': 'Enable temporary voices for the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disablevoice')
				.setNameLocalizations({
					'de': 'deaktivierevoice',
					'en-GB': 'disablevoice',
					'en-US': 'disablevoice',
				})
				.setDescription('Disable temporary voices for the server')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert temporäre Sprachkanäle für den Server',
					'en-GB': 'Disable temporary voices for the server',
					'en-US': 'Disable temporary voices for the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('enabletext')
				.setNameLocalizations({
					'de': 'aktivieretext',
					'en-GB': 'enabletext',
					'en-US': 'enabletext',
				})
				.setDescription('Enable temporary textchannels along voices for the server')
				.setDescriptionLocalizations({
					'de': 'Aktiviert temporäre Textkanäle parallel zu Sprachkanälen für den Server',
					'en-GB': 'Enable temporary textchannels along voices for the server',
					'en-US': 'Enable temporary textchannels along voices for the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disabletext')
				.setNameLocalizations({
					'de': 'deaktivieretext',
					'en-GB': 'disabletext',
					'en-US': 'disabletext',
				})
				.setDescription('Disable temporary textchannels along voices for the server')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert temporäre Textkanäle parallel zu Sprachkanälen für den Server',
					'en-GB': 'Disable temporary textchannels along voices for the server',
					'en-US': 'Disable temporary textchannels along voices for the server',
				})
		),
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

		//get guild from db
		let guild = await DBGuilds.findOne({
			attributes: ['id', 'temporaryVoices', 'addTemporaryText'],
			where: {
				guildId: interaction.guildId
			},
		});

		if (!guild) {
			//If guild doesn't exist, create it
			guild = DBGuilds.create({
				guildId: interaction.guildId,
				guildName: interaction.guild.name
			});
		}

		//Check first argument
		if (interaction.options.getSubcommand() === 'enablevoice') {
			guild.temporaryVoices = true;
			await guild.save();

			if (guild.addTemporaryText) {
				return await interaction.editReply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type </tempvoice disabletext:${interaction.client.slashCommandData.find(command => command.name === 'tempvoice').id}>`);
			} else {
				return await interaction.editReply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will NOT be created alongside for all the members in the voices.\n To enable this type </tempvoice enabletext:${interaction.client.slashCommandData.find(command => command.name === 'tempvoice').id}>`);
			}
		} else if (interaction.options.getSubcommand() === 'disablevoice') {
			guild.temporaryVoices = false;
			await guild.save();

			return await interaction.editReply('Temporary channels have been disabled.');
		} else if (interaction.options.getSubcommand() === 'enabletext') {
			guild.addTemporaryText = true;
			await guild.save();

			return await interaction.editReply('Text channels will now be created alongside temporary voice channels.');
		} else if (interaction.options.getSubcommand() === 'disabletext') {
			guild.addTemporaryText = false;
			await guild.save();

			return await interaction.editReply('Text channels will NOT be created alongside temporary voice channels.');
		}
	},
};