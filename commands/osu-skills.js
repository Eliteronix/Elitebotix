const Discord = require('discord.js');
const Canvas = require('canvas');
const { CanvasRenderService } = require('chartjs-node-canvas');

module.exports = {
	name: 'osu-skills',
	// aliases: ['os', 'o-s'],
	description: 'Sends an info card about the skills of the specified player',
	usage: '<beatmapID> [username] [username] ... (Use "_" instead of spaces)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		const canvasWidth = 1000;
		const canvasHeight = 500;

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

		//Create Canvas
		const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

		//Get context and load the image
		const ctx = canvas.getContext('2d');

		const background = await Canvas.loadImage('./other/osu-background.png');

		for (let i = 0; i < canvas.height / background.height; i++) {
			for (let j = 0; j < canvas.width / background.width; j++) {
				ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
			}
		}


		const width = 400; //px
		const height = 400; //px
		const canvasRenderService = new CanvasRenderService(width, height);

		(async () => {
			const configuration = {
				type: 'bar',
				data: {
					labels: ['Q1', 'Q2', 'Q3', 'Q4'],
					datasets: [{
						label: 'Users',
						data: [50, 60, 70, 180]
					}]
				}
			};

			const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

			// ctx.drawImage(imageBuffer, 0, 0);
			//Create as an attachment
			// const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'yes.png');
			const attachment = new Discord.MessageAttachment(imageBuffer, 'yes.png');

			await msg.channel.send('!', attachment);
		})();
	},
};
