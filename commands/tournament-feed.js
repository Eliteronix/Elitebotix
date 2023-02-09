const { populateMsgFromInteraction, getOsuUserServerMode } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'tournament-feed',
	description: 'Toggles receiving new tournament notifications',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('tournament-feed')
		.setNameLocalizations({
			'de': 'turnier-feed',
			'en-GB': 'tournament-feed',
			'en-US': 'tournament-feed',
		})
		.setDescription('Toggles receiving new tournament notifications')
		.setDescriptionLocalizations({
			'de': 'Schaltet die Empfangung neuer Turnierbenachrichtigungen ein oder aus',
			'en-GB': 'Toggles receiving new tournament notifications',
			'en-US': 'Toggles receiving new tournament notifications',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand.setName('togglenotifications')
				.setNameLocalizations({
					'de': 'benachrichtigungeneinausschalten',
					'en-GB': 'togglenotifications',
					'en-US': 'togglenotifications',
				})
				.setDescription('Toggles receiving notifications')
				.setDescriptionLocalizations({
					'de': 'Schaltet die Empfangung von Benachrichtigungen ein oder aus',
					'en-GB': 'Toggles receiving notifications',
					'en-US': 'Toggles receiving notifications',
				})
		)
		.addSubcommand(subcommand =>
			subcommand.setName('settings')
				.setNameLocalizations({
					'de': 'einstellungen',
					'en-GB': 'settings',
					'en-US': 'settings',
				})
				.setDescription('Update your settings with this command')
				.setDescriptionLocalizations({
					'de': 'Aktualisiere deine Einstellungen mit diesem Befehl',
					'en-GB': 'Update your settings with this command',
					'en-US': 'Update your settings with this command',
				})
				.addStringOption(option =>
					option.setName('gamemode')
						.setNameLocalizations({
							'de': 'spielmodus',
							'en-GB': 'gamemode',
							'en-US': 'gamemode',
						})
						.setDescription('Set to "All" for all gamemodes use "s/t/c/m" or a combination of them for modes')
						.setDescriptionLocalizations({
							'de': 'Setze es auf "All" für alle Spielmodi, benutze "s/t/c/m" oder eine Kombination für bestimmte Modi',
							'en-GB': 'Set to "All" for all gamemodes use "s/t/c/m" or a combination of them for modes',
							'en-US': 'Set to "All" for all gamemodes use "s/t/c/m" or a combination of them for modes',
						})
						.setRequired(false)
				)
				.addBooleanOption(option =>
					option.setName('badged')
						.setNameLocalizations({
							'de': 'badged',
							'en-GB': 'badged',
							'en-US': 'badged',
						})
						.setDescription('Should you only get notifications for badged tournaments')
						.setDescriptionLocalizations({
							'de': 'Solltest du nur Benachrichtigungen für badged Turniere erhalten',
							'en-GB': 'Should you only get notifications for badged tournaments',
							'en-US': 'Should you only get notifications for badged tournaments',
						})
						.setRequired(false)
				)
				.addIntegerOption(option =>
					option.setName('maxrank')
						.setNameLocalizations({
							'de': 'maximaler-rang',
							'en-GB': 'maxrank',
							'en-US': 'maxrank',
						})
						.setDescription('Example: 10000 = tournaments that allow 4 digits to play will not be shown')
						.setDescriptionLocalizations({
							'de': 'Beispiel: 10000 = Turniere, die 4-stellige Spieler zulassen, werden nicht angezeigt',
							'en-GB': 'Example: 10000 = tournaments that allow 4 digits to play will not be shown',
							'en-US': 'Example: 10000 = tournaments that allow 4 digits to play will not be shown',
						})
						.setRequired(false)
				)
		),
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
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];

		if (!commandUser) {
			return interaction.editReply('Please use </osu-link connect:1064502370710605836> to connect your osu! account first.');
		}

		if (interaction.options.getSubcommand() === 'togglenotifications') {
			if (commandUser.tournamentPings) {
				commandUser.tournamentPings = false;

				await interaction.editReply('You will no longer receive tournament notifications.');
			} else {
				commandUser.tournamentPings = true;

				await interaction.editReply('You will now receive tournament notifications.');
			}

			return await commandUser.save();
		} else if (interaction.options.getSubcommand() === 'settings') {
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
				} else if (interaction.options._hoistedOptions[i].name === 'maxrank') {
					let maxRank = interaction.options._hoistedOptions[i].value;

					commandUser.tournamentPingsStartingFrom = maxRank;
					await commandUser.save();
				}
			}

			if (!commandUser.tournamentPingsMode) {
				commandUser.tournamentPingsMode = 's';
				await commandUser.save();
			}

			let maxRank = 1;

			if (commandUser.tournamentPingsStartingFrom) {
				maxRank = commandUser.tournamentPingsStartingFrom;
			}

			return interaction.editReply(`New current settings:\nOnly Badged: ${commandUser.tournamentPingsBadged}\nGamemodes: ${commandUser.tournamentPingsMode}\nMax Rank: ${maxRank}`);
		}
	},
};