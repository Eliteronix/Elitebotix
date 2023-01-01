const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const osu = require('node-osu');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'osu-wrapped',
	// aliases: ['developer', 'donate', 'support'],
	description: 'Sums up the year in osu! for a user',
	// usage: '<add/list/remove> <username>',
	// permissions: Permissions.FLAGS.MANAGE_GUILD,
	// permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	// guildOnly: true,
	// args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let username = interaction.options.getString('username');

		let discordUser = null;

		if (username === null) {
			logDatabaseQueries(4, 'commands/osu-wrapped.js DBDiscordUsers 1');
			discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id,
				}
			});

			if (discordUser === null) {
				username = interaction.user.username;

				if (interaction.member && interaction.member.nickname) {
					username = interaction.member.nickname;
				}
			}
		}

		//Get the user from the database if possible
		if (discordUser === null) {
			logDatabaseQueries(4, 'commands/osu-wrapped.js DBDiscordUsers 2');
			discordUser = await DBDiscordUsers.findOne({
				where: {
					[Op.or]: {
						osuUserId: username,
						osuName: username,
						userId: username.replace('<@', '').replace('>', '').replace('!', ''),
					}
				}
			});
		}

		let osuUser = {
			osuUserId: null,
			osuName: null
		};

		if (discordUser) {
			osuUser.osuUserId = discordUser.osuUserId;
			osuUser.osuName = discordUser.osuName;
		}

		//Get the user from the API if needed
		if (!osuUser.osuUserId) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			try {
				const user = await osuApi.getUser({ u: username });
				osuUser.osuUserId = user.id;
				osuUser.osuName = user.name;
			} catch (error) {
				return interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
			}
		}

		// Gather all the data
		let year = new Date().getFullYear() - 1;

		if (interaction.options.getInteger('year')) {
			year = interaction.options.getInteger('year');
		}
		console.log(year);

		let multiMatches = await DBOsuMultiScores.findAll({
			attributes: ['matchId'],
			where: {
				osuUserId: osuUser.osuUserId,
				gameEndDate: {
					[Op.and]: {
						[Op.gte]: new Date(`${year}-01-01`),
						[Op.lte]: new Date(`${year}-12-31 23:59:59.999 UTC`),
					}
				},
			},
			group: ['matchId'],
		});

		multiMatches = multiMatches.map(match => match.matchId);

		if (multiMatches.length === 0) {
			return interaction.editReply(`\`${osuUser.osuName}\` didn't play any tournament matches in ${year}.`);
		}

		multiMatches = await DBOsuMultiScores.findAll({
			where: {
				matchId: multiMatches,
			},
			order: [
				['gameEndDate', 'DESC'],
			],
		});

		console.log(multiMatches);

		console.log('Amount of matches played');
		console.log('Amount of matches won');
		console.log('Amount of matches lost');
		console.log('Amount of maps played');
		console.log('Amount of maps won');
		console.log('Amount of maps lost');
		console.log('Top tourney pp plays');
		console.log('Most played with players');
		console.log('Duel rating change');
		console.log('Amount of tourneys played');
	},
};