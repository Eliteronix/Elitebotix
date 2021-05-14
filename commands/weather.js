const Discord = require('discord.js');
const Canvas = require('canvas');
const weather = require('weather-js');
const util = require('util');
const { pause } = require('../utils');

module.exports = {
	name: 'weather',
	// aliases: ['developer', 'donate', 'support'],
	description: 'Sends info about the weather of the given location',
	usage: '[F/Fahrenheit] <location/zipcode>',
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
	async execute(msg, args) {
		let degreeType = 'C';
		if (args[0].toLowerCase() === 'f' || args[0].toLowerCase() === 'fahrenheit') {
			degreeType = 'F';
			args.shift();
		}

		const findWeather = util.promisify(weather.find);

		for (let triesBeforeError = 0; triesBeforeError < 5; triesBeforeError++) {
			try {
				await findWeather({ search: args.join(' '), degreeType: degreeType })
					.then(async (result) => {
						if (!result[0]) {
							return msg.channel.send(`Could not find location \`${args.join(' ').replace(/`/g, '')}\``);
						}

						const weather = result[0];

						const canvasHeight = 500;
						const canvasWidth = 1000;

						//Create Canvas
						const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

						Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

						//Get context and load the image
						const ctx = canvas.getContext('2d');

						const background = await Canvas.loadImage('./other/discord-background.png');

						for (let i = 0; i < canvas.height / background.height; i++) {
							for (let j = 0; j < canvas.width / background.width; j++) {
								ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
							}
						}

						// Write the title
						ctx.font = 'bold 35px comfortaa, sans-serif';
						ctx.fillStyle = '#ffffff';
						ctx.textAlign = 'center';
						ctx.fillText(`Weather for ${weather.location.name}`, canvas.width / 2, 50);

						// Write the weather of the current day
						ctx.font = 'bold 30px comfortaa, sans-serif';
						ctx.textAlign = 'center';
						ctx.fillText(`Data from ${weather.current.day} at ${weather.current.observationtime.substring(0, 5)}`, 375, 150);
						ctx.fillText(`Temp.: ${weather.current.temperature}°${degreeType} | Feels Like: ${weather.current.feelslike}°${degreeType}`, 375, 200);
						ctx.fillText(`Humidity: ${weather.current.humidity}`, 375, 250);
						ctx.fillText(`Wind: ${weather.current.winddisplay}`, 375, 300);
						ctx.font = 'bold 25px comfortaa, sans-serif';
						ctx.fillText(`Forecast for today: ${weather.forecast[1].skytextday}`, 375, 390);
						ctx.fillText(`${weather.forecast[2].low} - ${weather.forecast[2].high}°${degreeType} | ${weather.forecast[2].precip}% Rain`, 375, 425);

						// Write the forecast
						ctx.font = 'bold 25px comfortaa, sans-serif';
						ctx.textAlign = 'left';
						ctx.fillText('3-Day Forecast:', 725, 100);
						ctx.fillText(`${weather.forecast[2].day}:`, 725, 150);
						ctx.fillText(`${weather.forecast[2].skytextday}`, 725, 185);
						ctx.fillText(`${weather.forecast[2].low} - ${weather.forecast[2].high}°${degreeType} | ${weather.forecast[2].precip}% Rain`, 725, 220);
						ctx.fillText(`${weather.forecast[3].day}:`, 725, 270);
						ctx.fillText(`${weather.forecast[3].skytextday}`, 725, 305);
						ctx.fillText(`${weather.forecast[3].low} - ${weather.forecast[3].high}°${degreeType} | ${weather.forecast[3].precip}% Rain`, 725, 340);
						ctx.fillText(`${weather.forecast[4].day}:`, 725, 390);
						ctx.fillText(`${weather.forecast[4].skytextday}`, 725, 425);
						ctx.fillText(`${weather.forecast[4].low} - ${weather.forecast[4].high}°${degreeType} | ${weather.forecast[4].precip}% Rain`, 725, 460);

						let today = new Date().toLocaleDateString();

						ctx.font = '12px comfortaa, sans-serif';
						ctx.fillStyle = '#ffffff';
						ctx.textAlign = 'left';
						ctx.fillText(`Lat.: ${weather.location.lat} | Long.: ${weather.location.long}`, 5, canvas.height - 5);
						ctx.textAlign = 'right';
						ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);


						//Get a circle in the middle for inserting the map background
						ctx.beginPath();
						ctx.arc(75, 75, 50, 0, Math.PI * 2, true);
						ctx.closePath();
						ctx.clip();

						//Draw a shape onto the main canvas in the top left
						const weatherPic = await Canvas.loadImage(weather.current.imageUrl);
						ctx.drawImage(weatherPic, 25, 25, 100, 100);

						//Create as an attachment
						const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'elitebotix-changelog.png');

						msg.channel.send(`Weather for ${weather.location.name}`, attachment);

						return triesBeforeError = Infinity;
					})
					.catch(err => {
						throw err;
					});
			} catch (error) {
				if (error.message === 'ESOCKETTIMEDOUT') {
					await pause(15000);
				} else {
					console.log(error);
					triesBeforeError = Infinity;
				}
			}
		}
	},
};