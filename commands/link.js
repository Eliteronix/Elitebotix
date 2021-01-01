module.exports = {
	name: 'link',
	aliases: ['invite'],
	description: 'Sends a link to add the bot to a server',
	//usage: '<bug/feature/request> <description>',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			msg.channel.send('Here is a link to add the bot to your server: https://discord.com/oauth2/authorize?client_id=784836063058329680&scope=bot');
		}
	},
};