const Discord = require('discord.js');
const Canvas = require('canvas');
const { Chads } = require("../config.json")

module.exports = {
	name: 'changelog',
	//aliases: ['developer'],
	description: 'Sends a message with the bots server',
	usage: 'height<|>title',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (!Chads.includes(msg.author.id)) {
			const argString = args.join(' ');
			let argArray = argString.split('<|>');
			const canvasHeight = parseInt(argArray.shift());
			const title = argArray.shift();

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
			ctx.fillText(title, canvas.width / 2, 50);

			let today = new Date().toLocaleDateString();

			ctx.font = '12px comfortaa, sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'right';
			ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

			ctx.font = 'bold 25px comfortaa, sans-serif';
			ctx.textAlign = 'left';
			ctx.fillText(argArray[0], 100, 150);


			//Create as an attachment
			const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'elitebotix-changelog.png');

			// eslint-disable-next-line no-undef
			if (process.env.SERVER === 'Dev' || process.env.SERVER === 'QA') {
				msg.reply({ content: '**Elitebotix has been updated** - Please report any bugs by using `e!feedback bug <Description>` / `/feedback`.', files: [attachment] });
				// eslint-disable-next-line no-undef
			} else if (process.env.SERVER === 'Live') {
				const changelogChannel = await msg.client.channels.fetch('804658828883787784');
				changelogChannel.send({ content: '**Elitebotix has been updated** - Please report any bugs by using `e!feedback bug <Description>`.', files: [attachment] });
			}
		}
	},
};