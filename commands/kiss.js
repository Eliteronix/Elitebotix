const fetch = require('node-fetch');
const { populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'kiss',
	// aliases: ['dice', 'ouo'],
	description: 'Lets you send a gif to kiss a user.',
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
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(additionalObjects[0], interaction);

			await additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
				data: {
					type: 4,
					data: {
						content: 'Kiss initiated'
					}
				}
			});
		}

		if (msg.mentions.users.first()) {
			msg.mentions.users.forEach(async (user) => {
				// eslint-disable-next-line no-undef
				let url = `https://g.tenor.com/v1/search?q=kiss%20anime&key=${process.env.TENORTOKEN}&contentfilter=high`;
				let response = await fetch(url);
				let json = await response.json();
				const index = Math.floor(Math.random() * json.results.length);
				msg.channel.send(`<@${msg.author.id}> has kissed <@${user.id}>\n${json.results[index].url}`);
			});
		} else {
			msg.reply('please mention a user.');
		}
	},
};