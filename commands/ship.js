const { getMessageUserDisplayname, populateMsgFromInteraction } = require('../utils.js');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'ship',
	// aliases: ['dice', 'ouo'],
	description: 'Lets you check how compatible two users are.',
	usage: '<@user/name> [@user/name]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	// guildOnly: true,
	args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
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