const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'avatar',
	description: 'Sends the avatar of the selected user',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'misc',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let user = interaction.options.getUser('user');

		if (!user) {
			user = interaction.user;
		}

		const avatar = user.displayAvatarURL({ dynamic: true, size: 4096 });

		const embed = {
			color: 0x0099ff,
			title: `${user.username}'s avatar`,
			image: {
				url: avatar,
			},
		};

		return await interaction.editReply({ embeds: [embed] });
	},
};