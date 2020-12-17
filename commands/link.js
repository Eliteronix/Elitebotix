module.exports = {
	name: 'link',
	description: 'Sends a link to add the bot to a server',
	execute(msg, args) {
        msg.channel.send(`Here is a link to add the bot to your server: https://discord.com/oauth2/authorize?client_id=784836063058329680&scope=bot`);
	},
};