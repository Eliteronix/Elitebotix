const Discord = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { developers, logBroadcastEval } = require('../config.json');

module.exports = {
	name: 'changelog',
	description: 'Sends a message with the bots server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'debug',
	// eslint-disable-next-line no-unused-vars
	async execute(interaction, msg, args) {
		if (developers.includes(msg.author.id)) {
			const argString = args.join(' ');
			let argArray = argString.split('<|>');
			const canvasHeight = parseInt(argArray.shift());
			const title = argArray.shift();

			const canvasWidth = 1000;

			//Create Canvas
			const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

			Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');
			Canvas.GlobalFonts.registerFromPath('./other/arial unicode ms.otf', 'arial');

			//Get context and load the image
			const ctx = canvas.getContext('2d');

			const background = await Canvas.loadImage('./other/discord-background.png');

			for (let i = 0; i < canvas.height / background.height; i++) {
				for (let j = 0; j < canvas.width / background.width; j++) {
					ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
				}
			}

			// Write the title of the changelog
			ctx.font = 'bold 35px comfortaa, arial';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.fillText(title, canvas.width / 2, 50);

			let today = new Date().toLocaleDateString();

			ctx.font = '12px comfortaa, arial';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'right';
			ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

			ctx.font = 'bold 25px comfortaa, arial';
			ctx.textAlign = 'left';
			ctx.fillText(argArray[0], 100, 150);


			//Create as an attachment
			const attachment = new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'elitebotix-changelog.png' });

			if (process.env.SERVER === 'Dev' || process.env.SERVER === 'QA') {
				msg.reply({ content: `**Elitebotix has been updated** - Please report any bugs by using </feedback:${msg.client.slashCommandData.find(command => command.name === 'feedback').id}>.`, files: [attachment] });
			} else if (process.env.SERVER === 'Live') {
				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting commands/changelog.js to shards...');
				}

				msg.client.shard.broadcastEval(async (c, { args }) => {
					const changelogChannel = await c.channels.cache.get('804658828883787784');
					if (changelogChannel) {
						const argString = args.join(' ');
						let argArray = argString.split('<|>');
						const canvasHeight = parseInt(argArray.shift());
						const title = argArray.shift();

						const canvasWidth = 1000;

						//Create Canvas
						const Canvas = require('@napi-rs/canvas');
						const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

						Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');

						//Get context and load the image
						const ctx = canvas.getContext('2d');

						const background = await Canvas.loadImage('./other/discord-background.png');

						for (let i = 0; i < canvas.height / background.height; i++) {
							for (let j = 0; j < canvas.width / background.width; j++) {
								ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
							}
						}

						// Write the title of the changelog
						ctx.font = 'bold 35px comfortaa, arial';
						ctx.fillStyle = '#ffffff';
						ctx.textAlign = 'center';
						ctx.fillText(title, canvas.width / 2, 50);

						let today = new Date().toLocaleDateString();

						ctx.font = '12px comfortaa, arial';
						ctx.fillStyle = '#ffffff';
						ctx.textAlign = 'right';
						ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

						ctx.font = 'bold 25px comfortaa, arial';
						ctx.textAlign = 'left';
						ctx.fillText(argArray[0], 100, 150);

						//Create as an attachment
						const Discord = require('discord.js');
						const attachment = new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'elitebotix-changelog.png' });

						let sentMessage = await changelogChannel.send({ content: `**Elitebotix has been updated** - Please report any bugs by using </feedback:${c.slashCommandData.find(command => command.name === 'feedback').id}>.`, files: [attachment] });
						sentMessage.crosspost();
					}
				}, { context: { args: args } });
			}
		}
	},
};