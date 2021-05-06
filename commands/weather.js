const Discord = require('discord.js');
const Canvas = require('canvas');
const weather = require('weather-js');

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
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		let degreeType = 'C';
		if (args[0].toLowerCase() === 'f' || args[0].toLowerCase() === 'fahrenheit') {
			degreeType = 'F';
			args.shift();
		}

		weather.find({ search: args.join(' '), degreeType: degreeType }, async function (err, result) {
			if (err) console.log(err);

			const weather = result[0];

			console.log(weather);

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

			// Write the title of the changelog
			ctx.font = 'bold 35px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.fillText(`Weather for ${weather.location.name}`, canvas.width / 2, 50);

			let today = new Date().toLocaleDateString();

			ctx.font = '12px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText(`Lat: ${weather.location.lat} | Long: ${weather.location.long}`, 5, canvas.height - 5);
			ctx.textAlign = 'right';
			ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

			// ctx.font = 'bold 25px comfortaa, sans-serif';
			// ctx.textAlign = 'left';
			// ctx.fillText(argArray[0], 100, 150);


			//Create as an attachment
			const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'elitebotix-changelog.png');

			msg.channel.send('**Elitebotix has been updated** - Please report any bugs by using `e!feedback bug <Description>`.', attachment);
		});
	},
};