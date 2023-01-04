
const weather = require('weather-js');
const util = require('util');
const { populateMsgFromInteraction } = require('../utils');
const { Permissions } = require('discord.js');
const { DBDiscordUsers } = require('../dbObjects');

module.exports = {
	name: 'weather-set',
	// aliases: ['developer', 'donate', 'support'],
	description: 'Allows you to set the default degree type/location for the weather command',
	usage: '<F/Fahrenheit/C/Celsius> | <location/zipcode>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	args: false,
	cooldown: 10,
	//noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply('Please use `/weather-set` instead.');
		}

		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.deferReply({ ephemeral: true });

			args = [];

			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: msg.author.id
				}
			});

			if (interaction.options._subcommand === 'unit') {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					args.push(interaction.options._hoistedOptions[i].value);
				}
				if (interaction.options._subcommand === 'unit') {
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

			if (interaction.options._subcommand === 'location') {
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