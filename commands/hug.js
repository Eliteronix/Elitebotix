const fetch = require('node-fetch');

module.exports = {
	name: 'hug',
	// aliases: ['dice', 'ouo'],
	description: 'Lets you send a gif to hug a user.',
	usage: '<@user>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	// guildOnly: true,
	args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if(msg.mentions.users.first()){
			// eslint-disable-next-line no-undef
			let url = `https://g.tenor.com/v1/search?q=hug%20anime&key=${process.env.TENORTOKEN}&contentfilter=high`;
			let response = await fetch(url);
			let json = await response.json();
			const index = Math.floor(Math.random() * json.results.length);
			msg.channel.send(`<@${msg.author.id}> has hugged <@${msg.mentions.users.first().id}>\n${json.results[index].url}`);
		} else {
			msg.reply('please mention a user.');
		}
	},
};