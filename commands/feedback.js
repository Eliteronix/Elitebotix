const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'feedback',
	description: 'Sends feedback to the dev',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('feedback')
		.setNameLocalizations({
			'de': 'feedback',
			'en-GB': 'feedback',
			'en-US': 'feedback',
		})
		.setDescription('Sends feedback to the devs')
		.setDescriptionLocalizations({
			'de': 'Sende Feedback an die Entwickler',
			'en-GB': 'Sends feedback to the devs',
			'en-US': 'Sends feedback to the devs',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('type')
				.setNameLocalizations({
					'de': 'typ',
					'en-GB': 'type',
					'en-US': 'type',
				})
				.setDescription('The type of feedback')
				.setDescriptionLocalizations({
					'de': 'Der Typ des Feedbacks',
					'en-GB': 'The type of feedback',
					'en-US': 'The type of feedback',
				})
				.setRequired(true)
				.addChoices(
					{ name: 'bug', value: 'bug' },
					{ name: 'feature', value: 'feature' },
					{ name: 'feedback', value: 'feedback' },
					{ name: 'question', value: 'question' },
				)
		)
		.addStringOption(option =>
			option.setName('feedback')
				.setNameLocalizations({
					'de': 'feedback',
					'en-GB': 'feedback',
					'en-US': 'feedback',
				})
				.setDescription('The feedback message')
				.setDescriptionLocalizations({
					'de': 'Die Feedback-Nachricht',
					'en-GB': 'The feedback message',
					'en-US': 'The feedback message',
				})
				.setRequired(true)
				.setMaxLength(200)
		),
	async execute(interaction) {
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

		let type = interaction.options.getString('type');

		let message = interaction.options.getString('feedback');

		if (type === 'bug') {
			createJiraIssue('10006', `[BUG] ${message} - ${interaction.user.username}#${interaction.user.discriminator}`);

			return await interaction.editReply('Your bug report was sent to the developers.');
		} else if (type === 'feature') {
			createJiraIssue('10007', `[FEATURE] ${message} - ${interaction.user.username}#${interaction.user.discriminator}`);

			return await interaction.editReply('Your feature-request was sent to the developers.');
		} else if (type === 'feedback') {
			createJiraIssue('10005', `[FEEDBACK] ${message} - ${interaction.user.username}#${interaction.user.discriminator}`);

			return await interaction.editReply('Your feedback has been sent to the developers.');
		} else if (type === 'question') {
			createJiraIssue('10008', `[QUESTION] ${message} - ${interaction.user.username}#${interaction.user.discriminator}`);

			return await interaction.editReply('Your question has been sent to the developers. They will respond to you as soon as possible.');
		}
	},
};

async function createJiraIssue(issuetypeId, text) {
	const bodyData = `{
		"fields": {
		   "project":
		   {
			  "id": "10000"
		   },
		   "summary": "${text}",
		   "description": "${text}",
		   "issuetype": {
			  "id": "${issuetypeId}"
		   }
	   }
	}`;

	fetch('https://eliteronix.atlassian.net/rest/api/2/issue/', {
		method: 'POST',
		headers: {
			'Authorization': `Basic ${Buffer.from(
				`zimmermann.mariomarvin@gmail.com:${process.env.ATLASSIANTOKEN}`
			).toString('base64')}`,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: bodyData
	})
		.catch(err => console.error(err));
}