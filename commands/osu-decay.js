const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { logDatabaseQueries, humanReadable, logOsuAPICalls } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');
const { Op, Sequelize } = require('sequelize');

module.exports = {
	name: 'osu-decay',
	description: 'Calculates how long it would take for a player to decay from their current rank',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-decay')
		.setNameLocalizations({
			'de': 'osu-decay',
			'en-GB': 'osu-decay',
			'en-US': 'osu-decay',
		})
		.setDescription('Calculates how long it would take for a player to decay from their current rank')
		.setDescriptionLocalizations({
			'de': 'Berechnet, wie lange es dauern würde, bis ein Spieler von seinem aktuellen Rang absteigt',
			'en-GB': 'Calculates how long it would take for a player to decay from their current rank',
			'en-US': 'Calculates how long it would take for a player to decay from their current rank',
		})
		.setDMPermission(true)
		.addIntegerOption(option =>
			option.setName('rank')
				.setNameLocalizations({
					'de': 'rang',
					'en-GB': 'rank',
					'en-US': 'rank',
				})
				.setDescription('The rank to decay to')
				.setDescriptionLocalizations({
					'de': 'Der Rang, bis zu dem abgestiegen werden soll',
					'en-GB': 'The rank to decay to',
					'en-US': 'The rank to decay to',
				})
				.setRequired(true)
				.setMinValue(2)
		)
		.addStringOption(option =>
			option.setName('username')
				.setNameLocalizations({
					'de': 'nutzername',
					'en-GB': 'username',
					'en-US': 'username',
				})
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, für den die Berechnung durchgeführt werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
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

		let username = interaction.options.getString('username');

		if (username === null) {
			logDatabaseQueries(4, 'commands/osu-decay.js DBDiscordUsers 1');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
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
			logDatabaseQueries(4, 'commands/osu-decay.js DBDiscordUsers 2');
			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
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
			logOsuAPICalls('commands/osu-decay.js user');
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

		logDatabaseQueries(4, 'commands/osu-decay.js DBDiscordUsers 3');
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

		let compareUsers = [];

		while (discordUsers.length > 0 && compareUsers.length < 5) {
			let index = 0;
			let difference = Infinity;

			for (let i = 0; i < discordUsers.length; i++) {
				if (Math.abs(discordUsers[i].osuRank - Number(user.pp.rank)) < difference) {
					difference = Math.abs(discordUsers[i].osuRank - Number(user.pp.rank));
					index = i;
				}
			}

			try {
				logOsuAPICalls('commands/osu-decay.js compareUser');
				let updatedUserToCompare = await osuApi.getUser({ u: discordUsers[index].osuUserId });

				if (Number(updatedUserToCompare.pp.raw) !== Number(discordUsers[index].osuPP)) {
					discordUsers.splice(index, 1);
				} else {
					discordUsers[index].osuRank = Number(updatedUserToCompare.pp.rank);
					compareUsers.push(discordUsers[index]);
					discordUsers.splice(index, 1);
				}
			} catch (error) {
				// Do nothing
			}
		}

		if (compareUsers.length === 0) {
			return await interaction.editReply(`There was an error finding a user to compare to ${user.name}.`);
		}

		// Get the average decay per week
		let totalDecay = 0;

		for (let i = 0; i < compareUsers.length; i++) {
			let compareUser = compareUsers[i];

			let decayTimeDifference = Math.abs(new Date() - compareUser.lastOsuPPChange);

			let decayRankDifference = compareUser.osuRank - compareUser.oldOsuRank;

			totalDecay += decayRankDifference / decayTimeDifference * 7 * 24 * 60 * 60 * 1000;
		}

		let averageDecayPerWeek = totalDecay / compareUsers.length;

		let currentRankDifference = decayRank - Number(user.pp.rank);

		let decayTime = Math.round(7 * 24 * 60 * 60 * 1000 / averageDecayPerWeek * currentRankDifference);

		return await interaction.editReply(`${user.name} would reach rank #${humanReadable(decayRank)} <t:${Math.round((decayTime + new Date().getTime()) / 1000)}:R> (Currently #${humanReadable(user.pp.rank)}).`);
	},
};