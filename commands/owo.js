module.exports = {
	name: 'owo',
	aliases: ['uwu', 'ouo'],
	description: 'Sends a weebEmoji if someone else sends owo',
	//usage: '<bug/feature/request> <description>',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (!(prefixCommand)) {
			//declare weebEmojis array
			var weebEmojis = ['owo', 'uwu', 'UwU', 'OwO', 'OuO'];

			//send the message
			msg.channel.send(weebEmojis[Math.floor(Math.random() * weebEmojis.length)]);
		}
	},
};