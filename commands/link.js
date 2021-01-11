module.exports = {
	name: 'link',
	aliases: ['invite'],
	description: 'Sends a link to add the bot to a server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			//Link with permissions | Manage Roles, Read Messages, Send Messages, Manage Messages, Read Message History, Add Reactions, View Channel
			msg.channel.send('Here is a link to add the bot to your server: https://discordapp.com/oauth2/authorize?client_id=784836063058329680&scope=bot&permissions=268512320');
		}
	},
};