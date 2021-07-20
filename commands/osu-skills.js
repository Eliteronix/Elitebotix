const Discord = require('discord.js');
const { CanvasRenderService } = require('chartjs-node-canvas');
const { DBOsuMultiScores } = require('../dbObjects');

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

		const width = 400; //px
		const height = 400; //px
		const canvasRenderService = new CanvasRenderService(width, height);

		(async () => {
			const userScores = await DBOsuMultiScores.findAll({
				where: { osuUserId: args[0] }
			});

			if (!userScores.length) {
				return msg.channel.send('No scores found in the database.');
			}

			let oldestDate = new Date();

			userScores.forEach(score => {
				if (oldestDate > score.matchStartDate) {
					oldestDate = score.matchStartDate;
				}
			});

			console.log(oldestDate);

			const DATA_COUNT = userScores.length;
			const labels = [];
			for (let i = 0; i < DATA_COUNT; ++i) {
				labels.push(i.toString());
			}

			const datapoints = [];
			userScores.forEach(score => {
				datapoints.push(score.evaluation);
			});

			const data = {
				labels: labels,
				datasets: [
					{
						label: 'Cubic interpolation',
						data: datapoints,
						borderColor: 'rgb(54, 162, 235)',
						fill: false,
						tension: 0.4
					}
				]
			};

			const configuration = {
				type: 'line',
				data: data,
				options: {
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: 'Chart.js Line Chart - Cubic interpolation mode'
						},
					},
					interaction: {
						intersect: false,
					},
					scales: {
						x: {
							display: true,
							title: {
								display: true
							}
						},
						y: {
							display: true,
							title: {
								display: true,
								text: 'Value'
							},
							suggestedMin: 0,
							suggestedMax: 2
						}
					}
				},
			};

			const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

			// ctx.drawImage(imageBuffer, 0, 0);
			//Create as an attachment
			// const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'yes.png');
			const attachment = new Discord.MessageAttachment(imageBuffer, 'yes.png');

			await msg.channel.send('Automated scheduling', attachment);
		})();
	},
};
