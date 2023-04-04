const { DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');
const { Op } = require('sequelize');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
	name: 'ratingDistribution',
	usage: '<minRank> <maxRank>',
	async execute(interaction) {
		const args = interaction.options.getString('argument').split(' ');

		logDatabaseQueries(4, 'commands/admin/medianRating.js DBDiscordUsers medianRating');
		let discordUsers = await DBDiscordUsers.findAll({
			attributes: ['osuDuelStarRating', 'osuRank'],
			where: {
				osuUserId: {
					[Op.gt]: 0
				},
				osuPP: {
					[Op.gt]: 0
				},
				osuDuelStarRating: {
					[Op.gt]: 0
				},
				osuDuelProvisional: {
					[Op.not]: true,
				}
			}
		});

		let validUsers = discordUsers.filter(discordUser => {
			return discordUser.osuRank && parseInt(discordUser.osuRank) >= parseInt(args[0]) && parseInt(discordUser.osuRank) <= parseInt(args[1]) && discordUser.osuDuelStarRating;
		});

		validUsers.sort((a, b) => {
			return b.osuDuelStarRating - a.osuDuelStarRating;
		});

		let duelRatings = validUsers.map(discordUser => {
			return parseFloat(discordUser.osuDuelStarRating);
		});

		let labels = [];

		for (let i = 0; i < duelRatings.length; i++) {
			labels.push(i + 1);
		}

		const data = {
			labels: labels,
			datasets: [
				{
					label: 'Total Rating',
					data: duelRatings,
					borderColor: 'rgb(54, 162, 235)',
					fill: false,
					tension: 0.4
				},
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
						text: 'Total rating distribution',
						color: '#FFFFFF',
					},
					legend: {
						labels: {
							color: '#FFFFFF',
						}
					},
				},
				interaction: {
					intersect: false,
				},
				scales: {
					x: {
						display: true,
						title: {
							display: true,
							text: 'Player rank sorted by total rating',
							color: '#FFFFFF'
						},
						grid: {
							color: '#8F8F8F'
						},
						ticks: {
							color: '#FFFFFF',
						},
					},
					y: {
						display: true,
						title: {
							display: true,
							text: 'Total Rating',
							color: '#FFFFFF'
						},
						grid: {
							color: '#8F8F8F'
						},
						ticks: {
							color: '#FFFFFF',
						},
					}
				}
			},
		};

		const width = 1500; //px
		const height = 750; //px
		const canvasRenderService = new ChartJSNodeCanvas({ width, height });

		const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

		const attachment = new AttachmentBuilder(imageBuffer, { name: 'totalRating.png' });

		return await interaction.editReply({ content: `The rating distribution for players ranked ${args[0]} to ${args[1]} is:`, files: [attachment] });
	},
};