const { populateMsgFromInteraction, getOsuUserServerMode } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'tournament-feed',
	description: 'Toggles receiving new tournament notifications',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 15,
	tags: 'osu',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		msg = await populateMsgFromInteraction(interaction);

		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];

		if (!commandUser) {
			return interaction.editReply('Please use </osu-link connect:1023849632599658496> to connect your osu! account first.');
		}

		if (interaction.options._subcommand === 'togglenotifications') {
			if (commandUser.tournamentPings) {
				commandUser.tournamentPings = false;

				await interaction.editReply('You will no longer receive tournament notifications.');
			} else {
				commandUser.tournamentPings = true;

				await interaction.editReply('You will now receive tournament notifications.');
			}

			return await commandUser.save();
		} else if (interaction.options._subcommand === 'settings') {
			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'gamemode') {
					let gamemode = interaction.options._hoistedOptions[i].value;

					if (gamemode.toLowerCase() === 'all') {
						commandUser.tournamentPingsMode = 'all';
						await commandUser.save();
					} else {
						let modeString = '';

						if (gamemode.toLowerCase().includes('s')) {
							modeString = 's';
						}
						if (gamemode.toLowerCase().includes('t')) {
							modeString = modeString + 't';
						}
						if (gamemode.toLowerCase().includes('c')) {
							modeString = modeString + 'c';
						}
						if (gamemode.toLowerCase().includes('m')) {
							modeString = modeString + 'm';
						}

						if (modeString === '') {
							return await interaction.editReply({ content: `${gamemode} is not a valid input. Use "s/t/c/m" or a combination of them for modes`, ephemeral: true });
						} else {
							commandUser.tournamentPingsMode = modeString;
							await commandUser.save();
						}
					}
				} else if (interaction.options._hoistedOptions[i].name === 'badged') {
					if (interaction.options._hoistedOptions[i].value) {
						commandUser.tournamentPingsBadged = true;
					} else {
						commandUser.tournamentPingsBadged = false;
					}
					await commandUser.save();
				}
			}

			if (!commandUser.tournamentPingsMode) {
				commandUser.tournamentPingsMode = 's';
				await commandUser.save();
			}

			return interaction.editReply(`New current settings:\nOnly Badged: ${commandUser.tournamentPingsBadged}\nGamemodes: ${commandUser.tournamentPingsMode}`);
		}
	},
};