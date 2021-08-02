const { getGuildPrefix, populateMsgFromInteraction } = require('../utils');
const fetch = require('node-fetch');

module.exports = {
	name: 'feedback',
	//aliases: ['developer'],
	description: 'Sends feedback to the dev',
	usage: '<bug/feature/feedback> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			console.log(interaction.data.options);
			msg = await populateMsgFromInteraction(additionalObjects[0], interaction);

			args = [interaction.data.options[0].value];
			interaction.data.options[1].value.split(/ +/).forEach(arg => {
				args.push(arg);
			});
		}
		//check for the first argument
		if (args[0].toLowerCase() === 'bug') { //go to bug tree
			if (!args[1]) { //check for second argument
				msg.channel.send('Please add an explaination to your bug after the command.');
			} else {
				//get rid of the first argument
				args.shift();
				//join the bug in a variable
				const bug = args.join(' ');
				//send the bug into the correct Channel
				createJiraIssue('10006', `[BUG] ${bug} - ${msg.author.username}#${msg.author.discriminator}`);
				//send a message to the user
				if (msg.id) {
					return msg.channel.send('Your bug report was sent to the developer.');
				}

				return additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
					data: {
						type: 4,
						data: {
							content: 'Your bug report was sent to the developer.'
						}
					}
				});
			}
		} else if (args[0].toLowerCase() === 'feature') { //go to feature tree
			if (!args[1]) { //check for second argument
				msg.channel.send('Please add an explaination to your feature-request after the command.');
			} else {
				//get rid of the first argument
				args.shift();
				//join the feature in a variable
				const feature = args.join(' ');
				//send the feature into the correct Channel
				createJiraIssue('10007', `[FEATURE] ${feature} - ${msg.author.username}#${msg.author.discriminator}`);
				//send a message to the user
				if (msg.id) {
					return msg.channel.send('Your feature-request was sent to the developer.');
				}

				return additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
					data: {
						type: 4,
						data: {
							content: 'Your feature-request was sent to the developer.'
						}
					}
				});
			}
		} else if (args[0].toLowerCase() === 'feedback') { //go to general tree
			if (!args[1]) { //check for second argument
				msg.channel.send('Please add some text to your feedback after the command.');
			} else {
				//get rid of the first argument
				args.shift();
				//join the feedback in a variable
				const feedback = args.join(' ');
				//send the feedback into the correct Channel
				createJiraIssue('10005', `[FEEDBACK] ${feedback} - ${msg.author.username}#${msg.author.discriminator}`);
				//send a message to the user
				if (msg.id) {
					return msg.channel.send('Your feedback has been sent to the developer.');
				}

				return additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
					data: {
						type: 4,
						data: {
							content: 'Your feedback has been sent to the developer.'
						}
					}
				});
			}
		} else {
			let guildPrefix = await getGuildPrefix(msg);

			msg.channel.send(`Please add what kind of feedback you want to give. Proper usage: \`${guildPrefix}${this.name} ${this.usage}\``);
		}
	},
};

async function createJiraIssue(issuetypeID, text) {
	const bodyData = `{
		"fields": {
		   "project":
		   {
			  "id": "10000"
		   },
		   "summary": "${text}",
		   "description": "${text}",
		   "issuetype": {
			  "id": "${issuetypeID}"
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