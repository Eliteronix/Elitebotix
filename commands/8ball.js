const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: '8ball',
	description: 'Answers with a random 8-Ball message',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setNameLocalizations({
			'de': '8ball',
			'en-GB': '8ball',
			'en-US': '8ball'
		})
		.setDescription('Answers with a random 8-Ball message')
		.setDescriptionLocalizations({
			'de': 'Antwortet mit einer zufälligen 8-Ball-Nachricht',
			'en-GB': 'Answers with a random 8-Ball message',
			'en-US': 'Answers with a random 8-Ball message'
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('question')
				.setNameLocalizations({
					'de': 'frage',
					'en-GB': 'question',
					'en-US': 'question'
				})
				.setDescription('The question you want to ask the 8-Ball')
				.setDescriptionLocalizations({
					'de': 'Die Frage, die du dem 8-Ball stellen möchtest',
					'en-GB': 'The question you want to ask the 8-Ball',
					'en-US': 'The question you want to ask the 8-Ball'
				})
				.setRequired(true)
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

		//Create a random 8ball answer to the users message
		let answers = [
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
		return await interaction.editReply(answers[Math.floor(Math.random() * answers.length)]);
	},
};