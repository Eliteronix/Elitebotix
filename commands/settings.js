const Discord = require('discord.js');
const { DBGuilds, DBAutoRoles } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'settings',
	description: 'Sends an info card about the settings of the bot for the server',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('settings')
		.setNameLocalizations({
			'de': 'einstellungen',
			'en-GB': 'settings',
			'en-US': 'settings',
		})
		.setDescription('Sends an info card about the settings of the bot for the server')
		.setDescriptionLocalizations({
			'de': 'Sende eine Info-Karte über die Einstellungen des Bots für den Server',
			'en-GB': 'Sends an info card about the settings of the bot for the server',
			'en-US': 'Sends an info card about the settings of the bot for the server',
		})
		.setDMPermission(false),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		//Get bot member
		let member = null;

		try {
			member = await interaction.guild.members.fetch({ user: [interaction.client.user.id], time: 300000 })
				.catch((err) => {
					throw new Error(err);
				});

			member = member.first();
		} catch (e) {
			if (e.message !== 'Members didn\'t arrive in time.') {
				console.error('commands/settings.js | Get bot member', e);
				return;
			}
		}

		const user = await interaction.client.users.fetch(interaction.client.user.id);

		logDatabaseQueries(4, 'commands/settings.js DBGuilds');
		//TODO: add attributes and logdatabasequeries
		const guild = await DBGuilds.findOne({
			where: { guildId: interaction.guildId },
		});

		let membername;

		if (member.nickname) {
			membername = member.nickname;
		} else {
			membername = user.username;
		}

		let welcomeMessage;

		if (guild && guild.sendWelcomeMessage) {
			welcomeMessage = 'Enabled';
		} else {
			welcomeMessage = 'Disabled';
		}

		let goodbyeMessage;

		if (guild && guild.sendGoodbyeMessage) {
			goodbyeMessage = 'Enabled';
		} else {
			goodbyeMessage = 'Disabled';
		}

		logDatabaseQueries(4, 'commands/settings.js DBAutoRoles');
		//get all autoRoles for the guild
		//TODO: add attributes and logdatabasequeries
		const autoRolesList = await DBAutoRoles.findAll({ where: { guildId: interaction.guildId } });
		//iterate for every autorole in the array
		for (let i = 0; i < autoRolesList.length; i++) {
			//get role object by role Id
			let autoRole = interaction.guild.roles.cache.get(autoRolesList[i].roleId);
			//Set array index to the role name for the output
			autoRolesList[i] = autoRole.name;
		}

		//Set the output string
		const autoRolesString = autoRolesList.join(', ') || 'None.';

		let temporaryVoicesSetting = 'Disabled';

		if (guild && guild.temporaryVoices) {
			temporaryVoicesSetting = 'Enabled';
		}

		let temporaryText = 'Disabled';

		if (guild && guild.addTemporaryText) {
			temporaryText = 'Enabled';
		}

		const guildBotInfoEmbed = new Discord.EmbedBuilder()
			.setColor('#ffcc00')
			.setTitle(`${membername} server settings`)
			.setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
			.addFields(
				{ name: 'Welcome-Messages', value: `${welcomeMessage}` },
				{ name: 'Goodbye-Messages', value: `${goodbyeMessage}` },
				{ name: 'Autoroles', value: `${autoRolesString}` },
				{ name: 'Temporary Voices', value: `${temporaryVoicesSetting}` },
				{ name: 'Temporary Text', value: `${temporaryText}` },
			)
			.setTimestamp();

		return interaction.editReply({ embeds: [guildBotInfoEmbed] });
	},
};