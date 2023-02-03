const Discord = require('discord.js');
const Canvas = require('canvas');
const weather = require('weather-js');
const util = require('util');
const { pause, populateMsgFromInteraction, fitTextOnMiddleCanvas } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { DBDiscordUsers } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'weather',
	description: 'Sends info about the weather of the given location',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('weather')
		.setNameLocalizations({
			'de': 'wetter',
			'en-GB': 'weather',
			'en-US': 'weather',
		})
		.setDescription('Sends info about the weather of the given location')
		.setDescriptionLocalizations({
			'de': 'Sendet Infos über das Wetter des angegebenen Ortes',
			'en-GB': 'Sends info about the weather of the given location',
			'en-US': 'Sends info about the weather of the given location',
		})
		.addStringOption(option =>
			option.setName('location')
				.setNameLocalizations({
					'de': 'ort',
					'en-GB': 'location',
					'en-US': 'location',
				})
				.setDescription('The location name or zip')
				.setDescriptionLocalizations({
					'de': 'Der Ortsname oder die Postleitzahl',
					'en-GB': 'The location name or zip',
					'en-US': 'The location name or zip',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('unit')
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
				.setRequired(false)
				.addChoices(
					{ name: 'celcius', value: 'c' },
					{ name: 'fahrenheit', value: 'f' }
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			try {
				await interaction.deferReply();
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			msg = await populateMsgFromInteraction(interaction);

			args = [];

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				args.push(interaction.options._hoistedOptions[i].value);
			}
		}

		const discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: msg.author.id
			}
		});

		let weatherLocation;
		let degreeType = 'C';
		if (discordUser && discordUser.weatherDegreeType) {
			degreeType = discordUser.weatherDegreeType;
		}

		if (args) {
			for (let i = 0; i < args.length; i++) {
				if (args[i].toLowerCase() === 'f' || args[i].toLowerCase() === 'fahrenheit') {
					degreeType = 'F';
					args.splice(i, 1);
				} else if (args[i].toLowerCase() === 'c' || args[i].toLowerCase() === 'celcius') {
					degreeType = 'C';
					args.splice(i, 1);
				}
			}

			// if any args left, assume it's the location
			if (args.length > 0) {
				weatherLocation = args.join(' ');
			} else {
				if (discordUser && discordUser.weatherLocation) {
					weatherLocation = discordUser.weatherLocation;
				} else {
					if (msg.id) {
						return msg.reply('You must specify a location or set your location');
					}
					return interaction.editReply('You must specify a location or set your location');
				}
			}
		}

		const findWeather = util.promisify(weather.find);

		for (let triesBeforeError = 0; triesBeforeError < 5; triesBeforeError++) {
			try {
				await findWeather({ search: weatherLocation, degreeType: degreeType })
					.then(async (result) => {
						if (!result[0]) {
							triesBeforeError = Infinity;
							if (msg.id) {
								return msg.reply(`Could not find location \`${weatherLocation.replace(/`/g, '')}\``);
							}
							return interaction.editReply(`Could not find location \`${weatherLocation.replace(/`/g, '')}\``);
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
						fitTextOnMiddleCanvas(ctx, `Weather for ${weather.location.name}`, 35, 'comfortaa, sans-serif', 50, canvas.width, 250);

						// Write the weather of the current day
						ctx.font = 'bold 30px comfortaa, sans-serif';
						ctx.textAlign = 'center';
						ctx.fillText(`Data from ${weather.current.day} at ${weather.current.observationtime.substring(0, 5)}`, 375, 150);
						ctx.fillText(`Temp.: ${weather.current.temperature}°${degreeType} | Feels Like: ${weather.current.feelslike}°${degreeType}`, 375, 200);
						ctx.fillText(`Humidity: ${weather.current.humidity}%`, 375, 250);
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
						const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `elitebotix-weather-${weather.location.name}.png` });

						if (msg.id) {
							msg.channel.send({ content: `Weather for ${weather.location.name}`, files: [attachment] });
						} else {
							interaction.editReply({ content: `Weather for ${weather.location.name}`, files: [attachment] });
						}

						return triesBeforeError = Infinity;
					})
					.catch(err => {
						throw err;
					});
			} catch (error) {
				if (error.message === 'ESOCKETTIMEDOUT') {
					await pause(15000);
				} else {
					console.error(error);
					triesBeforeError = Infinity;
				}
			}
		}
	},
};