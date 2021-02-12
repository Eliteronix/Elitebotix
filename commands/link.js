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
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	execute(msg, args) {
		//Link with permissions | Administrator, Manage Roles, Manage Channels, Read Messages, Send Messages, Manage Messages, Read Message History, Add Reactions, All Voice Perm
		msg.channel.send('Here is a link to add the bot to your server: https://discord.com/oauth2/authorize?client_id=784836063058329680&scope=bot&permissions=334573400');
	},
};