const { DBProcessQueue } = require('../dbObjects');
const weather = require('weather-js');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'weather-track',
	description: 'Sends info about the weather of the given location each time period',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('weather-track')
		.setNameLocalizations({
			'de': 'wetter-verfolgen',
			'en-GB': 'weather-track',
			'en-US': 'weather-track',
		})
		.setDescription('Sends info about the weather of the given location each time period')
		.setDescriptionLocalizations({
			'de': 'Sendet Informationen zum Wetter des angegebenen Standorts zu jeder Zeitperiode',
			'en-GB': 'Sends info about the weather of the given location each time period',
			'en-US': 'Sends info about the weather of the given location each time period',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setNameLocalizations({
					'de': 'liste',
					'en-GB': 'list',
					'en-US': 'list',
				})
				.setDescription('List the currently tracked locations')
				.setDescriptionLocalizations({
					'de': 'Listet die derzeit verfolgten Standorte auf',
					'en-GB': 'List the currently tracked locations',
					'en-US': 'List the currently tracked locations',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setNameLocalizations({
					'de': 'hinzufügen',
					'en-GB': 'add',
					'en-US': 'add',
				})
				.setDescription('Track a new location')
				.setDescriptionLocalizations({
					'de': 'Verfolgen Sie einen neuen Standort',
					'en-GB': 'Track a new location',
					'en-US': 'Track a new location',
				})
				.addStringOption(option =>
					option
						.setName('location')
						.setNameLocalizations({
							'de': 'standort',
							'en-GB': 'location',
							'en-US': 'location',
						})
						.setDescription('The location or zipcode to track')
						.setDescriptionLocalizations({
							'de': 'Der Ort oder die Postleitzahl, die verfolgt werden soll',
							'en-GB': 'The location or zipcode to track',
							'en-US': 'The location or zipcode to track',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option
						.setName('frequency')
						.setNameLocalizations({
							'de': 'frequenz',
							'en-GB': 'frequency',
							'en-US': 'frequency',
						})
						.setDescription('The tracking frequency')
						.setDescriptionLocalizations({
							'de': 'Die Verfolgungsfrequenz',
							'en-GB': 'The tracking frequency',
							'en-US': 'The tracking frequency',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Daily', value: 'daily' },
							{ name: 'Hourly', value: 'hourly' },
						)
				)
				.addStringOption(option =>
					option
						.setName('unit')
						.setNameLocalizations({
							'de': 'einheit',
							'en-GB': 'unit',
							'en-US': 'unit',
						})
						.setDescription('The unit to use')
						.setDescriptionLocalizations({
							'de': 'Die Einheit, die verwendet werden soll',
							'en-GB': 'The unit to use',
							'en-US': 'The unit to use',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Celcius', value: 'c' },
							{ name: 'Fahrenheit', value: 'f' },
						)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setNameLocalizations({
					'de': 'entfernen',
					'en-GB': 'remove',
					'en-US': 'remove',
				})
				.setDescription('Stop tracking a location')
				.setDescriptionLocalizations({
					'de': 'Verfolgen Sie einen Standort nicht mehr',
					'en-GB': 'Stop tracking a location',
					'en-US': 'Stop tracking a location',
				})
				.addStringOption(option =>
					option
						.setName('unit')
						.setNameLocalizations({
							'de': 'einheit',
							'en-GB': 'unit',
							'en-US': 'unit',
						})
						.setDescription('The tracking unit')
						.setDescriptionLocalizations({
							'de': 'Die Verfolgungseinheit',
							'en-GB': 'The tracking unit',
							'en-US': 'The tracking unit',
						})
						.setRequired(true)
						.addChoices(
							{ name: 'Celcius', value: 'c' },
							{ name: 'Fahrenheit', value: 'f' },
						)
				)
				.addStringOption(option =>
					option
						.setName('location')
						.setNameLocalizations({
							'de': 'standort',
							'en-GB': 'location',
							'en-US': 'location',
						})
						.setDescription('The location or zipcode to track')
						.setDescriptionLocalizations({
							'de': 'Der Ort oder die Postleitzahl, die verfolgt werden soll',
							'en-GB': 'The location or zipcode to track',
							'en-US': 'The location or zipcode to track',
						})
						.setRequired(true)
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
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

			if (interaction.options.getSubcommand() === 'list') {
				args = ['list'];
			} else if (interaction.options.getSubcommand() === 'add') {
				let location = null;
				let frequency = null;
				let unit = null;

				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'location') {
						location = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'frequency') {
						frequency = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'unit') {
						unit = interaction.options._hoistedOptions[i].value;
					}
				}

				args = [frequency, unit, location];

			} else if (interaction.options.getSubcommand() === 'remove') {
				let location = null;
				let unit = null;

				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'location') {
						location = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'unit') {
						unit = interaction.options._hoistedOptions[i].value;
					}
				}

				args = ['remove', unit, location];
			}
		}
		let timePeriod = '';
		if (args[0].toLowerCase() === 'list') {
			logDatabaseQueries(4, 'commands/weather-track.js DBProcessQueue list');
			const trackingList = await DBProcessQueue.findAll({
				where: { task: 'periodic-weather' }
			});

			let trackingListString = '';

			for (let i = 0; i < trackingList.length; i++) {
				if (!trackingList[i].additions.startsWith(msg.channel.id)) {
					trackingList.splice(i, 1);
					i--;
				} else {
					const args = trackingList[i].additions.split(';');
					trackingListString += `\n\`${args[3]}\` - ${args[1]} in °${args[2]}`;
				}
			}

			if (msg.id) {
				return msg.reply(trackingListString || 'No weather tracking tasks found in this channel.');
			}
			return interaction.editReply(trackingListString || 'No weather tracking tasks found in this channel.');
		} else if (args[0].toLowerCase() === 'remove') {
			args.shift();
			logDatabaseQueries(4, 'commands/weather-track.js DBProcessQueue remove');
			const trackingList = await DBProcessQueue.findAll({
				where: { task: 'periodic-weather' }
			});

			let degreeType = '';

			if (args[0].toLowerCase() === 'c') {
				degreeType = 'C';
			} else if (args[0].toLowerCase() === 'f') {
				degreeType = 'F';
			} else {
				return msg.reply('Please specify if it is a tracker in `C` or in `F` as the second argument.');
			}
			args.shift();

			for (let i = 0; i < trackingList.length; i++) {
				if (trackingList[i].additions.startsWith(msg.channel.id) && trackingList[i].additions.includes(`;${degreeType};`) && trackingList[i].additions.endsWith(`;${args.join(' ')}`)) {
					trackingList[i].destroy();
					if (msg.id) {
						return msg.reply('The specified tracker has been removed.');
					}
					return interaction.editReply('The specified tracker has been removed.');
				}
			}
			if (msg.id) {
				return msg.reply('Couldn\'t find a weather tracker to remove.');
			}
			return interaction.editReply('Couldn\'t find a weather tracker to remove.');
		} else if (args[0].toLowerCase() === 'hourly') {
			timePeriod = 'hourly';
			args.shift();
		} else if (args[0].toLowerCase() === 'daily') {
			timePeriod = 'daily';
			args.shift();
		} else {
			return msg.reply('The first argument should declare if it is `hourly` or `daily`.');
		}

		let degreeType = 'C';
		if (args[0].toLowerCase() === 'f' || args[0].toLowerCase() === 'fahrenheit') {
			degreeType = 'F';
			args.shift();
		} else if (args[0].toLowerCase() === 'c' || args[0].toLowerCase() === 'celcius') {
			args.shift();
		}

		weather.find({ search: args.join(' '), degreeType: degreeType }, async function (err, result) {
			if (err) console.error(err);

			if (!result[0]) {
				if (msg.id) {
					return msg.reply(`Could not find location \`${args.join(' ').replace(/`/g, '')}\``);
				}
				return interaction.editReply(`Could not find location \`${args.join(' ').replace(/`/g, '')}\``);
			}

			let date = new Date();

			date.setUTCMinutes(0);
			date.setUTCSeconds(0);
			date.setUTCMilliseconds(0);
			date.setUTCHours(date.getUTCHours() + 1);

			if (timePeriod === 'daily') {
				date.setUTCHours(0);
				date.setUTCDate(date.getUTCDate() + 1);
			}

			logDatabaseQueries(4, 'commands/weather-track.js DBProcessQueue duplicate');
			const duplicate = await DBProcessQueue.findOne({
				where: { guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${msg.channel.id};${timePeriod};${degreeType};${args.join(' ')}` }
			});

			if (duplicate) {
				if (msg.id) {
					return msg.reply(`The weather for ${args.join(' ')} is already being provided ${timePeriod} in this channel.`);
				}
				return interaction.editReply(`The weather for ${args.join(' ')} is already being provided ${timePeriod} in this channel.`);
			}

			if (timePeriod === 'hourly') {
				logDatabaseQueries(4, 'commands/weather-track.js DBProcessQueue dailyDuplicate');
				const dailyDuplicate = await DBProcessQueue.findOne({
					where: { guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${msg.channel.id};daily;${degreeType};${args.join(' ')}` }
				});

				if (dailyDuplicate) {
					dailyDuplicate.additions = `${msg.channel.id};${timePeriod};${degreeType};${args.join(' ')}`;
					dailyDuplicate.save();

					if (msg.id) {
						return msg.reply(`The weather for ${args.join(' ')} will now be provided hourly instead of daily.`);
					}
					return interaction.editReply(`The weather for ${args.join(' ')} will now be provided hourly instead of daily.`);
				}
			} else {
				logDatabaseQueries(4, 'commands/weather-track.js DBProcessQueue hourlyDuplicate');
				const hourlyDuplicate = await DBProcessQueue.findOne({
					where: { guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${msg.channel.id};hourly;${degreeType};${args.join(' ')}` }
				});

				if (hourlyDuplicate) {
					hourlyDuplicate.additions = `${msg.channel.id};${timePeriod};${degreeType};${args.join(' ')}`;
					hourlyDuplicate.save();

					if (msg.id) {
						return msg.reply(`The weather for ${args.join(' ')} will now be provided daily instead of hourly.`);
					}
					return interaction.editReply(`The weather for ${args.join(' ')} will now be provided daily instead of hourly.`);
				}
			}

			logDatabaseQueries(4, 'commands/weather-track.js DBProcessQueue create');
			DBProcessQueue.create({ guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${msg.channel.id};${timePeriod};${degreeType};${args.join(' ')}`, date: date });

			if (msg.id) {
				return msg.reply(`The weather for ${args.join(' ')} will be provided ${timePeriod} in this channel.`);
			}
			return interaction.editReply(`The weather for ${args.join(' ')} will be provided ${timePeriod} in this channel.`);
		});
	},
};