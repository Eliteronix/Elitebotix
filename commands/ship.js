const { getMessageUserDisplayname, populateMsgFromInteraction } = require('../utils.js');

module.exports = {
	name: 'ship',
	// aliases: ['dice', 'ouo'],
	description: 'Lets you check how compatible two users are.',
	usage: '<@user/name> [@user/name]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	// guildOnly: true,
	args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
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

		if (Math.random() > 0.5) {
			let helperString = firstName;
			firstName = secondName;
			secondName = helperString;
		}

		const shipname = `${firstName.substring(0, firstName.length / 2)}${secondName.substring(secondName.length / 2, secondName.length)}`;

		data.push(`Shipping name: \`${shipname.replace(/`/g, '')}\``);
		data.push(`Compatibility: ${compatibility}%`);

		if (msg.id) {
			return msg.channel.send(data.join('\n'));
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