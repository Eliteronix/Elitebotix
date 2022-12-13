const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'feedback',
	//aliases: ['developer'],
	description: 'Sends feedback to the dev',
	usage: '<bug/feature/feedback/question> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let type = interaction.options.getString('type');

		let message = interaction.options.getString('feedback');

		if (message.length > 200) {
			return interaction.editReply(`Your message is too long. Please shorten it. (Max: 200 characters, currently: ${message.length})`);
		}

		if (type === 'bug') {
			createJiraIssue('10006', `[BUG] ${message} - ${interaction.user.username}#${interaction.user.discriminator}`);

			return interaction.editReply('Your bug report was sent to the developers.');
		} else if (type === 'feature') {
			createJiraIssue('10007', `[FEATURE] ${message} - ${interaction.user.username}#${interaction.user.discriminator}`);

			return interaction.editReply('Your feature-request was sent to the developers.');
		} else if (type === 'feedback') {
			createJiraIssue('10005', `[FEEDBACK] ${message} - ${interaction.user.username}#${interaction.user.discriminator}`);

			return interaction.editReply('Your feedback has been sent to the developers.');
		} else if (type === 'question') {
			createJiraIssue('10008', `[QUESTION] ${message} - ${interaction.user.username}#${interaction.user.discriminator}`);

			return interaction.editReply('Your question has been sent to the developers. They will respond to you as soon as possible.');
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
			// eslint-disable-next-line no-undef
			'Authorization': `Basic ${Buffer.from(
				// eslint-disable-next-line no-undef
				`zimmermann.mariomarvin@gmail.com:${process.env.ATLASSIANTOKEN}`
			).toString('base64')}`,
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: bodyData
	})
		.catch(err => console.error(err));
}