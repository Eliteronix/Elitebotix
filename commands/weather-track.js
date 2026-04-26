const { DBProcessQueue } = require('../dbObjects');
const weather = require('weather-js');
const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');

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
							{ name: 'Celcius', value: 'C' },
							{ name: 'Fahrenheit', value: 'F' },
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
							{ name: 'Celcius', value: 'C' },
							{ name: 'Fahrenheit', value: 'F' },
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

		if (interaction.options.getSubcommand() === 'list') {
			const trackingList = await DBProcessQueue.findAll({
				attributes: ['additions'],
				where: {
					task: 'periodic-weather',
					additions: {
						[Op.like]: `${interaction.channel.id};%`
					}
				}
			});

			let trackingListString = '';

			for (let i = 0; i < trackingList.length; i++) {
				const args = trackingList[i].additions.split(';');
				trackingListString += `\n\`${args[3]}\` - ${args[1]} in °${args[2]}`;
			}

			return await interaction.editReply(trackingListString || 'No weather tracking tasks found in this channel.');
		} else if (interaction.options.getSubcommand() === 'remove') {
			const trackingList = await DBProcessQueue.findAll({
				attributes: ['id', 'additions'],
				where: {
					task: 'periodic-weather',
				}
			});

			let degreeType = interaction.options.getString('unit');
			let location = interaction.options.getString('location').toLowerCase();

			for (let i = 0; i < trackingList.length; i++) {
				let args = trackingList[i].additions.split(';');
				let trackedLocation = (args[3] || '').toLowerCase();

				if (args[0] === interaction.channel.id && args[2] === degreeType && trackedLocation === location) {
					trackingList[i].destroy();
					return await interaction.editReply('The specified tracker has been removed.');
				}
			}

			return await interaction.editReply('Couldn\'t find a weather tracker to remove.');
		} else if (interaction.options.getSubcommand() === 'add') {
			let degreeType = interaction.options.getString('unit') || 'C';
			let timePeriod = interaction.options.getString('frequency');
			let location = interaction.options.getString('location');

			weather.find({ search: location, degreeType: degreeType }, async function (err, result) {
				if (err) console.error(err);

				if (!result[0]) {
					return await interaction.editReply(`Could not find location \`${location.replace(/`/g, '')}\``);
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

				const duplicate = await DBProcessQueue.findOne({
					attributes: ['id'],
					where: {
						guildId: 'None',
						task: 'periodic-weather',
						priority: 9,
						additions: `${interaction.channel.id};${timePeriod};${degreeType};${location}`
					}
				});

				if (duplicate) {
					return await interaction.editReply(`The weather for ${location} is already being provided ${timePeriod} in this channel.`);
				}

				if (timePeriod === 'hourly') {
					const dailyDuplicate = await DBProcessQueue.findOne({
						attributes: ['id', 'additions'],
						where: {
							guildId: 'None',
							task: 'periodic-weather',
							priority: 9,
							additions: `${interaction.channel.id};daily;${degreeType};${location}`
						}
					});

					if (dailyDuplicate) {
						dailyDuplicate.additions = `${interaction.channel.id};${timePeriod};${degreeType};${location}`;
						dailyDuplicate.save();

						return await interaction.editReply(`The weather for ${location} will now be provided hourly instead of daily.`);
					}
				} else {
					const hourlyDuplicate = await DBProcessQueue.findOne({
						attributes: ['id', 'additions'],
						where: {
							guildId: 'None',
							task: 'periodic-weather',
							priority: 9,
							additions: `${interaction.channel.id};hourly;${degreeType};${location}`
						}
					});

					if (hourlyDuplicate) {
						hourlyDuplicate.additions = `${interaction.channel.id};${timePeriod};${degreeType};${location}`;
						hourlyDuplicate.save();

						return await interaction.editReply(`The weather for ${location} will now be provided daily instead of hourly.`);
					}
				}

				DBProcessQueue.create({ guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${interaction.channel.id};${timePeriod};${degreeType};${location}`, date: date });

				return await interaction.editReply(`The weather for ${location} will be provided ${timePeriod} in this channel.`);
			});
		}
	},
};