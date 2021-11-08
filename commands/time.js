const fetch = require('node-fetch');
const Discord = require('discord.js');
const { populateMsgFromInteraction } = require('../utils');
module.exports = {
	name: 'time',
	aliases: ['localtime', 'donate', 'support'],
	description: 'Sends current time of the given location',
	usage: '<location>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		//Multiple requests Tomorrow
		//Code optimization as well
		//make a call to find a lat and long of the location
		// eslint-disable-next-line no-undef
		const timeEmbed = new Discord.MessageEmbed();

		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);
			args = [];
			args.push(interaction.options._hoistedOptions[0].value);
			await interaction.reply('Locations are being processed');
		}

		//getting Latitude and longtitude 
		let url = `http://api.geonames.org/searchJSON?q=${args}&maxRows=1&username=roddy`;
		let response = await fetch(url);
		let json = await response.json();

		//checking if the location exists agreeGe
		if (json.totalResultsCount === 0) {
			//pinge check
			if (msg.id) {
				return msg.reply(`Couldn't find \`${args.join(' ').replace(/`/g, '')}\` location. Maybe you've mistyped?`);	
			} return interaction.followUp(`Couldn't find \`${args.join(' ').replace(/`/g, '')}\` location. Maybe you've mistyped?`);
		}else {

			let lat = json.geonames[0].lat;
			let lng = json.geonames[0].lng;

			//make a call again to find time itself
			let url2 = `http://api.geonames.org/timezoneJSON?lat=${lat}&lng=${lng}&username=roddy`;
			let response2 = await fetch(url2);
			let json2 = await response2.json();
			let comparedToUTC;
			if (json2.gmtOffset>=0){
				comparedToUTC = '+' + json2.gmtOffset;
			} else {
				comparedToUTC = json2.gmtOffset;
			}
			//have to do this because .toLocaleString doesnt work with json2.time (because json2.time is a string and not a date format)
			let time = new Date(json2.time);

			timeEmbed.setColor('#7289DA')
				.addFields(
					// eslint-disable-next-line indent
														//return locations without e!time		||replace '_' in timezoneId with an empty string			
					{ name: `Current date and time for  (${json2.timezoneId.replace('_',' ')} timezone) is`, value: `${time.toLocaleString('en-UK', {
						// some settings for the formatting. Note: seconds CAN NOT be displayed due to limits of api
						weekday: 'long', 
						day: 'numeric', 
						year: 'numeric', 
						month: 'long',
						hour: 'numeric',
						minute: 'numeric', 
					})
					}\nUTC${comparedToUTC}`}
				)   
				.setTimestamp();
			//send embed
			if (msg.id) {
				return msg.reply({ embeds: [timeEmbed] });
			}	return interaction.followUp({ embeds: [timeEmbed], ephemeral: false });
		}
	}
};