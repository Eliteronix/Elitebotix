const { DBDiscordUsers } = require('../dbObjects');
const { getUserDuelStarRating, populateMsgFromInteraction, getOsuUserServerMode, getMessageUserDisplayname, getDerankStats } = require('../utils');
const osu = require('node-osu');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-derank',
	aliases: ['derank'],
	description: 'Reranks players based on their duel rating compared to others',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	// args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply(`Please use the / command \`${this.name}\``);
		}

		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let username = null;

		if (interaction.options._hoistedOptions[0]) {
			username = interaction.options._hoistedOptions[0].value;
		}

		let discordUser = null;

		if (username) {
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

			let user = await osuApi.getUser({ u: username, m: 0 })
				.then(osuUser => {
					return osuUser;
				})
				.catch(err => {
					if (err.message === 'Not found') {
						interaction.editReply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
					} else {
						interaction.editReply('The API ran into an error. Please try again later.');
						console.log(err);
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

				discordUser = await DBDiscordUsers.findOne({
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
					return interaction.editReply(`\`${username.replace(/`/g, '')}\` has no standard plays.`);
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

		interaction.editReply(message.join('\n'));
	},
};