const { DBGuilds } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'owo',
	aliases: ['uwu', 'ouo', 'umu'],
	description: 'Sends a weebEmoji if someone else sends owo',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'hidden-general',
	//prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (!(args[0])) {
			logDatabaseQueries(4, 'commands/owo.js DBGuilds');
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//check if guild is in db
			if (guild) {
				//check if owo is enabled
				if (guild.owoEnabled) {
					//declare weebEmojis array
					var weebEmojis = ['owo', 'uwu', 'umu', 'UwU', 'OwO', 'OuO', 'UmU'];

					//send the message
					msg.reply(weebEmojis[Math.floor(Math.random() * weebEmojis.length)]);
				}
			} else {
				//Create guild dataset in db if not there yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, owoEnabled: false });
			}
		}
	},
};