const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'time',
	// aliases: ['developer', 'donate', 'support'],
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
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		// eslint-disable-next-line no-undef
		//make a call to find a lat and long of the location
		let url = `http://api.geonames.org/searchJSON?q=${args}&maxRows=1&username=roddy`;
		let response = await fetch(url);
		let json = await response.json();

		//set a latitude and longtitude for the given location
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
		let time = new Date(json2.time);

		const timeEmbed = new Discord.MessageEmbed()
			.setColor('#7289DA')
			.addFields(
				{ name: `Current date and time for ${json2.timezoneId.replace('_',' ')} timezone is`, value: `${time.toLocaleString('en-US', {
					weekday: 'long', // long, short, narrow
					day: 'numeric', // numeric, 2-digit
					year: 'numeric', // numeric, 2-digit
					month: 'long', // numeric, 2-digit, long, short, narrow
					hour: 'numeric', // numeric, 2-digit
					minute: 'numeric', // numeric, 2-digit  
				})
				}\nUTC${comparedToUTC}`}
			)   
			.setTimestamp();

		if (msg.id) {
			return msg.reply({ embeds: [timeEmbed] });
		}
	}
};
