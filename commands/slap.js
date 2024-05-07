const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'slap',
	description: 'Lets you send a gif to slap a user.',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('slap')
		.setNameLocalizations({
			'de': 'klatschen',
			'en-GB': 'slap',
			'en-US': 'slap',
		})
		.setDescription('Lets you send a gif to slap a user.')
		.setDescriptionLocalizations({
			'de': 'Lässt dich einen Gif schicken, um einen Nutzer eine zu klatschen.',
			'en-GB': 'Lets you send a gif to slap a user.',
			'en-US': 'Lets you send a gif to slap a user.',
		})
		.setDMPermission(false)
		.addUserOption(option =>
			option.setName('user')
				.setNameLocalizations({
					'de': 'nutzer',
					'en-GB': 'user',
					'en-US': 'user',
				})
				.setDescription('The user to slap.')
				.setDescriptionLocalizations({
					'de': 'Der Nutzer, dem du eine klatschen willst.',
					'en-GB': 'The user to slap.',
					'en-US': 'The user to slap.',
				})
				.setRequired(true)
		)
		.addUserOption(option =>
			option.setName('user2')
				.setNameLocalizations({
					'de': 'nutzer2',
					'en-GB': 'user2',
					'en-US': 'user2',
				})
				.setDescription('The user to slap.')
				.setDescriptionLocalizations({
					'de': 'Der Nutzer, dem du eine klatschen willst.',
					'en-GB': 'The user to slap.',
					'en-US': 'The user to slap.',
				})
				.setRequired(false)
		)
		.addUserOption(option =>
			option.setName('user3')
				.setNameLocalizations({
					'de': 'nutzer3',
					'en-GB': 'user3',
					'en-US': 'user3',
				})
				.setDescription('The user to slap.')
				.setDescriptionLocalizations({
					'de': 'Der Nutzer, dem du eine klatschen willst.',
					'en-GB': 'The user to slap.',
					'en-US': 'The user to slap.',
				})
				.setRequired(false)
		)
		.addUserOption(option =>
			option.setName('user4')
				.setNameLocalizations({
					'de': 'nutzer4',
					'en-GB': 'user4',
					'en-US': 'user4',
				})
				.setDescription('The user to slap.')
				.setDescriptionLocalizations({
					'de': 'Der Nutzer, dem du eine klatschen willst.',
					'en-GB': 'The user to slap.',
					'en-US': 'The user to slap.',
				})
				.setRequired(false)
		)
		.addUserOption(option =>
			option.setName('user5')
				.setNameLocalizations({
					'de': 'nutzer5',
					'en-GB': 'user5',
					'en-US': 'user5',
				})
				.setDescription('The user to slap.')
				.setDescriptionLocalizations({
					'de': 'Der Nutzer, dem du eine klatschen willst.',
					'en-GB': 'The user to slap.',
					'en-US': 'The user to slap.',
				})
				.setRequired(false)
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
			let url = `https://g.tenor.com/v1/search?q=slap%20anime&key=${process.env.TENORTOKEN}&contentfilter=high`;
			let response = await fetch(url);
			let json = await response.json();
			const index = Math.floor(Math.random() * json.results.length);

			return interaction.followUp(`<@${interaction.user.id}> has slapped <@${user.id}>\n${json.results[index].url}`);
		});
	},
};