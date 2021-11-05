const { populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: '8ball',
	//aliases: ['developer'],
	description: 'Answers with a random 8-Ball message',
	usage: '<Question>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);
		}

		//Create a random 8ball answer to the users message
		var answers = [
			'It is certain',
			'It is decidedly so',
			'Without a doubt',
			'Yes definitely',
			'You may rely on it',
			'As I see it, yes',
			'Most likely',
			'Outlook good',
			'Yes',
			'Signs point to yes',
			'Reply hazy try again',
			'Ask again later',
			'Better not tell you now',
			'Cannot predict now',
			'Concentrate and ask again',
			'Don\'t count on it',
			'My reply is no',
			'My sources say no',
			'Outlook not so good',
			'Very doubtful'
		];

		//Send the 8ball answer to the user
		if (msg.id) {
			return msg.reply(answers[Math.floor(Math.random() * answers.length)]);
		}
		return interaction.reply(answers[Math.floor(Math.random() * answers.length)]);
	},
};