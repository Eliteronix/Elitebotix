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

		const width = 1500; //px
		const height = 750; //px
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

			const rawData = [];
			const labels = [];
			for (let now = new Date(); oldestDate < now; oldestDate.setUTCMonth(oldestDate.getUTCMonth() + 1)) {
				let rawDataObject = {
					label: `${(oldestDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${oldestDate.getUTCFullYear()}`,
					totalEvaluation: 0,
					totalCount: 0,
					NMEvaluation: 0,
					NMCount: 0,
					HDEvaluation: 0,
					HDCount: 0,
					HREvaluation: 0,
					HRCount: 0,
					DTEvaluation: 0,
					DTCount: 0,
					FMEvaluation: 0,
					FMCount: 0
				};
				labels.push(rawDataObject.label);
				rawData.push(rawDataObject);
			}

			userScores.forEach(score => {
				rawData.forEach(rawDataObject => {
					if (rawDataObject.label === `${(score.matchStartDate.getUTCMonth() + 1).toString().padStart(2, '0')}-${score.matchStartDate.getUTCFullYear()}`) {
						rawDataObject.totalEvaluation += parseFloat(score.evaluation);
						rawDataObject.totalCount++;
						if (score.rawMods === '0' && (score.gameRawMods === '0' || score.gameRawMods === '1')) {
							rawDataObject.NMEvaluation += parseFloat(score.evaluation);
							rawDataObject.NMCount++;
						} else if (score.rawMods === '0' && (score.gameRawMods === '8' || score.gameRawMods === '9')) {
							rawDataObject.HDEvaluation += parseFloat(score.evaluation);
							rawDataObject.HDCount++;
						} else if (score.rawMods === '0' && (score.gameRawMods === '16' || score.gameRawMods === '17')) {
							rawDataObject.HREvaluation += parseFloat(score.evaluation);
							rawDataObject.HRCount++;
						} else if (score.rawMods === '0' && (score.gameRawMods === '64' || score.gameRawMods === '65' || score.gameRawMods === '576' || score.gameRawMods === '577')) {
							rawDataObject.DTEvaluation += parseFloat(score.evaluation);
							rawDataObject.DTCount++;
						} else {
							rawDataObject.FMEvaluation += parseFloat(score.evaluation);
							rawDataObject.FMCount++;
						}
					}
				});
			});

			const totalDatapoints = [];
			const NMDatapoints = [];
			const HDDatapoints = [];
			const HRDatapoints = [];
			const DTDatapoints = [];
			const FMDatapoints = [];
			rawData.forEach(rawDataObject => {
				let totalValue = NaN;
				if (rawDataObject.totalCount) {
					totalValue = rawDataObject.totalEvaluation / rawDataObject.totalCount;
				}

				let NMValue = NaN;
				if (rawDataObject.NMCount) {
					NMValue = rawDataObject.NMEvaluation / rawDataObject.NMCount;
					if (args[1] === 'scaled') {
						NMValue = NMValue / totalValue;
					}
				}
				NMDatapoints.push(NMValue);

				let HDValue = NaN;
				if (rawDataObject.HDCount) {
					HDValue = rawDataObject.HDEvaluation / rawDataObject.HDCount;
					if (args[1] === 'scaled') {
						HDValue = HDValue / totalValue;
					}
				}
				HDDatapoints.push(HDValue);

				let HRValue = NaN;
				if (rawDataObject.HRCount) {
					HRValue = rawDataObject.HREvaluation / rawDataObject.HRCount;
					if (args[1] === 'scaled') {
						HRValue = HRValue / totalValue;
					}
				}
				HRDatapoints.push(HRValue);

				let DTValue = NaN;
				if (rawDataObject.DTCount) {
					DTValue = rawDataObject.DTEvaluation / rawDataObject.DTCount;
					if (args[1] === 'scaled') {
						DTValue = DTValue / totalValue;
					}
				}
				DTDatapoints.push(DTValue);

				let FMValue = NaN;
				if (rawDataObject.FMCount) {
					FMValue = rawDataObject.FMEvaluation / rawDataObject.FMCount;
					if (args[1] === 'scaled') {
						FMValue = FMValue / totalValue;
					}
				}
				FMDatapoints.push(FMValue);

				if (args[1] === 'scaled') {
					totalValue = totalValue / totalValue;
				}
				totalDatapoints.push(totalValue);
			});

			for (let i = 0; i < totalDatapoints.length; i++) {
				if (isNaN(totalDatapoints[i])) {
					labels.splice(i, 1);
					totalDatapoints.splice(i, 1);
					NMDatapoints.splice(i, 1);
					HDDatapoints.splice(i, 1);
					HRDatapoints.splice(i, 1);
					DTDatapoints.splice(i, 1);
					FMDatapoints.splice(i, 1);
					i--;
				}
			}

			const data = {
				labels: labels,
				datasets: [
					{
						label: 'Evaluation (All Mods)',
						data: totalDatapoints,
						borderColor: 'rgb(201, 203, 207)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Evaluation (NM only)',
						data: NMDatapoints,
						borderColor: 'rgb(54, 162, 235)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Evaluation (HD only)',
						data: HDDatapoints,
						borderColor: 'rgb(255, 205, 86)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Evaluation (HR only)',
						data: HRDatapoints,
						borderColor: 'rgb(255, 99, 132)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Evaluation (DT only)',
						data: DTDatapoints,
						borderColor: 'rgb(153, 102, 255)',
						fill: false,
						tension: 0.4
					}, {
						label: 'Evaluation (FM only)',
						data: FMDatapoints,
						borderColor: 'rgb(75, 192, 192)',
						fill: false,
						tension: 0.4
					}
				]
			};

			const configuration = {
				type: 'line',
				data: data,
				options: {
					spanGaps: true,
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: 'Elitebotix Evaluation for submitted matches'
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
							suggestedMax: 1.5
						}
					}
				},
			};

			const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

			// ctx.drawImage(imageBuffer, 0, 0);
			//Create as an attachment
			// const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'yes.png');
			const attachment = new Discord.MessageAttachment(imageBuffer, 'yes.png');

			await msg.channel.send(args.join(' '), attachment);
		})();
	},
};
