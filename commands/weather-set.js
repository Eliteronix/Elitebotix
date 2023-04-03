
const weather = require('weather-js');
const util = require('util');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { DBDiscordUsers } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'weather-set',
	description: 'Allows you to set the default degree type/location for the weather command',
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 10,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('weather-set')
		.setNameLocalizations({
			'de': 'wetter-setzen',
			'en-GB': 'weather-set',
			'en-US': 'weather-set',
		})
		.setDescription('Allows you to set the default degree type/location for the weather command')
		.setDescriptionLocalizations({
			'de': 'Ermöglicht es, die Standardeinheit-/Standortangabe für den Wetterbefehl festzulegen',
			'en-GB': 'Allows you to set the default degree type/location for the weather command',
			'en-US': 'Allows you to set the default degree type/location for the weather command',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('location')
				.setNameLocalizations({
					'de': 'standort',
					'en-GB': 'location',
					'en-US': 'location',
				})
				.setDescription('The location name or zip')
				.setDescriptionLocalizations({
					'de': 'Der Standortname oder die Postleitzahl',
					'en-GB': 'The location name or zip',
					'en-US': 'The location name or zip',
				})
				.addStringOption(option =>
					option
						.setName('location')
						.setNameLocalizations({
							'de': 'standort',
							'en-GB': 'location',
							'en-US': 'location',
						})
						.setDescription('The location name or zip')
						.setDescriptionLocalizations({
							'de': 'Der Standortname oder die Postleitzahl',
							'en-GB': 'The location name or zip',
							'en-US': 'The location name or zip',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('unit')
				.setNameLocalizations({
					'de': 'einheit',
					'en-GB': 'unit',
					'en-US': 'unit',
				})
				.setDescription('The unit that should be used')
				.setDescriptionLocalizations({
					'de': 'Die Einheit, die verwendet werden soll',
					'en-GB': 'The unit that should be used',
					'en-US': 'The unit that should be used',
				})
				.addStringOption(option =>
					option
						.setName('unit')
						.setNameLocalizations({
							'de': 'einheit',
							'en-GB': 'unit',
							'en-US': 'unit',
						})
						.setDescription('The unit that should be used')
						.setDescriptionLocalizations({
							'de': 'Die Einheit, die verwendet werden soll',
							'en-GB': 'The unit that should be used',
							'en-US': 'The unit that should be used',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Celcius', value: 'c' },
							{ name: 'Fahrenheit', value: 'f' },
						)
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		if (msg) {
			return msg.reply('Please use `/weather-set` instead.');
		}

		if (interaction) {
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

			args = [];

			logDatabaseQueries(4, 'commands/weather-set.js DBDiscordUsers');
			const discordUser = await DBDiscordUsers.findOne({
				attributes: ['id', 'weatherDegreeType', 'weatherLocation'],
				where: {
					userId: msg.author.id
				}
			});

			if (interaction.options.getSubcommand() === 'unit') {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					args.push(interaction.options._hoistedOptions[i].value);
				}
				if (interaction.options.getSubcommand() === 'unit') {
					// set default degree type to fahrenheit
					if (args[0] === 'f') {
						if (discordUser) {
							discordUser.weatherDegreeType = 'F';
							discordUser.save();
						}

						return interaction.editReply('Set weather degree type to `Fahrenheit`');
						// set default degree type to celcius

					} else if (args[0] == 'c') {
						if (discordUser) {
							discordUser.weatherDegreeType = 'C';
							discordUser.save();
						}

						return interaction.editReply('Set weather degree type to `Celsius`');
					}
				}

			}

			if (interaction.options.getSubcommand() === 'location') {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					args.push(interaction.options._hoistedOptions[i].value);
				}
				const findWeather = util.promisify(weather.find);

				for (let triesBeforeError = 0; triesBeforeError < 5; triesBeforeError++) {
					try {
						await findWeather({ search: args[0], degreeType: 'C' })
							.then(async (result) => {
								if (!result[0]) {
									triesBeforeError = Infinity;

									return interaction.editReply(`Could not find location \`${args.join(' ').replace(/`/g, '')}\``);
								}

								let weatherLocation = result[0].location.name;

								if (discordUser) {
									discordUser.weatherLocation = weatherLocation;
									discordUser.save();
								}

								interaction.editReply(`Set weather location to \`${weatherLocation}\``);


							}).catch(err => {
								throw err;
							});
					} catch (error) {
						console.error(error);
					}
					return triesBeforeError = Infinity;
				}
			}
		}
	}
};