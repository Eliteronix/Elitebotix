const fetch = require('node-fetch');
const { populateMsgFromInteraction } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'pat',
	// aliases: ['dice', 'ouo'],
	description: 'Lets you send a gif to pat a user.',
	usage: '<@user>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	// guildOnly: true,
	args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Pat initiated');
		}

		if (msg.mentions.users.first()) {
			msg.mentions.users.forEach(async (user) => {
				// eslint-disable-next-line no-undef
				let url = `https://g.tenor.com/v1/search?q=pat%20anime&key=${process.env.TENORTOKEN}&contentfilter=high`;
				let response = await fetch(url);
				let json = await response.json();
				const index = Math.floor(Math.random() * json.results.length);
				if (msg.id) {
					return msg.reply(`<@${msg.author.id}> has pat <@${user.id}>\n${json.results[index].url}`);
				}

				return interaction.followUp(`<@${msg.author.id}> has pat <@${user.id}>\n${json.results[index].url}`);
			});
		} else {
			msg.reply('please mention a user.');
		}
	},
};