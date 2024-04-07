const { DBDiscordUsers } = require('../dbObjects');
const { getUserDuelStarRating, populateMsgFromInteraction, getOsuUserServerMode, getMessageUserDisplayname, getDerankStats, getIDFromPotentialOsuLink, logDatabaseQueries, logOsuAPICalls } = require('../utils');
const osu = require('node-osu');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'osu-derank',
	description: 'Reranks players based on their duel rating compared to others',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-derank')
		.setNameLocalizations({
			'de': 'osu-derank',
			'en-GB': 'osu-derank',
			'en-US': 'osu-derank',
		})
		.setDescription('Reranks players based on their duel rating compared to others')
		.setDescriptionLocalizations({
			'de': 'Gibt Spielern basierend auf ihrem Duel Rating im Vergleich zu anderen einen neuen Rang',
			'en-GB': 'Reranks players based on their duel rating compared to others',
			'en-US': 'Reranks players based on their duel rating compared to others',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('username')
				.setNameLocalizations({
					'de': 'nutzername',
					'en-GB': 'username',
					'en-US': 'username',
				})
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
				})
				.setRequired(false)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
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

		let username = null;

		if (interaction.options._hoistedOptions[0]) {
			username = interaction.options._hoistedOptions[0].value;
		}

		let discordUser = null;

		if (username) {
			logDatabaseQueries(4, 'commands/osu-derank.js DBDiscordUsers 1');
			discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuName', 'osuUserId', 'osuPP', 'osuRank', 'osuDuelStarRating'],
				where: {
					[Op.or]: {
						osuUserId: getIDFromPotentialOsuLink(username),
						osuName: username,
						userId: username.replace('<@', '').replace('>', '').replace('!', ''),
					}
				}
			});
		}

		if (!discordUser && !username) {
			msg = await populateMsgFromInteraction(interaction);

			const commandConfig = await getOsuUserServerMode(msg, args);
			const commandUser = commandConfig[0];

			if (commandUser && commandUser.osuUserId) {
				discordUser = commandUser;
			} else {
				username = await getMessageUserDisplayname(msg);
			}
		}

		if (!discordUser) {
			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			logOsuAPICalls('commands/osu-derank.js');
			let user = await osuApi.getUser({ u: username, m: 0 })
				.then(osuUser => {
					return osuUser;
				})
				.catch(async (err) => {
					if (err.message === 'Not found') {
						await interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
					} else {
						await interaction.editReply('The API ran into an error. Please try again later.');
						console.error(err);
					}
					return null;
				});

			if (!user) {
				return;
			}

			msg = await populateMsgFromInteraction(interaction);

			try {
				let duelRating = await getUserDuelStarRating({ osuUserId: user.id, client: msg.client });

				discordUser = {
					osuName: user.name,
					osuUserId: user.id,
					osuPP: user.pp.raw,
					osuRank: user.pp.rank,
					osuDuelStarRating: duelRating.total,
				};

				logDatabaseQueries(4, 'commands/osu-derank.js DBDiscordUsers 2');
				discordUser = await DBDiscordUsers.findOne({
					attributes: ['osuName', 'osuUserId', 'osuPP', 'osuRank', 'osuDuelStarRating'],
					where: {
						osuUserId: user.id
					}
				});

				discordUser.osuName = user.name;
				discordUser.osuPP = user.pp.raw;
				discordUser.osuRank = user.pp.rank;
				discordUser.osuDuelStarRating = duelRating.total;
			} catch (e) {
				if (e.message === 'No standard plays') {
					return await interaction.editReply(`\`${username.replace(/`/g, '')}\` has no standard plays.`);
				} else {
					console.error(e);
				}
			}
		}

		let derankStats = await getDerankStats(discordUser);

		let message = [];

		message.push(`${discordUser.osuName} is:`);
		message.push(`\`\`\`Elitebotix users PP-Rank ${derankStats.ppRank} out of ${derankStats.ppUsersLength}`);
		message.push(`Elitebotix users Duel-Rating-Rank ${derankStats.duelRank} out of ${derankStats.duelUsersLength}`);
		message.push('');
		message.push('The expected osu! rank change for that duel rating would be:');
		message.push(`#${discordUser.osuRank} (${derankStats.expectedCurrentDuelRating.substring(0, 5)}*) -> ~#${derankStats.expectedPpRankOsu} (${derankStats.expectedDuelRating.substring(0, 5)}*) (Difference: ${discordUser.osuRank - derankStats.expectedPpRankOsu} ranks / ${(derankStats.expectedDuelRating - derankStats.expectedCurrentDuelRating).toFixed(3)}*)\`\`\``);

		await interaction.editReply(message.join('\n'));
	},
};