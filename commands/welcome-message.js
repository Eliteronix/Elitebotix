
const fsp = require('fsp');

module.exports = {
	name: 'welcome-message',
	description: 'Sends the specified message into the channel the user used the command in as soon as a new member arrives.',
	usage: '<message to send> (use "@member" to mention the new member)',
	cooldown: 5,
	args: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			let welcomeMessage = args.join(' ');
			//Set in json
			msg.channel.send(`The new message \`${welcomeMessage}\` has been set for welcoming new members in this channel.`);
			var guildID = msg.guild.id;
			try {
				await fsp.readFile('data.json', 'utf8', function (err, data) {
					if (err) {
						console.log(err);
					}

					var jsonObj = JSON.parse(data);
					console.log(jsonObj);
					//msg.channel.send(jsonObj.welcomeMessage.channel);
				});
			} catch (e) {
				console.log(e);
				throw e;
			}
		}
	},
};