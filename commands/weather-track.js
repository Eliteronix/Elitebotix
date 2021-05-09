const { DBProcessQueue } = require('../dbObjects');
const weather = require('weather-js');

module.exports = {
	name: 'weather-track',
	// aliases: ['developer', 'donate', 'support'],
	description: 'Sends info about the weather of the given location each time period',
	usage: '[hourly/daily] [F/Fahrenheit] <location/zipcode> | <List> | <remove> <C/F> <location>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		let timePeriod = '';
		if (args[0].toLowerCase() === 'list') {
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

			return msg.channel.send(trackingListString || 'No weather tracking tasks found in this channel.');
		} else if (args[0].toLowerCase() === 'remove') {
			const trackingList = await DBProcessQueue.findAll({
				where: { task: 'periodic-weather' }
			});

			let degreeType = '';

			if (args[1].toLowerCase() === 'c') {
				degreeType = 'C';
			} else if (args[1].toLowerCase() === 'f') {
				degreeType = 'F';
			} else {
				return msg.channel.send('Please specify if it is a tracker in `C` or in `F` as the second argument.');
			}

			for (let i = 0; i < trackingList.length; i++) {
				if (trackingList[i].additions.startsWith(msg.channel.id) && trackingList[i].additions.includes(`;${degreeType};`) && trackingList[i].additions.toLowerCase().includes(`;${args[2].toLowerCase()} ${args[3].toLowerCase()}`)) {
					trackingList[i].destroy();
					return msg.channel.send('The specified tracker has been removed.');
				}
			}

			return msg.channel.send('Couldn\'t find a weather tracker to remove.');
		} else if (args[0].toLowerCase() === 'hourly') {
			timePeriod = 'hourly';
			args.shift();
		} else if (args[0].toLowerCase() === 'daily') {
			timePeriod = 'daily';
			args.shift();
		} else {
			return msg.channel.send('The first argument should declare if it is `hourly` or `daily`.');
		}

		let degreeType = 'C';
		if (args[0].toLowerCase() === 'f' || args[0].toLowerCase() === 'fahrenheit') {
			degreeType = 'F';
			args.shift();
		}

		weather.find({ search: args.join(' '), degreeType: degreeType }, async function (err, result) {
			if (err) console.log(err);

			if (!result[0]) {
				return msg.channel.send(`Could not find location \`${args.join(' ').replace(/`/g, '')}\``);
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
				where: { guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${msg.channel.id};${timePeriod};${degreeType};${result[0].location.name}` }
			});

			if (duplicate) {
				return msg.channel.send(`The weather for ${result[0].location.name} is already being provided ${timePeriod} in this channel.`);
			}

			if (timePeriod === 'hourly') {
				const dailyDuplicate = await DBProcessQueue.findOne({
					where: { guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${msg.channel.id};daily;${degreeType};${result[0].location.name}` }
				});

				if (dailyDuplicate) {
					dailyDuplicate.additions = `${msg.channel.id};${timePeriod};${degreeType};${result[0].location.name}`;
					dailyDuplicate.save();

					return msg.channel.send(`The weather for ${result[0].location.name} will now be provided hourly instead of daily.`);
				}
			} else {
				const hourlyDuplicate = await DBProcessQueue.findOne({
					where: { guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${msg.channel.id};hourly;${degreeType};${result[0].location.name}` }
				});

				if (hourlyDuplicate) {
					hourlyDuplicate.additions = `${msg.channel.id};${timePeriod};${degreeType};${result[0].location.name}`;
					hourlyDuplicate.save();

					return msg.channel.send(`The weather for ${result[0].location.name} will now be provided daily instead of hourly.`);
				}
			}

			DBProcessQueue.create({ guildId: 'None', task: 'periodic-weather', priority: 9, additions: `${msg.channel.id};${timePeriod};${degreeType};${result[0].location.name}`, date: date });

			msg.channel.send(`The weather for ${result[0].location.name} will be provided ${timePeriod} in this channel.`);
		});
	},
};