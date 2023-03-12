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
		.addStringOption(option =>
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
		.addStringOption(option =>
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

		let firstName = await getName(interaction, `<@${interaction.user.id}>`);
		let secondName = await getName(interaction, interaction.options.getString('user'));

		if (interaction.options.getString('user2')) {
			firstName = await getName(interaction, interaction.options.getString('user'));
			secondName = await getName(interaction, interaction.options.getString('user2'));
		}

		const compatibility = Math.floor(Math.random() * 100) + 1;

		let data = [];
		data.push(`\`${firstName.replace(/`/g, '')}\` + \`${secondName.replace(/`/g, '')}\``);

		const shipname = `${firstName.substring(0, firstName.length / 2)}${secondName.substring(secondName.length / 2, secondName.length)}`;

		data.push(`Shipping name: \`${shipname.replace(/`/g, '')}\``);
		data.push(`Compatibility: ${compatibility}%`);

		await interaction.editReply(data.join('\n'));
	},
};

async function getName(interaction, argument) {
	let name = argument;

	if (name.replace('!', '').match(/<@\d+>/gm)) {
		let id = name.replace('!', '').replace('<@', '').replace('>', '');

		name = interaction.client.users.fetch(id);

		if (interaction.guild) {
			// TODO: Fetch error handling
			let member = await interaction.guild.members.fetch({ user: [id], time: 300000 });

			member = member.first();

			if (member && member.displayName) {
				name = member.displayName;
			}
		}
	}

	return name;
}