const { Permissions } = require('discord.js');
const { DBProcessQueue, DBDiscordUsers } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'twitch',
	//aliases: ['developer'],
	description: 'Allowes you to manage the twitch commands',
	//usage: '<bug/feature/request> <description>',
	// permissions: Permissions.FLAGS.MANAGE_GUILD,
	// permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	// guildOnly: true,
	// args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		if (interaction.options._subcommand === 'togglemp') {
			logDatabaseQueries(2, 'twitch.js DBDiscordUsers togglemp');
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return interaction.editReply('You don\'t have an osu! account linked to your discord account. Please do so by using </osu-link connect:1023849632599658496>');
			}

			if (!discordUser.twitchName) {
				return interaction.editReply('You don\'t have a twitch account linked to your discord account. Use </feedback:1023849367817424937> with type `question` to request access.');
			}

			if (discordUser.twitchOsuMatchCommand) {
				discordUser.twitchOsuMatchCommand = false;
				interaction.editReply('!mp is now disabled.');
			} else {
				discordUser.twitchOsuMatchCommand = true;
				interaction.editReply('!mp is now enabled.');
				await DBProcessQueue.create({ task: 'joinTwitchChannel', priority: 15, additions: discordUser.twitchName, date: new Date() });
			}
			discordUser.save();
		} else if (interaction.options._subcommand === 'togglemapsync') {
			logDatabaseQueries(2, 'twitch.js DBDiscordUsers togglemapsync');
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return interaction.editReply('You don\'t have an osu! account linked to your discord account. Please do so by using </osu-link connect:1023849632599658496>');
			}

			if (!discordUser.twitchName) {
				return interaction.editReply('You don\'t have a twitch account linked to your discord account. Use </feedback:1023849367817424937> with type `question` to request access.');
			}

			if (discordUser.twitchOsuMapSync) {
				discordUser.twitchOsuMapSync = false;
				interaction.editReply('Twitch-Mapsync is now disabled.');
			} else {
				discordUser.twitchOsuMapSync = true;
				interaction.editReply('Twitch-Mapsync is now enabled.');
				await DBProcessQueue.create({ task: 'joinTwitchChannel', priority: 15, additions: discordUser.twitchName, date: new Date() });
			}
			discordUser.save();
		}
	},
};