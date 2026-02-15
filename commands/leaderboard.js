const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'leaderboard',
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	botPermissions: [PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 60,
	tags: 'general',
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setNameLocalizations({
			'de': 'rangliste',
			'en-GB': 'leaderboard',
			'en-US': 'leaderboard',
		})
		.setDescription('Sends a leaderboard of all the players in the guild that have their account connected')
		.setDescriptionLocalizations({
			'de': 'Sende eine Rangliste aller Spieler in dem Server, die ihr Konto verbunden haben',
			'en-GB': 'Sends a leaderboard of all the players in the guild that have their account connected',
			'en-US': 'Sends a leaderboard of all the players in the guild that have their account connected',
		})
		.setDMPermission(false)
		.addStringOption(option =>
			option.setName('type')
				.setNameLocalizations({
					'de': 'typ',
					'en-GB': 'type',
					'en-US': 'type',
				})
				.setDescription('Sends a leaderboard of all the players in the guild that have their account connected')
				.setDescriptionLocalizations({
					'de': 'Sende eine Rangliste aller Spieler in dem Server, die ihr Konto verbunden haben',
					'en-GB': 'Sends a leaderboard of all the players in the guild that have their account connected',
					'en-US': 'Sends a leaderboard of all the players in the guild that have their account connected',
				})
				.setRequired(true)
				.addChoices(
					{ name: 'server', value: 'server' },
					{ name: 'osu!', value: 'osu' },
				)
		)
		.addIntegerOption(option =>
			option.setName('page')
				.setNameLocalizations({
					'de': 'seite',
					'en-GB': 'page',
					'en-US': 'page',
				})
				.setDescription('The page of the leaderboard to display')
				.setDescriptionLocalizations({
					'de': 'Die Seite der Rangliste, die angezeigt werden soll',
					'en-GB': 'The page of the leaderboard to display',
					'en-US': 'The page of the leaderboard to display',
				})
				.setRequired(false)
				.setMinValue(1)
		)
		.addStringOption(option =>
			option.setName('mode')
				.setNameLocalizations({
					'de': 'modus',
					'en-GB': 'mode',
					'en-US': 'mode',
				})
				.setDescription('The osu! mode')
				.setDescriptionLocalizations({
					'de': 'Der osu! Modus',
					'en-GB': 'The osu! mode',
					'en-US': 'The osu! mode',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'standard', value: '--s' },
					{ name: 'taiko', value: '--t' },
					{ name: 'catch', value: '--c' },
					{ name: 'mania', value: '--m' },
				)
		),
	async execute(interaction) {
		let type = interaction.options.getString('type');

		let command;
		if (type === 'osu') {
			command = require('./osu-leaderboard.js');
		} else if (type === 'guild' || type === 'server') {
			command = require('./guild-leaderboard.js');
		}

		process.send(`command ${command.name}`);

		command.execute(interaction);
	},
};