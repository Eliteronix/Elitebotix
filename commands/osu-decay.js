const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { Permissions } = require('discord.js');
const { logDatabaseQueries, humanReadable } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');
const { Op, Sequelize } = require('sequelize');

module.exports = {
	name: 'osu-decay',
	description: 'Calculates how long it would take for a player to decay from their current rank',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
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

		if (username === null) {
			logDatabaseQueries(4, 'commands/osu-history.js DBDiscordUsers 1');
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null,
					},
				}
			});

			if (discordUser) {
				username = discordUser.osuUserId;
			} else {
				username = interaction.user.username;

				if (interaction.member && interaction.member.nickname) {
					username = interaction.member.nickname;
				}
			}
		} else if (username.startsWith('<@')) {
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: username.replace('<@', '').replace('>', '').replace('!', ''),
					osuUserId: {
						[Op.not]: null,
					},
				}
			});

			if (!discordUser) {
				return await interaction.editReply(`The user \`${username.replace(/`/g, '')}\` doesn't have their account connected.`);
			}

			username = discordUser.osuUserId;
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let user = null;

		try {
			user = await osuApi.getUser({ u: username });
		} catch (error) {
			return await interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
		}

		let decayRank = interaction.options.getInteger('rank');

		if (Number(user.pp.rank) >= decayRank) {
			return await interaction.editReply(`${user.name} is already above #${humanReadable(decayRank)} (Currently: #${humanReadable(user.pp.rank)}).`);
		}

		let lastWeek = new Date();
		lastWeek.setDate(lastWeek.getDate() - 7);

		logDatabaseQueries(4, 'commands/osu-decay.js DBDiscordUsers');
		let discordUsers = await DBDiscordUsers.findAll({
			attributes: ['osuUserId', 'osuRank', 'oldOsuRank', 'osuPP', 'lastOsuPPChange'],
			where: {
				osuUserId: {
					[Op.not]: null,
				},
				osuRank: {
					[Op.not]: null,
				},
				osuPP: {
					[Op.not]: null,
				},
				lastOsuPPChange: {
					[Op.lte]: lastWeek,
				},
				[Op.and]: [
					{
						oldOsuRank: {
							[Op.not]: null,
						},
					},
					{
						oldOsuRank: {
							[Op.lt]: Sequelize.col('osuRank'),
						},
					},
				],
			},
			order: [['osuRank', 'ASC']],
		});

		discordUsers = discordUsers.map(discordUser => {
			return {
				osuUserId: discordUser.osuUserId,
				osuRank: discordUser.osuRank,
				oldOsuRank: discordUser.oldOsuRank,
				osuPP: discordUser.osuPP,
				lastOsuPPChange: discordUser.lastOsuPPChange,
			};
		});

		let compareUser = null;

		while (discordUsers.length > 0 && !compareUser) {
			let index = 0;
			let difference = Infinity;

			for (let i = 0; i < discordUsers.length; i++) {
				if (Math.abs(discordUsers[i].osuRank - Number(user.pp.rank)) < difference) {
					difference = Math.abs(discordUsers[i].osuRank - Number(user.pp.rank));
					index = i;
				}
			}

			try {
				let updatedUserToCompare = await osuApi.getUser({ u: discordUsers[index].osuUserId });

				if (Number(updatedUserToCompare.pp.raw) !== Number(discordUsers[index].osuPP)) {
					discordUsers.splice(index, 1);
				} else {
					discordUsers[index].osuRank = Number(updatedUserToCompare.pp.rank);
					compareUser = discordUsers[index];
				}
			} catch (error) {
				// Do nothing
			}
		}

		if (!compareUser) {
			return await interaction.editReply(`There was an error finding a user to compare to ${user.name}.`);
		}

		let decayTimeDifference = Math.abs(new Date() - compareUser.lastOsuPPChange);

		let decayRankDifference = compareUser.osuRank - compareUser.oldOsuRank;

		let currentRankDifference = decayRank - Number(user.pp.rank);

		let decayTime = Math.round(decayTimeDifference / decayRankDifference * currentRankDifference);

		return await interaction.editReply(`${user.name} would reach rank #${humanReadable(decayRank)} <t:${Math.round((decayTime + new Date().getTime()) / 1000)}:R> (Currently #${humanReadable(user.pp.rank)}).`);
	},
};