const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const Discord = require('discord.js');
const osu = require('node-osu');
const Canvas = require('canvas');
const { humanReadable, getGameModeName, getLinkModeName, rippleToBanchoUser, updateOsuDetailsforUser, getIDFromPotentialOsuLink, logDatabaseQueries, getUserDuelStarRating, getOsuDuelLeague, getAdditionalOsuInfo, getBadgeImage, getAvatar, awaitWebRequestPermission } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { Op } = require('sequelize');
const { developers, showUnknownInteractionError } = require('../config.json');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

module.exports = {
	name: 'osu-profile',
	description: 'Sends an info card about the specified player',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-profile')
		.setNameLocalizations({
			'de': 'osu-profil',
			'en-GB': 'osu-profile',
			'en-US': 'osu-profile',
		})
		.setDescription('Sends an info card about the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über den angegebenen Spieler',
			'en-GB': 'Sends an info card about the specified player',
			'en-US': 'Sends an info card about the specified player',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('username')
				.setNameLocalizations({
					'de': 'nutzername',
					'en-GB': 'username',
					'en-US': 'username',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('showgraph')
				.setNameLocalizations({
					'de': 'zeigegraph',
					'en-GB': 'showgraph',
					'en-US': 'showgraph',
				})
				.setDescription('Show the rank graph')
				.setDescriptionLocalizations({
					'de': 'Zeigt den Rang-Graphen',
					'en-GB': 'Show the rank graph',
					'en-US': 'Show the rank graph',
				})
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName('gamemode')
				.setNameLocalizations({
					'de': 'spielmodus',
					'en-GB': 'gamemode',
					'en-US': 'gamemode',
				})
				.setDescription('The osu! gamemode')
				.setDescriptionLocalizations({
					'de': 'Der osu! Spielmodus',
					'en-GB': 'The osu! gamemode',
					'en-US': 'The osu! gamemode',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Standard', value: 0 },
					{ name: 'Taiko', value: 1 },
					{ name: 'Catch The Beat', value: 2 },
					{ name: 'Mania', value: 3 },
				)
		)
		.addStringOption(option =>
			option.setName('server')
				.setNameLocalizations({
					'de': 'server',
					'en-GB': 'server',
					'en-US': 'server',
				})
				.setDescription('The osu! server')
				.setDescriptionLocalizations({
					'de': 'Der osu! Server',
					'en-GB': 'The osu! server',
					'en-US': 'The osu! server',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Bancho', value: 'bancho' },
					{ name: 'Ripple', value: 'ripple' },
				)
		)
		.addStringOption(option =>
			option.setName('username2')
				.setNameLocalizations({
					'de': 'nutzername2',
					'en-GB': 'username2',
					'en-US': 'username2',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username3')
				.setNameLocalizations({
					'de': 'nutzername3',
					'en-GB': 'username3',
					'en-US': 'username3',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username4')
				.setNameLocalizations({
					'de': 'nutzername4',
					'en-GB': 'username4',
					'en-US': 'username4',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username5')
				.setNameLocalizations({
					'de': 'nutzername5',
					'en-GB': 'username5',
					'en-US': 'username5',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		),
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let showGraph = interaction.options.getBoolean('showgraph');

		let usernames = [];

		if (interaction.options.getString('username')) {
			usernames.push(interaction.options.getString('username'));
		}

		if (interaction.options.getString('username2')) {
			usernames.push(interaction.options.getString('username2'));
		}

		if (interaction.options.getString('username3')) {
			usernames.push(interaction.options.getString('username3'));
		}

		if (interaction.options.getString('username4')) {
			usernames.push(interaction.options.getString('username4'));
		}

		if (interaction.options.getString('username5')) {
			usernames.push(interaction.options.getString('username5'));
		}

		logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers commandUser');
		const commandUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuMainMode', 'osuMainServer'],
			where: {
				userId: interaction.user.id
			},
		});

		let gamemode = interaction.options.getNumber('gamemode');

		if (!gamemode) {
			if (commandUser && commandUser.osuMainMode) {
				gamemode = commandUser.osuMainMode;
			} else {
				gamemode = 0;
			}
		}

		let server = interaction.options.getString('server');

		if (!server) {
			if (commandUser && commandUser.osuMainServer) {
				server = commandUser.osuMainServer;
			} else {
				server = 'bancho';
			}
		}

		if (!usernames[0]) {//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				getProfile(interaction, commandUser.osuUserId, server, gamemode, showGraph);
			} else {
				let userDisplayName = interaction.user.username;

				if (interaction.member) {
					userDisplayName = interaction.member.displayName;
				}

				getProfile(interaction, userDisplayName, server, gamemode, showGraph);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < usernames.length; i++) {
				if (usernames[i].startsWith('<@') && usernames[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers 1');
					const discordUser = await DBDiscordUsers.findOne({
						attributes: ['osuUserId'],
						where: {
							userId: usernames[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						getProfile(interaction, discordUser.osuUserId, server, gamemode, showGraph);
					} else {
						await interaction.followUp(`\`${usernames[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						getProfile(interaction, usernames[i], server, gamemode, showGraph);
					}
				} else {

					if (usernames.length === 1 && !(usernames[0].startsWith('<@')) && !(usernames[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getProfile(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, showGraph, true);
						} else {
							getProfile(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, showGraph);
						}
					} else {
						getProfile(interaction, getIDFromPotentialOsuLink(usernames[i]), server, gamemode, showGraph);
					}
				}
			}
		}
	},
};

async function getProfile(interaction, username, server, mode, showGraph, noLinkedAccount) {
	if (server === 'bancho') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		// eslint-disable-next-line no-undef
		process.send('osu!API');
		osuApi.getUser({ u: username, m: mode })
			.then(async (user) => {
				updateOsuDetailsforUser(interaction.client, user, mode);

				const canvasWidth = 700;
				const canvasHeight = 350;

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				let elements = [canvas, ctx, user];

				elements = await drawTitle(elements, server, mode);

				elements = await drawRank(elements, interaction);

				elements = await drawLevel(elements, server);

				elements = await drawRanks(elements);

				elements = await drawPlays(elements, server);

				elements = await drawBadges(elements, server, interaction.client);

				elements = await drawFooter(elements, server);

				await drawAvatar(elements);

				//Create as an attachment
				const files = [new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-profile-${getGameModeName(mode)}-${user.id}.png` })];

				if (showGraph) {
					let graph = await getRankHistoryGraph(user.id, mode);
					if (graph) {
						files.push(graph);
					}
				}

				logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers 2');
				const linkedUser = await DBDiscordUsers.findOne({
					attributes: ['userId'],
					where: {
						osuUserId: user.id
					}
				});

				if (linkedUser && linkedUser.userId) {
					noLinkedAccount = false;
				}

				//Send attachment
				let sentMessage = null;
				if (noLinkedAccount) {
					sentMessage = await interaction.followUp({ content: `${user.name}: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nFeel free to use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`, files: files });
				} else {
					sentMessage = await interaction.followUp({ content: `${user.name}: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>`, files: files });
				}

				await sentMessage.react('🥇');
				await sentMessage.react('📈');

				logDatabaseQueries(4, 'commands/osu-profile.js DBOsuMultiScores 1');
				let userScores = await DBOsuMultiScores.findAll({
					attributes: ['score'],
					where: {
						osuUserId: user.id,
						score: {
							[Op.gte]: 10000
						},
						[Op.or]: [
							{ warmup: false },
							{ warmup: null }
						],
					}
				});

				for (let i = 0; i < userScores.length; i++) {
					if (parseInt(userScores[i].score) <= 10000) {
						userScores.splice(i, 1);
						i--;
					}
				}

				if (userScores.length) {
					await sentMessage.react('<:master:951396806653255700>');
					await sentMessage.react('🆚');
					await sentMessage.react('📊');
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'ripple') {
		fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				}

				let user = rippleToBanchoUser(responseJson[0]);

				const canvasWidth = 700;
				const canvasHeight = 350;

				Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

				//Create Canvas
				const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

				//Get context and load the image
				const ctx = canvas.getContext('2d');
				const background = await Canvas.loadImage('./other/osu-background.png');
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				let elements = [canvas, ctx, user];

				elements = await drawTitle(elements, server, mode);

				elements = await drawRank(elements, interaction);

				elements = await drawLevel(elements, server);

				elements = await drawPlays(elements, server);

				elements = await drawBadges(elements, server, interaction.client);

				elements = await drawFooter(elements, server);

				await drawAvatar(elements);

				//Create as an attachment
				const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), { name: `osu-profile-${getGameModeName(mode)}-${user.id}.png` });

				//Send attachment
				let sentMessage = await interaction.followUp({ content: `${user.name}: <https://ripple.moe/u/${user.id}?mode=${mode}>\nSpectate: <osu://spectate/${user.id}>`, files: [attachment] });

				await sentMessage.react('🥇');
				await sentMessage.react('📈');

				logDatabaseQueries(4, 'commands/osu-profile.js DBOsuMultiScores 2');
				let userScores = await DBOsuMultiScores.findAll({
					attributes: ['score'],
					where: {
						osuUserId: user.id,
						score: {
							[Op.gte]: 10000
						},
						[Op.or]: [
							{ warmup: false },
							{ warmup: null }
						],
					}
				});

				for (let i = 0; i < userScores.length; i++) {
					if (parseInt(userScores[i].score) <= 10000) {
						userScores.splice(i, 1);
						i--;
					}
				}

				if (userScores.length) {
					await sentMessage.react('<:master:951396806653255700>');
					await sentMessage.react('🆚');
					await sentMessage.react('📊');
				}
			})
			.catch(async (err) => {
				if (err.message === 'Not found') {
					await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	}
}

async function drawTitle(input, server, mode) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let gameMode = getGameModeName(mode);

	let title = `${user.name}'s ${gameMode} profile`;
	if (user.name.endsWith('s') || user.name.endsWith('x')) {
		title = `${user.name}' ${gameMode} profile`;
	}

	if (server !== 'bancho') {
		title = `[${server}] ${title}`;
	}

	// Write the title of the player
	ctx.font = '30px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(title, canvas.width / 2, 35);

	logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers 3');
	const discordUser = await DBDiscordUsers.findOne({
		attributes: ['userId', 'patreon'],
		where: {
			osuUserId: user.id
		}
	});

	if (discordUser && discordUser.patreon) {
		const patreonLogo = await Canvas.loadImage('./other/patreonLogo.png');
		ctx.drawImage(patreonLogo, 10, 10, 30, 30);
	}

	if (discordUser && developers.includes(discordUser.userId)) {
		const devLogo = await Canvas.loadImage('./other/devLogo.png');
		ctx.drawImage(devLogo, 10, 10, 30, 30);
	}

	const output = [canvas, ctx, user];
	return output;
}

async function drawRank(input, interaction) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const yOffset = 5;

	const globalRank = humanReadable(user.pp.rank);
	const countryRank = humanReadable(user.pp.countryRank);
	let pp = humanReadable(Math.floor(user.pp.raw));

	// Write the title of the player
	ctx.font = '18px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'right';
	ctx.fillText(`Global Rank: #${globalRank} |`, canvas.width / 2, 60 + yOffset);
	ctx.textAlign = 'left';
	ctx.fillText(`${user.country} Rank: #${countryRank}`, 379, 60 + yOffset);
	ctx.textAlign = 'center';
	ctx.fillText(`PP: ${pp}`, canvas.width / 2, 83 + yOffset);

	try {
		logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers 4');
		const discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuDuelStarRating'],
			where: {
				osuUserId: user.id
			}
		});

		if (!discordUser) {
			logDatabaseQueries(4, 'commands/osu-profile.js DBDiscordUsers create');
			await DBDiscordUsers.create({ osuName: user.name, osuUserId: user.id });
		}

		let userDuelStarRating = null;

		if (discordUser && discordUser.osuDuelStarRating) {
			userDuelStarRating = discordUser.osuDuelStarRating;
		} else {
			userDuelStarRating = await getUserDuelStarRating({ osuUserId: user.id, client: interaction.client });
			userDuelStarRating = userDuelStarRating.total;
		}

		let leagueName = getOsuDuelLeague(userDuelStarRating);
		let leagueImage = await Canvas.loadImage(`./other/emblems/${leagueName.imageName}.png`);

		ctx.drawImage(leagueImage, 557, 40, 110, 110);
	} catch (e) {
		//Nothing
	}

	try {
		let flag = await Canvas.loadImage(`./other/flags/${user.country}.png`);

		ctx.drawImage(flag, 352, 49, flag.width * 0.1785, flag.height * 0.1785);
	} catch (e) {
		let flag = await Canvas.loadImage('./other/flags/__.png');

		ctx.drawImage(flag, 352, 49, 25, 18);
	}

	const output = [canvas, ctx, user];
	return output;
}

async function drawLevel(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const yOffset = 25;

	// Write the text for the floored level of the player
	ctx.font = '40px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(Math.floor(user.level), canvas.width / 10, canvas.height / 2 + 15 + yOffset);

	//Add a faint circle around the level
	ctx.beginPath();
	ctx.arc(canvas.width / 10, canvas.height / 2 + yOffset, 50, 0, 2 * Math.PI);
	ctx.strokeStyle = '#373e40';
	ctx.lineWidth = 5;
	ctx.stroke();

	//calculate percentage of level completed
	const levelPercentage = (user.level % 1);

	//Add a stroke around the level by how much it is completed
	ctx.beginPath();
	ctx.arc(canvas.width / 10, canvas.height / 2 + yOffset, 50, Math.PI * -0.5, (Math.PI * 2) * levelPercentage + Math.PI * -0.5);
	ctx.strokeStyle = '#D1EDF2';
	ctx.lineWidth = 5;
	ctx.stroke();

	//floor scores
	let rankedScore = user.scores.ranked;
	if (rankedScore > 9999999999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000000000)) + 'B';
	} else if (rankedScore > 9999999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000000)) + 'M';
	} else if (rankedScore > 9999) {
		rankedScore = humanReadable(Math.floor(rankedScore / 1000)) + 'K';
	}

	let totalScore = user.scores.total;
	if (totalScore > 9999999999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000000000)) + 'B';
	} else if (totalScore > 9999999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000000)) + 'M';
	} else if (totalScore > 9999) {
		totalScore = humanReadable(Math.floor(totalScore / 1000)) + 'K';
	}

	const ranksOffset = 40;

	//Score and Accuracy
	ctx.font = 'bold 14px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText('Ranked:', canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * -1 + 6 - 8 + yOffset);
	ctx.fillText(rankedScore, canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * -1 + 6 + 8 + yOffset);
	ctx.fillText('Total:', canvas.width / 4 + 15, canvas.height / 2 + 6 - 8 + yOffset);
	ctx.fillText(totalScore, canvas.width / 4 + 15, canvas.height / 2 + 6 + 8 + yOffset);
	ctx.fillText('Acc:', canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * 1 + 6 - 8 + yOffset);
	if (server !== 'ripple') {
		ctx.fillText(user.accuracyFormatted, canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * 1 + 6 + 8 + yOffset);
	} else {
		ctx.fillText(`${Math.round(user.accuracy * 100) / 100}%`, canvas.width / 4 + 15, canvas.height / 2 + ranksOffset * 1 + 6 + 8 + yOffset);
	}

	const output = [canvas, ctx, user];
	return output;
}

async function drawRanks(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const yOffset = 25;

	const ranksOffset = 30;

	ctx.font = 'bold 16px comfortaa, sans-serif';
	ctx.textAlign = 'left';
	//get SSH

	const SSH = await Canvas.loadImage('./other/rank_pictures/XH_Rank.png');
	ctx.drawImage(SSH, canvas.width / 2 + canvas.height / 4 - 8, canvas.height / 2 - 8 + ranksOffset * -2 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.SSH), canvas.width / 2 + canvas.height / 4 + 32, canvas.height / 2 + ranksOffset * -2 + 6 + yOffset);

	//get SS
	const SS = await Canvas.loadImage('./other/rank_pictures/X_Rank.png');
	ctx.drawImage(SS, canvas.width / 2 + canvas.height / 4 + 5, canvas.height / 2 - 8 + ranksOffset * -1 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.SS), canvas.width / 2 + canvas.height / 4 + 45, canvas.height / 2 + ranksOffset * -1 + 6 + yOffset);

	//get SH
	const SH = await Canvas.loadImage('./other/rank_pictures/SH_Rank.png');
	ctx.drawImage(SH, canvas.width / 2 + canvas.height / 4 + 10, canvas.height / 2 - 8 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.SH), canvas.width / 2 + canvas.height / 4 + 50, canvas.height / 2 + 6 + yOffset);

	//get S
	const S = await Canvas.loadImage('./other/rank_pictures/S_Rank.png');
	ctx.drawImage(S, canvas.width / 2 + canvas.height / 4 + 5, canvas.height / 2 - 8 + ranksOffset * 1 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.S), canvas.width / 2 + canvas.height / 4 + 45, canvas.height / 2 + ranksOffset * 1 + 6 + yOffset);

	//get A
	const A = await Canvas.loadImage('./other/rank_pictures/A_Rank.png');
	ctx.drawImage(A, canvas.width / 2 + canvas.height / 4 - 8, canvas.height / 2 - 8 + ranksOffset * 2 + yOffset, 32, 16);
	ctx.fillText(humanReadable(user.counts.A), canvas.width / 2 + canvas.height / 4 + 32, canvas.height / 2 + ranksOffset * 2 + 6 + yOffset);
	const output = [canvas, ctx, user];
	return output;
}

async function drawPlays(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let yOffset = 25;

	ctx.font = 'bold 16px comfortaa, sans-serif';
	ctx.textAlign = 'center';

	const playHours = Math.floor(user.secondsPlayed / 60 / 60);

	if (server !== 'ripple') {
		ctx.fillText('Hours:', canvas.width / 8 * 7, canvas.height / 2 + 6 - 40 + yOffset);
		ctx.fillText(humanReadable(playHours), canvas.width / 8 * 7, canvas.height / 2 + 6 - 20 + yOffset);
		ctx.fillText('Plays:', canvas.width / 8 * 7, canvas.height / 2 + 6 + 20 + yOffset);
		ctx.fillText(humanReadable(user.counts.plays), canvas.width / 8 * 7, canvas.height / 2 + 6 + 40 + yOffset);
	}

	if (server === 'ripple') {
		yOffset = yOffset - 30;
		ctx.fillText('Plays:', canvas.width / 16 * 13, canvas.height / 2 + 6 + 20 + yOffset);
		ctx.fillText(humanReadable(user.counts.plays), canvas.width / 16 * 13, canvas.height / 2 + 6 + 40 + yOffset);
	}
	const output = [canvas, ctx, user];
	return output;
}

async function drawBadges(input, server, client) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	if (server === 'bancho') {
		let additionalInfo = await getAdditionalOsuInfo(user.id, client);

		let xOffset = -2;
		if (additionalInfo.badges.length < 8) {
			xOffset = xOffset + (8 - additionalInfo.badges.length) * 44;
		}
		for (let i = 0; i < additionalInfo.badges.length && i < 8; i++) {
			const badge = await getBadgeImage(additionalInfo.badges[i].image_url.replace('https://assets.ppy.sh/profile-badges/', ''));
			ctx.drawImage(badge, xOffset + (i * 88), 290, 86, 40);
		}
	}

	const output = [canvas, ctx, user];
	return output;
}

async function drawFooter(input, server) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	let today = new Date().toLocaleDateString();

	// Write the title of the player
	ctx.font = '12px comfortaa, sans-serif';
	ctx.fillStyle = '#ffffff';

	if (server !== 'ripple') {
		//Set join time
		const month = new Array();
		month[0] = 'January';
		month[1] = 'February';
		month[2] = 'March';
		month[3] = 'April';
		month[4] = 'May';
		month[5] = 'June';
		month[6] = 'July';
		month[7] = 'August';
		month[8] = 'September';
		month[9] = 'October';
		month[10] = 'November';
		month[11] = 'December';

		const joinDay = user.raw_joinDate.substring(8, 10);

		var joinDayEnding = 'th';
		if (joinDay === '01' || joinDay === '21' || joinDay === '31') {
			joinDayEnding = 'st';
		} else if (joinDay === '02' || joinDay === '22') {
			joinDayEnding = 'nd';
		} else if (joinDay === '03' || joinDay === '23') {
			joinDayEnding = 'rd';
		}
		const joinMonth = month[user.raw_joinDate.substring(5, 7) - 1];
		const joinYear = user.raw_joinDate.substring(0, 4);
		const joinDate = joinDay + joinDayEnding + ' ' + joinMonth + ' ' + joinYear;

		ctx.textAlign = 'left';
		ctx.fillText(`Started playing osu! on ${joinDate}`, 5, canvas.height - 5);
	}

	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

	const output = [canvas, ctx, user];
	return output;
}

async function drawAvatar(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

	const yOffset = 25;

	//Get a circle in the middle for inserting the player avatar
	ctx.beginPath();
	ctx.arc(canvas.width / 2, canvas.height / 2 + yOffset, canvas.height / 4, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	//Draw a shape onto the main canvas in the middle
	const avatar = await getAvatar(user.id);
	ctx.drawImage(avatar, canvas.width / 2 - canvas.height / 4, canvas.height / 4 + yOffset, canvas.height / 2, canvas.height / 2);

	const output = [canvas, ctx, user];
	return output;
}

async function getRankHistoryGraph(osuUserId, mode) {
	mode = getGameModeName(mode);

	if (mode === 'standard') {
		mode = 'osu';
	} else if (mode === 'catch') {
		mode = 'fruits';
	}

	await awaitWebRequestPermission();
	let history = await fetch(`https://osu.ppy.sh/users/${osuUserId}/${mode}`)
		.then(async (res) => {
			let htmlCode = await res.text();
			htmlCode = htmlCode.replace(/&quot;/gm, '"');
			const rankHistoryRegex = /,"rankHistory":{"mode":"(osu|taiko|fruits|mania)","data":\[.+]},/gm;
			const matches = rankHistoryRegex.exec(htmlCode);
			if (matches && matches[0]) {
				return matches[0].replace(`,"rankHistory":{"mode":"${mode}","data":[`, '').replace(/].+/gm, '').split(',');
			}
		});

	if (!history) {
		return;
	}

	let labels = [];

	for (let i = 0; i < history.length; i++) {
		labels.push(`${history.length - i} days ago`);
	}

	const width = 1500; //px
	const height = 750; //px
	const canvasRenderService = new ChartJSNodeCanvas({ width, height });

	const data = {
		labels: labels,
		datasets: [
			{
				label: 'Rank history',
				data: history,
				borderColor: 'rgb(96, 183, 202)',
				fill: 'start',
				backgroundColor: 'rgba(96, 183, 202, 0.6)',
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
					text: 'Rank History',
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
						text: 'Month',
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
						text: 'Rank',
						color: '#FFFFFF'
					},
					grid: {
						color: '#8F8F8F'
					},
					ticks: {
						color: '#FFFFFF',
					},
					reverse: true,
				}
			}
		},
	};

	const imageBuffer = await canvasRenderService.renderToBuffer(configuration);

	return new Discord.AttachmentBuilder(imageBuffer, { name: `rankHistory-osu-${osuUserId}.png` });
}