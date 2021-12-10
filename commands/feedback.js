const { getGuildPrefix, populateMsgFromInteraction } = require('../utils');
const fetch = require('node-fetch');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'feedback',
	//aliases: ['developer'],
	description: 'Sends feedback to the dev',
	usage: '<bug/feature/feedback> <description>',
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
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			args = [interaction.options._hoistedOptions[0].value];
			interaction.options._hoistedOptions[1].value.split(/ +/).forEach(arg => {
				args.push(arg);
			});
		}
		//check for the first argument
		if (args[0].toLowerCase() === 'bug') { //go to bug tree
			if (!args[1]) { //check for second argument
				msg.reply('Please add an explaination to your bug after the command.');
			} else {
				//get rid of the first argument
				args.shift();
				//join the bug in a variable
				const bug = args.join(' ').replace(/"/g, '');

				//Return if the bug is too long
				if (bug.length > 200) {
					if (msg.id) {
						return msg.reply(`Your bug report is too long. Please shorten it. (Max: 200 characters, currently: ${bug.length})`);
					}
					return interaction.reply(`Your bug report is too long. Please shorten it. (Max: 200 characters, currently: ${bug.length})`);
				}
				//send the bug into the correct Channel
				createJiraIssue('10006', `[BUG] ${bug} - ${msg.author.username}#${msg.author.discriminator}`);
				//send a message to the user
				if (msg.id) {
					return msg.reply('Your bug report was sent to the developers.');
				}
				return interaction.reply('Your bug report was sent to the developers.');
			}
		} else if (args[0].toLowerCase() === 'feature') { //go to feature tree
			if (!args[1]) { //check for second argument
				msg.reply('Please add an explaination to your feature-request after the command.');
			} else {
				//get rid of the first argument
				args.shift();
				//join the feature in a variable
				const feature = args.join(' ').replace(/"/g, '');

				//Return if the bug is too long
				if (feature.length > 200) {
					if (msg.id) {
						return msg.reply(`Your feature request is too long. Please shorten it. (Max: 200 characters, currently: ${feature.length})`);
					}
					return interaction.reply(`Your feature request is too long. Please shorten it. (Max: 200 characters, currently: ${feature.length})`);
				}
				//send the feature into the correct Channel
				createJiraIssue('10007', `[FEATURE] ${feature} - ${msg.author.username}#${msg.author.discriminator}`);
				//send a message to the user
				if (msg.id) {
					return msg.reply('Your feature-request was sent to the developers.');
				}
				return interaction.reply('Your feature-request was sent to the developers.');
			}
		} else if (args[0].toLowerCase() === 'feedback') { //go to general tree
			if (!args[1]) { //check for second argument
				msg.reply('Please add some text to your feedback after the command.');
			} else {
				//get rid of the first argument
				args.shift();
				//join the feedback in a variable
				const feedback = args.join(' ').replace(/"/g, '');

				//Return if the bug is too long
				if (feedback.length > 200) {
					if (msg.id) {
						return msg.reply(`Your feedback is too long. Please shorten it. (Max: 200 characters, currently: ${feedback.length})`);
					}
					return interaction.reply(`Your feedback is too long. Please shorten it. (Max: 200 characters, currently: ${feedback.length})`);
				}
				//send the feedback into the correct Channel
				createJiraIssue('10005', `[FEEDBACK] ${feedback} - ${msg.author.username}#${msg.author.discriminator}`);
				//send a message to the user
				if (msg.id) {
					return msg.reply('Your feedback has been sent to the developers.');
				}
				return interaction.reply('Your feedback has been sent to the developers.');
			}
		} else {
			let guildPrefix = await getGuildPrefix(msg);

			msg.reply(`Please add what kind of feedback you want to give. Proper usage: \`${guildPrefix}${this.name} ${this.usage}\``);
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