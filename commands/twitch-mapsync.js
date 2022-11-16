const { Permissions } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { getOsuUserServerMode } = require('../utils');

module.exports = {
	name: 'twitch-mapsync',
	//aliases: ['developer'],
	description: 'Allowes you to toggle the twitch-mapsync',
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
		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];

		if (!commandUser) {
			return msg.reply('You don\'t have an osu! account linked to your discord account. Please do so by using `/osu-link connect`');
		}

		if (!commandUser.twitchName) {
			return msg.reply('You don\'t have a twitch account linked to your discord account. This feature is currently limited access. Ask `@Eliteronix#4208` if you want access.');
		}

		if (commandUser.twitchOsuMapSync) {
			commandUser.twitchOsuMapSync = false;
			msg.reply('Twitch-Mapsync is now disabled.');
		} else {
			commandUser.twitchOsuMapSync = true;
			msg.reply('Twitch-Mapsync is now enabled.');
			await DBProcessQueue.create({ task: 'joinTwitchChannel', priority: 15, additions: commandUser.twitchName, date: new Date() });
		}
		commandUser.save();
	},
};