const { DBDiscordUsers, DBOsuTourneyFollows, DBOsuMultiScores } = require('../dbObjects');
const osu = require('node-osu');
const { developers } = require('../config.json');
const { Op } = require('sequelize');
const { getUserDuelStarRating } = require('../utils');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Discord = require('discord.js');

module.exports = {
	name: 'earlyaccess',
	aliases: ['early', 'ea'],
	description: 'Has some early access features for patreons if possible',
	usage: 'follow / unfollow / followlist / followers',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: msg.author.id,
				patreon: true
			}
		});

		if (!developers.includes(msg.author.id) && !discordUser) {
			return msg.reply('Earlyaccess commands are reserved for developers and patreons. As soon as they are up to standard for release you will be able to use them.');
		}

		if (args[0] === 'follow') {
			if (!args[1]) {
				return msg.reply('You did not give a user to follow');
			}

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			await osuApi.getUser({ u: args[1], m: 0 })
				.then(async (osuUser) => {
					let existingFollow = await DBOsuTourneyFollows.findOne({
						where: {
							userId: msg.author.id,
							osuUserId: osuUser.id
						}
					});

					if (existingFollow) {
						return msg.reply(`You are already following ${osuUser.name}`);
					}

					await DBOsuTourneyFollows.create({
						userId: msg.author.id,
						osuUserId: osuUser.id
					});

					return msg.reply(`You are now following ${osuUser.name}`);
				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user \`${args[1].replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
					} else {
						console.log(err);
					}
				});
		} else if (args[0] === 'unfollow') {
			if (!args[1]) {
				return msg.reply('You did not give a user to follow');
			}

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			await osuApi.getUser({ u: args[1], m: 0 })
				.then(async (osuUser) => {
					let existingFollow = await DBOsuTourneyFollows.findOne({
						where: {
							userId: msg.author.id,
							osuUserId: osuUser.id
						}
					});

					if (existingFollow) {
						await existingFollow.destroy();
						return msg.reply(`You are no longer following ${osuUser.name}`);
					}

					return msg.reply(`You were not following ${osuUser.name}`);
				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user \`${args[1].replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
					} else {
						console.log(err);
					}
				});
		} else if (args[0] === 'followlist') {
			//Get all follows for the user
			let follows = await DBOsuTourneyFollows.findAll({
				where: {
					userId: msg.author.id
				}
			});

			if (!follows.length) {
				return msg.reply('You are not following anyone');
			}

			let followList = [];
			for (let i = 0; i < follows.length; i++) {
				let discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: follows[i].osuUserId
					}
				});

				if (discordUser) {
					followList.push(discordUser.osuName);
				} else {
					// eslint-disable-next-line no-undef
					const osuApi = new osu.Api(process.env.OSUTOKENV1, {
						// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
						notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
						completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
						parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
					});

					await osuApi.getUser({ u: follows[i].osuUserId, m: 0 })
						.then(async (osuUser) => {
							followList.push(osuUser.name);
						})
						.catch(err => {
							console.log(err);
						});
				}
			}

			msg.reply(`You are following: \`${followList.join('`, `')}\``);
		} else if (args[0] === 'followers') {
			//Check if the user has a connected osu! account
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: msg.author.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return msg.reply('You have not connected your osu! account');
			}

			let followers = await DBOsuTourneyFollows.findAll({
				where: {
					osuUserId: discordUser.osuUserId
				}
			});

			if (!followers.length) {
				return msg.reply('You have no followers');
			}

			let followerList = [];
			for (let i = 0; i < followers.length; i++) {
				let follower = '';
				let discordName = null;
				try {
					discordName = await msg.client.users.fetch(followers[i].userId);
				} catch (e) {
					//Nothing
				}

				if (discordName) {
					follower = `${discordName.username}#${discordName.discriminator}`;
				}

				let followerUser = await DBDiscordUsers.findOne({
					where: {
						userId: followers[i].userId
					}
				});

				if (followerUser) {
					followers[i].osuName = followerUser.osuName;
				}

				if (!follower && followers[i].osuName) {
					follower = followers[i].osuName;
				} else if (follower && followers[i].osuName) {
					follower = `${follower} (${followers[i].osuName})`;
				}

				followerList.push(follower);
			}

			return msg.reply(`You have ${followers.length} followers: \`${followerList.join('`, `')}\``);

		} else if (args[0] === 'duelRatingDevelopment') {
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: msg.author.id,
					osuUserId: {
						[Op.ne]: null
					}
				}
			});

			if (!discordUser) {
				return msg.reply('You have not connected your osu! account');
			}

			let processingMessage = await msg.reply('Processing...');

			let oldestScore = await DBOsuMultiScores.findOne({
				where: {
					osuUserId: discordUser.osuUserId
				},
				order: [
					['gameEndDate', 'ASC']
				]
			});

			let duelRatings = [await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: msg.client })];

			//Set the date to the beginning of the week
			let date = new Date();
			date.setUTCDate(date.getUTCDate() - date.getUTCDay() + 1);
			date.setUTCHours(0, 0, 0, 0);

			let iterator = 0;
			while (date > oldestScore.gameEndDate) {
				iterator++;
				await processingMessage.edit(`Processing... (${iterator} weeks deep)`);
				console.log(date - oldestScore.gameEndDate);
				let duelRating = await getUserDuelStarRating({ osuUserId: discordUser.osuUserId, client: msg.client, date: date });
				duelRatings.push(duelRating);
				date.setUTCDate(date.getUTCDate() - 7);
			}

			let labels = [];

			for (let i = 0; i < duelRatings.length; i++) {
				if (i === 0) {
					labels.push('Today');
				} else if (i === 1) {
					labels.push(`${i} week ago`);
				} else {
					labels.push(`${i} weeks ago`);
				}
			}

			labels.reverse();

			let history = [];

			for (let i = 0; i < duelRatings.length; i++) {
				history.push(duelRatings[i].total);
			}

			history.reverse();

			let masterHistory = [];
			let diamondHistory = [];
			let platinumHistory = [];
			let goldHistory = [];
			let silverHistory = [];
			let bronzeHistory = [];

			for (let i = 0; i < history.length; i++) {
				let masterRating = null;
				let diamondRating = null;
				let platinumRating = null;
				let goldRating = null;
				let silverRating = null;
				let bronzeRating = null;

				if (history[i] > 7) {
					masterRating = history[i];
				} else if (history[i] > 6.4) {
					diamondRating = history[i];
				} else if (history[i] > 5.8) {
					platinumRating = history[i];
				} else if (history[i] > 5.2) {
					goldRating = history[i];
				} else if (history[i] > 4.6) {
					silverRating = history[i];
				} else {
					bronzeRating = history[i];
				}

				masterHistory.push(masterRating);
				diamondHistory.push(diamondRating);
				platinumHistory.push(platinumRating);
				goldHistory.push(goldRating);
				silverHistory.push(silverRating);
				bronzeHistory.push(bronzeRating);
			}

			const width = 1500; //px
			const height = 750; //px
			const canvasRenderService = new ChartJSNodeCanvas({ width, height });

			const data = {
				labels: labels,
				datasets: [
					{
						label: 'Master',
						data: masterHistory,
						borderColor: 'rgb(255, 174, 251)',
						fill: true,
						backgroundColor: 'rgba(255, 174, 251, 0.6)',
						tension: 0.4
					},
					{
						label: 'Diamond',
						data: diamondHistory,
						borderColor: 'rgb(73, 176, 255)',
						fill: true,
						backgroundColor: 'rgba(73, 176, 255, 0.6)',
						tension: 0.4
					},
					{
						label: 'Platinum',
						data: platinumHistory,
						borderColor: 'rgb(29, 217, 165)',
						fill: true,
						backgroundColor: 'rgba(29, 217, 165, 0.6)',
						tension: 0.4
					},
					{
						label: 'Gold',
						data: goldHistory,
						borderColor: 'rgb(255, 235, 71)',
						fill: true,
						backgroundColor: 'rgba(255, 235, 71, 0.6)',
						tension: 0.4
					},
					{
						label: 'Silver',
						data: silverHistory,
						borderColor: 'rgb(181, 181, 181)',
						fill: true,
						backgroundColor: 'rgba(181, 181, 181, 0.6)',
						tension: 0.4
					},
					{
						label: 'Bronze',
						data: bronzeHistory,
						borderColor: 'rgb(240, 121, 0)',
						fill: true,
						backgroundColor: 'rgba(240, 121, 0, 0.6)',
						tension: 0.4
					},
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
							text: 'Duel Rating History',
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
								text: 'Duel Rating',
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

			const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
			processingMessage.delete();
			msg.reply({ content: `Duel Rating History for ${discordUser.osuName}`, files: [new Discord.MessageAttachment(imageBuffer, `duelRatingHistory-${discordUser.osuUserId}.png`)] });
		} else {
			msg.reply('Invalid command');
		}
	},
};