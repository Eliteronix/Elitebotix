const { populateMsgFromInteraction, getOsuUserServerMode } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-bingo',
	// aliases: ['osu-map', 'beatmap-info', 'o-bm'],
	description: 'Allows you to play a bingo match',
	// usage: '<id> [id] [id] ...',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let opponent = null;

		if (interaction.options.getUser('opponent')) {
			opponent = interaction.options.getUser('opponent').id;
		}

		// Get the star rating
		let lowerstarrating = 4;

		if (interaction.options.getNumber('lowerstarrating')) {
			lowerstarrating = interaction.options.getNumber('lowerstarrating');

			if (lowerstarrating < 3) {
				return await interaction.editReply('You can\'t play a match with a star rating lower than 3');
			} else if (lowerstarrating > 10) {
				return await interaction.editReply('You can\'t play a match with a star rating higher than 10');
			}
		}

		let higherstarrating = 7;

		if (interaction.options.getNumber('higherstarrating')) {
			higherstarrating = interaction.options.getNumber('higherstarrating');

			if (higherstarrating < 3) {
				return await interaction.editReply('You can\'t play a match with a star rating lower than 3');
			} else if (higherstarrating > 10) {
				return await interaction.editReply('You can\'t play a match with a star rating higher than 10');
			}
		}

		let requirement = 'A';

		if (interaction.options.getString('requirement')) {
			requirement = interaction.options.getString('requirement');
		}

		msg = await populateMsgFromInteraction(interaction);

		const commandConfig = await getOsuUserServerMode(msg, []);
		const commandUser = commandConfig[0];

		if (!commandUser || !commandUser.osuUserId || !commandUser.osuVerified) {
			return await interaction.editReply('You don\'t have your osu! account connected and verified.\nPlease connect your account by using `/osu-link connect username:<username>`.');
		}

		//Cross check that commandUser.userId, teammates and opponents are all unique
		const allUsers = [commandUser.userId, opponent];
		const uniqueUsers = [...new Set(allUsers)];

		if (allUsers.length !== uniqueUsers.length) {
			return await interaction.editReply('You can\'t play a bingo match with the same user twice');
		}
	},
};