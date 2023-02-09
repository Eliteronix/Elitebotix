const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'time',
	description: 'Sends current time of the given location',
	botPermissions: [PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send messages and link embeds',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('time')
		.setNameLocalizations({
			'de': 'zeit',
			'en-GB': 'time',
			'en-US': 'time',
		})
		.setDescription('Sends current time of the given location')
		.setDescriptionLocalizations({
			'de': 'Sendet die aktuelle Zeit des angegebenen Standorts',
			'en-GB': 'Sends current time of the given location',
			'en-US': 'Sends current time of the given location',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('location')
				.setNameLocalizations({
					'de': 'standort',
					'en-GB': 'location',
					'en-US': 'location',
				})
				.setDescription('The location of which you want to find out the time')
				.setDescriptionLocalizations({
					'de': 'Der Standort, dessen Zeit Sie herausfinden möchten',
					'en-GB': 'The location of which you want to find out the time',
					'en-US': 'The location of which you want to find out the time',
				})
				.setRequired(true)
		),
	async execute(msg, args, interaction) {
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

		let location = interaction.options.getString('location');

		//make a call to find a lat and long of the location
		let url = `http://api.geonames.org/searchJSON?q=${location}&maxRows=1&username=roddy`;
		let response = await fetch(url);
		let json = await response.json();

		//checking if the location exists agreeGe
		if (json.totalResultsCount === 0) {
			//pinge check
			return interaction.followUp(`Couldn't find \`${location.replace(/`/g, '')}\` location. Maybe you've mistyped?`);
		} else {

			let lat = json.geonames[0].lat;
			let lng = json.geonames[0].lng;

			//make a call again to find time itself
			let url2 = `http://api.geonames.org/timezoneJSON?lat=${lat}&lng=${lng}&username=roddy`;
			let response2 = await fetch(url2);
			let json2 = await response2.json();
			let comparedToUTC;

			//Always starting with - by default
			if (json2.gmtOffset >= 0) {
				comparedToUTC = '+' + json2.gmtOffset;
			} else {
				comparedToUTC = json2.gmtOffset;
			}

			//have to do this because .toLocaleString doesnt work with json2.time (because json2.time is a string and not a date format)
			let time = new Date(json2.time);

			const timeEmbed = new Discord.EmbedBuilder();
			timeEmbed.setColor('#7289DA')
				.addFields(
					// eslint-disable-next-line indent
					//return locations without /time		||replace '_' in timezoneId with an empty string			
					{
						name: `Current date and time for ${json2.timezoneId.replace('_', ' ')} timezone`, value: `${time.toLocaleString('en-UK', {
							// some settings for the formatting. Note: seconds CAN NOT be displayed due to limits of api
							weekday: 'long',
							day: 'numeric',
							year: 'numeric',
							month: 'long',
							hour: 'numeric',
							minute: 'numeric',
						})}\nUTC${comparedToUTC}`
					}
				)
				.setTimestamp();

			//send embed
			return interaction.followUp({ embeds: [timeEmbed], ephemeral: false });
		}
	}
};