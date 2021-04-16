const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'feedback',
	//aliases: ['developer'],
	description: 'Sends feedback to the devs',
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
	async execute(msg, args) {
		//check for the first argument
		if (args[0].toLowerCase() === 'bug') { //go to bug tree
			if (!args[1]) { //check for second argument
				msg.channel.send('Please add an explaination to your bug after the command.');
			} else { //send message in the correct channel
				//declare bug channel
				const bugChannel = msg.client.channels.cache.find(channel => channel.id === '787961689362530364');
				//check if channel was found
				if (bugChannel) {
					//get rid of the first argument
					args.shift();
					//join the bug in a variable
					const bug = args.join(' ');
					//send the bug into the correct Channel
					bugChannel.send(`[BUG] ${bug} - ${msg.author.username}#${msg.author.discriminator}`);
					//send a message to the user
					msg.channel.send('Your bug report was sent to the developers.');
				} else {
					//if no channel found
					msg.channel.send('Your bug report couldn\'t reach the developers. Please contact Eliteronix#4208.');
				}
			}
		} else if (args[0].toLowerCase() === 'feature') { //go to feature tree
			if (!args[1]) { //check for second argument
				msg.channel.send('Please add an explaination to your feature-request after the command.');
			} else { //send message in the correct channel
				//declare feature channel
				const featureChannel = msg.client.channels.cache.find(channel => channel.id === '787961754658537493');
				//check if channel was found
				if (featureChannel) {
					//get rid of the first argument
					args.shift();
					//join the feature in a variable
					const feature = args.join(' ');
					//send the feature into the correct Channel
					featureChannel.send(`[FEATURE] ${feature} - ${msg.author.username}#${msg.author.discriminator}`);
					//send a message to the user
					msg.channel.send('Your feature-request was sent to the developers.');
				} else {
					//if no channel found
					msg.channel.send('Your feature-request couldn\'t reach the developers. Please contact Eliteronix#4208.');
				}
			}
		} else if (args[0].toLowerCase() === 'feedback') { //go to general tree
			if (!args[1]) { //check for second argument
				msg.channel.send('Please add some text to your feedback after the command.');
			} else { //send message in the correct channel
				//declare feedback channel
				const feedbackChannel = msg.client.channels.cache.find(channel => channel.id === '787963756495896576');
				//check if channel was found
				if (feedbackChannel) {
					//get rid of the first argument
					args.shift();
					//join the feedback in a variable
					const feedback = args.join(' ');
					//send the feedback into the correct Channel
					feedbackChannel.send(`[FEEDBACK] ${feedback} - ${msg.author.username}#${msg.author.discriminator}`);
					//send a message to the user
					msg.channel.send('Your feedback was sent to the developers.');
				} else {
					//if no channel found
					msg.channel.send('Your feedback couldn\'t reach the developers. Please contact Eliteronix#4208.');
				}
			}
		} else {
			let guildPrefix = await getGuildPrefix(msg);

			msg.channel.send(`Please add what kind of feedback you want to give. Proper usage: \`${guildPrefix}${this.name} ${this.usage}\``);
		}
	},
};

// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

const bodyData = `{
  "update": {},
  "fields": {
    "summary": "Main order flow broken",
    "parent": {
      "key": "PROJ-123"
    },
    "issuetype": {
      "id": "10000"
    },
    "components": [
      {
        "id": "10000"
      }
    ],
    "customfield_20000": "06/Jul/19 3:25 PM",
    "customfield_40000": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "text": "Occurs on all orders",
              "type": "text"
            }
          ]
        }
      ]
    },
    "customfield_70000": [
      "jira-administrators",
      "jira-software-users"
    ],
    "project": {
      "id": "10000"
    },
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "text": "Order entry fails when selecting supplier.",
              "type": "text"
            }
          ]
        }
      ]
    },
    "reporter": {
      "id": "5b10a2844c20165700ede21g"
    },
    "fixVersions": [
      {
        "id": "10001"
      }
    ],
    "customfield_10000": "09/Jun/19",
    "priority": {
      "id": "20000"
    },
    "labels": [
      "bugfix",
      "blitz_test"
    ],
    "timetracking": {
      "remainingEstimate": "5",
      "originalEstimate": "10"
    },
    "customfield_30000": [
      "10000",
      "10002"
    ],
    "customfield_80000": {
      "value": "red"
    },
    "security": {
      "id": "10000"
    },
    "environment": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "text": "UAT",
              "type": "text"
            }
          ]
        }
      ]
    },
    "versions": [
      {
        "id": "10000"
      }
    ],
    "duedate": "2019-05-11",
    "customfield_60000": "jira-software-users",
    "customfield_50000": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "text": "Could impact day-to-day work.",
              "type": "text"
            }
          ]
        }
      ]
    },
    "assignee": {
      "id": "5b109f2e9729b51b54dc274d"
    }
  }
}`;

fetch('https://your-domain.atlassian.com/rest/api/3/issue', {
	method: 'POST',
	headers: {
		// eslint-disable-next-line no-undef
		'Authorization': `Basic ${Buffer.from(
			'email@example.com:<api_token>'
		).toString('base64')}`,
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	},
	body: bodyData
})
	.then(response => {
		console.log(
			`Response: ${response.status} ${response.statusText}`
		);
		return response.text();
	})
	.then(text => console.log(text))
	.catch(err => console.error(err));