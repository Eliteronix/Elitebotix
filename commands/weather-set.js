
const weather = require('weather-js');
const util = require('util');
const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { DBDiscordUsers } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'weather-set',
	description: 'Allows you to set the default degree type/location for the weather command',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
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
							{ name: 'Celcius', value: 'C' },
							{ name: 'Fahrenheit', value: 'F' },
						)
				)
		),
	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		const discordUser = await DBDiscordUsers.findOne({
			attributes: ['id', 'weatherDegreeType', 'weatherLocation'],
			where: {
				userId: interaction.user.id
			}
		});

		if (interaction.options.getSubcommand() === 'unit') {
			const unit = interaction.options.getString('unit');

			if (discordUser) {
				discordUser.weatherDegreeType = unit;
				await discordUser.save();
			} else {
				await DBDiscordUsers.create({
					userId: interaction.user.id,
					weatherDegreeType: unit
				});
			}

			if (unit === 'F') {
				return await interaction.editReply('Set weather degree type to `Fahrenheit`');
			} else if (unit === 'C') {
				return await interaction.editReply('Set weather degree type to `Celsius`');
			}
		}

		if (interaction.options.getSubcommand() === 'location') {
			const location = interaction.options.getString('location');

			const findWeather = util.promisify(weather.find);

			for (let triesBeforeError = 0; triesBeforeError < 5; triesBeforeError++) {
				try {
					await findWeather({ search: location, degreeType: 'C' })
						.then(async (result) => {
							if (!result[0]) {
								triesBeforeError = Infinity;

								return await interaction.editReply(`Could not find location \`${location.replace(/`/g, '')}\``);
							}

							let weatherLocation = result[0].location.name;

							if (discordUser) {
								discordUser.weatherLocation = weatherLocation;
								await discordUser.save();
							} else {
								await DBDiscordUsers.create({
									userId: interaction.user.id,
									weatherDegreeType: 'C',
									weatherLocation: weatherLocation
								});
							}

							await interaction.editReply(`Set weather location to \`${weatherLocation}\``);
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
};