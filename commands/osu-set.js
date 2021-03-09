const { DBDiscordUsers } = require('../dbObjects');

module.exports = {
	name: 'osu-set',
	aliases: ['osu-main'],
	description: 'Allows you to set your main mode and server',
	usage: '<mode/server>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 10,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {

		//get discordUser from db
		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: msg.author.id },
		});

		if(args[0].toLowerCase() === 'server'){
			if(args[1] && args[1].toLowerCase() === 'bancho'){
				if(discordUser){
					discordUser.osuMainServer = 'bancho';
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainServer: 'bancho' });
				}
				
				msg.channel.send('Bancho has been set as your main server.');
			} else if(args[1] && args[1].toLowerCase() === 'ripple'){
				if(discordUser){
					discordUser.osuMainServer = 'ripple';
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainServer: 'ripple' });
				}
				
				msg.channel.send('Ripple has been set as your main server.');
			} else {
				msg.channel.send('Please specify which server you want to set as your main server: `bancho`, `ripple`');
			}
		} else if(args[0].toLowerCase() === 'mode'){
			if(args[1] && args[1].toLowerCase() === 'standard'){
				if(discordUser){
					discordUser.osuMainMode = 0;
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainMode: 0 });
				}
				
				msg.channel.send('Standard has been set as your main mode.');
			} else if(args[1] && args[1].toLowerCase() === 'taiko'){
				if(discordUser){
					discordUser.osuMainMode = 1;
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainMode: 1 });
				}
				
				msg.channel.send('Taiko has been set as your main mode.');
			} else if(args[1] && args[1].toLowerCase() === 'catch'){
				if(discordUser){
					discordUser.osuMainMode = 2;
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainMode: 2 });
				}
				
				msg.channel.send('Catch has been set as your main mode.');
			} else if(args[1] && args[1].toLowerCase() === 'mania'){
				if(discordUser){
					discordUser.osuMainMode = 3;
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainMode: 3 });
				}
				
				msg.channel.send('Mania has been set as your main mode.');
			} else {
				msg.channel.send('Please specify which mode you want to set as your main mode: `standard`, `taiko`, `catch`, `mania`');
			}
		} else {
			msg.channel.send('Please specify what you want to change: `mode`, `server`');
		}
	},
};