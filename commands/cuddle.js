const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'cuddle',
	description: 'Lets you send a gif to cuddle a user',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'misc',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let users = [];

		if (interaction.options.getUser('user')) {
			users.push(interaction.options.getUser('user'));
		}

		if (interaction.options.getUser('user2')) {
			users.push(interaction.options.getUser('user2'));
		}

		if (interaction.options.getUser('user3')) {
			users.push(interaction.options.getUser('user3'));
		}

		if (interaction.options.getUser('user4')) {
			users.push(interaction.options.getUser('user4'));
		}

		if (interaction.options.getUser('user5')) {
			users.push(interaction.options.getUser('user5'));
		}

		users.forEach(async (user) => {
			// eslint-disable-next-line no-undef
			let url = `https://g.tenor.com/v1/search?q=cuddle%20anime&key=${process.env.TENORTOKEN}&contentfilter=high`;
			let response = await fetch(url);
			let json = await response.json();
			const index = Math.floor(Math.random() * json.results.length);

			return interaction.followUp(`<@${interaction.user.id}> has cuddled <@${user.id}>\n${json.results[index].url}`);
		});
	},
};