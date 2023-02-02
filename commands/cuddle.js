const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'cuddle',
	description: 'Lets you send a gif to cuddle a user',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('cuddle')
		.setNameLocalizations({
			'de': 'knuddeln',
			'en-GB': 'cuddle',
			'en-US': 'cuddle',
		})
		.setDescription('Lets you send a gif to cuddle a user')
		.setDescriptionLocalizations({
			'de': 'Lässt dich ein GIF versenden, um einen Benutzer zu knuddeln',
			'en-GB': 'Lets you send a gif to cuddle a user',
			'en-US': 'Lets you send a gif to cuddle a user',
		})
		.addUserOption(option =>
			option.setName('user')
				.setNameLocalizations({
					'de': 'benutzer',
					'en-GB': 'user',
					'en-US': 'user',
				})
				.setDescription('The user to cuddle')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer, den du knuddeln willst',
					'en-GB': 'The user to cuddle',
					'en-US': 'The user to cuddle',
				})
				.setRequired(true)
		)
		.addUserOption(option =>
			option.setName('user2')
				.setNameLocalizations({
					'de': 'benutzer2',
					'en-GB': 'user2',
					'en-US': 'user2',
				})
				.setDescription('The user to cuddle')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer, den du knuddeln willst',
					'en-GB': 'The user to cuddle',
					'en-US': 'The user to cuddle',
				})
				.setRequired(false)
		)
		.addUserOption(option =>
			option.setName('user3')
				.setNameLocalizations({
					'de': 'benutzer3',
					'en-GB': 'user3',
					'en-US': 'user3',
				})
				.setDescription('The user to cuddle')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer, den du knuddeln willst',
					'en-GB': 'The user to cuddle',
					'en-US': 'The user to cuddle',
				})
				.setRequired(false)
		)
		.addUserOption(option =>
			option.setName('user4')
				.setNameLocalizations({
					'de': 'benutzer4',
					'en-GB': 'user4',
					'en-US': 'user4',
				})
				.setDescription('The user to cuddle')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer, den du knuddeln willst',
					'en-GB': 'The user to cuddle',
					'en-US': 'The user to cuddle',
				})
				.setRequired(false)
		)
		.addUserOption(option =>
			option.setName('user5')
				.setNameLocalizations({
					'de': 'benutzer5',
					'en-GB': 'user5',
					'en-US': 'user5',
				})
				.setDescription('The user to cuddle')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer, den du knuddeln willst',
					'en-GB': 'The user to cuddle',
					'en-US': 'The user to cuddle',
				})
				.setRequired(false)
		),
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