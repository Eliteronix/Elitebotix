const { getMessageUserDisplayname, populateMsgFromInteraction } = require('../utils.js');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'ship',
	description: 'Lets you check how compatible two users are.',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('ship')
		.setNameLocalizations({
			'de': 'ship',
			'en-GB': 'ship',
			'en-US': 'ship',
		})
		.setDescription('Lets you check how compatible two users are.')
		.setDescriptionLocalizations({
			'de': 'Lässt dich überprüfen, wie kompatibel zwei Nutzer sind.',
			'en-GB': 'Lets you check how compatible two users are.',
			'en-US': 'Lets you check how compatible two users are.',
		})
		.setDMPermission(true)
		.addUserOption(option =>
			option.setName('user')
				.setNameLocalizations({
					'de': 'nutzer',
					'en-GB': 'user',
					'en-US': 'user',
				})
				.setDescription('The user or name to ship')
				.setDescriptionLocalizations({
					'de': 'Der Nutzer oder Name, zum shippen',
					'en-GB': 'The user or name to ship',
					'en-US': 'The user or name to ship',
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
				.setDescription('The user or name to ship')
				.setDescriptionLocalizations({
					'de': 'Der Nutzer oder Name, zum shippen',
					'en-GB': 'The user or name to ship',
					'en-US': 'The user or name to ship',
				})
				.setRequired(false)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			args = [];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}
		let firstName = await getName(msg, args[0]);
		let secondName = await getName(msg, args[1]);

		if (args.length < 2) {
			firstName = await getName(msg);
			secondName = await getName(msg, args[0]);
		}
		const compatibility = Math.floor(Math.random() * 100) + 1;

		let data = [];
		data.push(`\`${firstName.replace(/`/g, '')}\` + \`${secondName.replace(/`/g, '')}\``);

		const shipname = `${firstName.substring(0, firstName.length / 2)}${secondName.substring(secondName.length / 2, secondName.length)}`;

		data.push(`Shipping name: \`${shipname.replace(/`/g, '')}\``);
		data.push(`Compatibility: ${compatibility}%`);

		if (msg.id) {
			return msg.reply(data.join('\n'));
		}

		interaction.reply(data.join('\n'));
	},
};

async function getName(msg, argument) {
	let name = argument;

	if (argument) {
		let mentions = [];
		msg.mentions.users.each(mention => mentions.push(mention));
		for (let i = 0; i < mentions.length; i++) {
			if (`<@${mentions[i].id}>` === argument || `<@!${mentions[i].id}>` === argument) {
				name = mentions[i].username;
				i = mentions.length;
			}
		}
	} else {
		name = await getMessageUserDisplayname(msg);
	}

	return name;
}