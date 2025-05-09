const { logBroadcastEval } = require('../config.json');

module.exports = {
	async execute(client, processQueueEntry) {
		// console.log('closePoll');
		let args = processQueueEntry.additions.split(';');

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting processQueueTasks/closePoll.js to shards...');
		}

		client.shard.broadcastEval(async (c, { args }) => {
			const Discord = require('discord.js');
			const Canvas = require('@napi-rs/canvas');
			const { fitTextOnLeftCanvas } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);

			const channel = await c.channels.cache.get(args[0]);

			if (channel) {
				const msg = await channel.messages.fetch({ message: args[1] }).catch(async () => {
					//Nothing
				});

				await msg.delete();

				let reactions = [];
				msg.reactions.cache.each(reaction => reactions.push(reaction));

				let results = [];
				let resultsMaxLength = 0;
				let highestVotes = 0;

				for (let i = 0; i < reactions.length && i < args.length - 3; i++) {
					let result = {
						name: args[3 + i],
						votes: reactions[i].count - 1
					};
					results.push(result);

					if (args[3 + i].length > resultsMaxLength) {
						resultsMaxLength = args[3 + i].length;
					}

					if (reactions[i].count - 1 > highestVotes) {
						highestVotes = reactions[i].count - 1;
					}
				}

				if (args[2].length > resultsMaxLength) {
					resultsMaxLength = args[2].length;
				}

				results.sort((a, b) => b.votes - a.votes);

				const canvasWidth = 200 + 15 * resultsMaxLength;
				let canvasHeight = 100 + results.length * 100;

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
				ctx.fillText(args[2], canvas.width / 2, 50);

				let today = new Date().toLocaleDateString();

				ctx.font = '12px comfortaa, arial';
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'right';
				ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

				for (let i = 0; i < results.length; i++) {
					ctx.fillStyle = 'rgba(128, 216, 255, 0.4)';
					ctx.fillRect(95, 75 + 100 * i, (canvas.width - 190) / highestVotes * results[i].votes, 65);
					ctx.fillStyle = 'rgba(255, 255, 255, 1)';
					ctx.font = 'bold 25px comfortaa, arial';
					ctx.textAlign = 'left';
					ctx.fillText(results[i].name, 100, 100 + 100 * i);
					fitTextOnLeftCanvas(ctx, `${results[i].votes} Vote(s)`, 25, 'comfortaa, arial', 130 + 100 * i, canvas.width - 100, 100);
				}

				//Create as an attachment
				const attachment = new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'vote.png' });

				await msg.channel.send({ content: `Results for: \`${args[2]}\``, files: [attachment] });
			}
		}, { context: { args: args } });
		processQueueEntry.destroy();
	},
};