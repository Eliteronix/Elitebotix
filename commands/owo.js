const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'owo',
	aliases: ['uwu', 'ouo'],
	description: 'Sends a weebEmoji if someone else sends owo',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'hidden-general',
	//prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (!(args[0])) {
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
			});

			//check if guild is in db
			if (guild) {
				//check if owo is enabled
				if (guild.owoEnabled) {
					//declare weebEmojis array
					var weebEmojis = ['owo', 'uwu', 'UwU', 'OwO', 'OuO'];
		
					//send the message
					msg.channel.send(weebEmojis[Math.floor(Math.random() * weebEmojis.length)]);
				}
			} else {
				//Create guild dataset in db if not there yet
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, owoEnabled: false });
			}
		}
	},
};