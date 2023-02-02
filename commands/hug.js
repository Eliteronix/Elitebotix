const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'hug',
	description: 'Lets you send a gif to hug a user.',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('hug')
		.setNameLocalizations({
			'de-DE': 'umarmen',
			'en-GB': 'hug',
			'en-US': 'hug',
		})
		.setDescription('Lets you send a gif to hug a user')
		.setDescriptionLocalizations({
			'de-DE': 'Sendet ein Gif um einen Benutzer zu umarmen',
			'en-GB': 'Lets you send a gif to hug a user',
			'en-US': 'Lets you send a gif to hug a user',
		})
		.setDMPermission(false)
		.addUserOption((option) =>
			option
				.setName('user')
				.setNameLocalizations({
					'de-DE': 'benutzer',
					'en-GB': 'user',
					'en-US': 'user',
				})
				.setDescription('The user to hug')
				.setDescriptionLocalizations({
					'de-DE': 'Der Benutzer den du umarmen willst',
					'en-GB': 'The user to hug',
					'en-US': 'The user to hug',
				})
				.setRequired(true),
		)
		.addUserOption((option) =>
			option
				.setName('user2')
				.setNameLocalizations({
					'de-DE': 'benutzer2',
					'en-GB': 'user2',
					'en-US': 'user2',
				})
				.setDescription('The user to hug')
				.setDescriptionLocalizations({
					'de-DE': 'Der Benutzer den du umarmen willst',
					'en-GB': 'The user to hug',
					'en-US': 'The user to hug',
				})
				.setRequired(false),
		)
		.addUserOption((option) =>
			option
				.setName('user3')
				.setNameLocalizations({
					'de-DE': 'benutzer3',
					'en-GB': 'user3',
					'en-US': 'user3',
				})
				.setDescription('The user to hug')
				.setDescriptionLocalizations({
					'de-DE': 'Der Benutzer den du umarmen willst',
					'en-GB': 'The user to hug',
					'en-US': 'The user to hug',
				})
				.setRequired(false),
		)
		.addUserOption((option) =>
			option
				.setName('user4')
				.setNameLocalizations({
					'de-DE': 'benutzer4',
					'en-GB': 'user4',
					'en-US': 'user4',
				})
				.setDescription('The user to hug')
				.setDescriptionLocalizations({
					'de-DE': 'Der Benutzer den du umarmen willst',
					'en-GB': 'The user to hug',
					'en-US': 'The user to hug',
				})
				.setRequired(false),
		)
		.addUserOption((option) =>
			option
				.setName('user5')
				.setNameLocalizations({
					'de-DE': 'benutzer5',
					'en-GB': 'user5',
					'en-US': 'user5',
				})
				.setDescription('The user to hug')
				.setDescriptionLocalizations({
					'de-DE': 'Der Benutzer den du umarmen willst',
					'en-GB': 'The user to hug',
					'en-US': 'The user to hug',
				})
				.setRequired(false),
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
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
			let url = `https://g.tenor.com/v1/search?q=hug%20anime&key=${process.env.TENORTOKEN}&contentfilter=high`;
			let response = await fetch(url);
			let json = await response.json();
			const index = Math.floor(Math.random() * json.results.length);

			return interaction.followUp(`<@${interaction.user.id}> has hugged <@${user.id}>\n${json.results[index].url}`);
		});
	},
};