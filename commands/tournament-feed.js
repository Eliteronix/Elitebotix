const { populateMsgFromInteraction, getOsuUserServerMode } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'tournament-feed',
	// aliases: ['developer', 'donate', 'support', 'creators', 'developers', 'devs'],
	description: 'Toggles receiving new tournament notifications',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	//guildOnly: true,
	//args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		msg = await populateMsgFromInteraction(interaction);
		if (!interaction) {
			return msg.reply('Please use the / command `/tournamentfeed-admin`');
		}
		await interaction.deferReply({ ephemeral: true });

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];

		if (!commandUser) {
			return interaction.editReply('Please use `/osu-link connect` to connect your osu! account first.');
		}

		if (commandUser.tournamentPings) {
			commandUser.tournamentPings = false;

			await interaction.editReply('You will no longer receive tournament notifications.');
		} else {
			commandUser.tournamentPings = true;

			await interaction.editReply('You will now receive tournament notifications.');
		}

		return await commandUser.save();
	},
};