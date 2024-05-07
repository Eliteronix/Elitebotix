const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'kiss',
	description: 'Lets you send a gif to kiss a user.',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('kiss')
		.setNameLocalizations({
			'de': 'küssen',
			'en-GB': 'kiss',
			'en-US': 'kiss',
		})
		.setDescription('Lets you send a gif to kiss a user')
		.setDescriptionLocalizations({
			'de': 'Sendet ein Gif um einen Benutzer zu küssen',
			'en-GB': 'Lets you send a gif to kiss a user',
			'en-US': 'Lets you send a gif to kiss a user',
		})
		.setDMPermission(false)
		.addUserOption((option) =>
			option
				.setName('user')
				.setNameLocalizations({
					'de': 'benutzer',
					'en-GB': 'user',
					'en-US': 'user',
				})
				.setDescription('The user to kiss')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer den du küssen willst',
					'en-GB': 'The user to kiss',
					'en-US': 'The user to kiss',
				})
				.setRequired(true),
		)
		.addUserOption((option) =>
			option
				.setName('user2')
				.setNameLocalizations({
					'de': 'benutzer2',
					'en-GB': 'user2',
					'en-US': 'user2',
				})
				.setDescription('The user to kiss')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer den du küssen willst',
					'en-GB': 'The user to kiss',
					'en-US': 'The user to kiss',
				})
				.setRequired(false),
		)
		.addUserOption((option) =>
			option
				.setName('user3')
				.setNameLocalizations({
					'de': 'benutzer3',
					'en-GB': 'user3',
					'en-US': 'user3',
				})
				.setDescription('The user to kiss')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer den du küssen willst',
					'en-GB': 'The user to kiss',
					'en-US': 'The user to kiss',
				})
				.setRequired(false),
		)
		.addUserOption((option) =>
			option
				.setName('user4')
				.setNameLocalizations({
					'de': 'benutzer4',
					'en-GB': 'user4',
					'en-US': 'user4',
				})
				.setDescription('The user to kiss')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer den du küssen willst',
					'en-GB': 'The user to kiss',
					'en-US': 'The user to kiss',
				})
				.setRequired(false),
		)
		.addUserOption((option) =>
			option
				.setName('user5')
				.setNameLocalizations({
					'de': 'benutzer5',
					'en-GB': 'user5',
					'en-US': 'user5',
				})
				.setDescription('The user to kiss')
				.setDescriptionLocalizations({
					'de': 'Der Benutzer den du küssen willst',
					'en-GB': 'The user to kiss',
					'en-US': 'The user to kiss',
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
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
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
			let url = `https://g.tenor.com/v1/search?q=kiss%20anime&key=${process.env.TENORTOKEN}&contentfilter=high`;
			let response = await fetch(url);
			let json = await response.json();
			const index = Math.floor(Math.random() * json.results.length);

			return interaction.followUp(`<@${interaction.user.id}> has kissed <@${user.id}>\n${json.results[index].url}`);
		});
	},
};