const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { humanReadable, updateOsuDetailsforUser, getIDFromPotentialOsuLink, logDatabaseQueries, getAdditionalOsuInfo } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');
const Parser = require('expr-eval').Parser;

module.exports = {
	name: 'osu-bws',
	description: 'Sends info about the BWS rank of the specified player',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-bws')
		.setNameLocalizations({
			'de': 'osu-bws',
			'en-GB': 'osu-bws',
			'en-US': 'osu-bws',
		})
		.setDescription('Sends info about the BWS rank of the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet Informationen über den BWS-Rang des angegebenen Spielers',
			'en-GB': 'Sends info about the BWS rank of the specified player',
			'en-US': 'Sends info about the BWS rank of the specified player',
		})
		.setDMPermission(true)
		.addIntegerOption(option =>
			option.setName('desiredrank')
				.setNameLocalizations({
					'de': 'gewünschterrang',
					'en-GB': 'desiredrank',
					'en-US': 'desiredrank',
				})
				.setDescription('The desired rank to calculate')
				.setDescriptionLocalizations({
					'de': 'Der gewünschte Rang, der berechnet werden soll',
					'en-GB': 'The desired rank to calculate',
					'en-US': 'The desired rank to calculate',
				})
				.setRequired(false)
				.setMinValue(1)
		)
		.addIntegerOption(option =>
			option.setName('badges')
				.setNameLocalizations({
					'de': 'badges',
					'en-GB': 'badges',
					'en-US': 'badges',
				})
				.setDescription('The badges to calculate with')
				.setDescriptionLocalizations({
					'de': 'Die badges, mit denen berechnet werden soll',
					'en-GB': 'The badges to calculate with',
					'en-US': 'The badges to calculate with',
				})
				.setRequired(false)
				.setMinValue(0)
		)
		.addIntegerOption(option =>
			option.setName('rank')
				.setNameLocalizations({
					'de': 'rang',
					'en-GB': 'rank',
					'en-US': 'rank',
				})
				.setDescription('The rank to calculate with')
				.setDescriptionLocalizations({
					'de': 'Der Rang, mit dem berechnet werden soll',
					'en-GB': 'The rank to calculate with',
					'en-US': 'The rank to calculate with',
				})
				.setRequired(false)
				.setMinValue(1)
		)
		.addStringOption(option =>
			option.setName('formula')
				.setNameLocalizations({
					'de': 'formel',
					'en-GB': 'formula',
					'en-US': 'formula',
				})
				.setDescription('The formula to calculate with')
				.setDescriptionLocalizations({
					'de': 'Die Formel, mit der berechnet werden soll',
					'en-GB': 'The formula to calculate with',
					'en-US': 'The formula to calculate with',
				})
				.setRequired(false)
				.setAutocomplete(true)
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
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username2')
				.setNameLocalizations({
					'de': 'nutzername2',
					'en-GB': 'username2',
					'en-US': 'username2',
				})
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
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
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
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
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
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
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
				})
				.setRequired(false)
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		const formulas = [
			'rank^(0.9937^(badges^2))',
			'rank^(0.99^(badges^2))',
			'rank^((0.9937^((badges^2)/0.75)))',
			'Write your own formula here',
		];

		let filtered = formulas.filter(choice => choice.includes(focusedValue));

		filtered = filtered.slice(0, 25);

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice, value: choice })),
			);
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}
	},
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

		let rank = interaction.options.getInteger('rank');
		let desiredrank = interaction.options.getInteger('desiredrank');
		let badges = interaction.options.getInteger('badges');

		let formula = 'rank^(0.9937^(badges^2))';

		if (interaction.options.getString('formula')) {
			formula = interaction.options.getString('formula').toLowerCase();

			if (formula.replaceAll('rank', '').replaceAll('badges', '').replace(/\W/gm, '').replace(/\d/gm, '')) {
				return await interaction.editReply('Invalid formula');
			}

			if (!formula.includes('rank') || !formula.includes('badges')) {
				return await interaction.editReply('Your formula must include the `rank` and `badges` variables');
			}

			try {
				const parser = new Parser();
				let expr = parser.parse(formula);

				expr.evaluate({ rank: 25000, badges: 1 });
			} catch (error) {
				return await interaction.editReply('Invalid formula');
			}
		}

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

		if (usernames.length === 0) {//Get profile by author if no argument
			const commandUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				},
			});

			if (commandUser && commandUser.osuUserId) {
				getProfile(interaction, commandUser.osuUserId, formula, rank, desiredrank, badges);
			} else {
				let userDisplayName = interaction.user.username;

				if (interaction.member) {
					userDisplayName = interaction.member.displayName;
				}

				getProfile(interaction, userDisplayName, formula, rank, desiredrank, badges);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < usernames.length; i++) {
				if (usernames[i].startsWith('<@') && usernames[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-bws.js DBDiscordUsers 1');
					const discordUser = await DBDiscordUsers.findOne({
						where: {
							userId: usernames[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						getProfile(interaction, discordUser.osuUserId, formula, rank, desiredrank, badges);
					} else {
						await interaction.followUp(`\`${usernames[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:1064502370710605836>.`);
						continue;
					}
				} else {
					getProfile(interaction, getIDFromPotentialOsuLink(usernames[i]), formula, rank, desiredrank, badges);
				}
			}
		}
	},
};

async function getProfile(interaction, username, formula, rank, desiredrank, badges) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	// eslint-disable-next-line no-undef
	process.send('osu!API');
	osuApi.getUser({ u: username, m: 0 })
		.then(async (user) => {
			updateOsuDetailsforUser(interaction.client, user, 0);

			let additionalInfo = await getAdditionalOsuInfo(user.id, interaction.client);

			let badgeAmount = additionalInfo.tournamentBadges.length;

			const parser = new Parser();
			let expr = parser.parse(formula);

			let content = `${user.name} is currently rank #${humanReadable(user.pp.rank)} and has ${badgeAmount} badges.\n`;
			content += `Using \`${formula}\` their BWS rank is currently #${humanReadable(expr.evaluate({ rank: user.pp.rank, badges: badgeAmount }))}\n`;
			content += '``` Badges |      Rank |  BWS Rank\n';
			content += '--------------------------------\n';
			for (let i = 0; i < 6; i++) {
				content += `${(badgeAmount + i).toString().padStart(7, ' ')} | ${humanReadable(user.pp.rank).padStart(9, ' ')} | ${humanReadable(Math.round(expr.evaluate({ rank: user.pp.rank, badges: badgeAmount + i }))).padStart(9, ' ')}\n`;
			}

			if (rank) {
				content += '--------------------------------\n';
				content += `${badgeAmount.toString().padStart(7, ' ')} | ${humanReadable(rank).padStart(9, ' ')} | ${humanReadable(Math.round(expr.evaluate({ rank: rank, badges: badgeAmount }))).padStart(9, ' ')} | Specified rank\n`;
			}

			if (desiredrank) {
				content += '--------------------------------\n';

				let minRank = 1;
				let maxRank = user.pp.rank;

				if (rank) {
					maxRank = rank;
				}

				let resultingRank = expr.evaluate({ rank: Math.round((maxRank + minRank) / 2), badges: badgeAmount });

				let iterator = 0;
				while (resultingRank !== desiredrank && iterator < 100) {
					iterator++;

					if (resultingRank > desiredrank) {
						maxRank = Math.round((maxRank + minRank) / 2);
					} else {
						minRank = Math.round((maxRank + minRank) / 2);
					}

					resultingRank = expr.evaluate({ rank: Math.round((maxRank + minRank) / 2), badges: badgeAmount });
				}

				content += `${badgeAmount.toString().padStart(7, ' ')} | ${humanReadable(Math.round((maxRank + minRank) / 2)).padStart(9, ' ')} | ${humanReadable(Math.round(expr.evaluate({ rank: Math.round((maxRank + minRank) / 2), badges: badgeAmount }))).padStart(9, ' ')} | Specified desired rank\n`;
			}

			if (badges) {
				content += '--------------------------------\n';
				content += `${badges.toString().padStart(7, ' ')} | ${humanReadable(user.pp.rank).padStart(9, ' ')} | ${humanReadable(Math.round(expr.evaluate({ rank: user.pp.rank, badges: badges }))).padStart(9, ' ')} | Specified badges\n`;
			}

			if (rank && badges) {
				content += '--------------------------------\n';
				content += `${badges.toString().padStart(7, ' ')} | ${humanReadable(rank).padStart(9, ' ')} | ${humanReadable(Math.round(expr.evaluate({ rank: rank, badges: badges }))).padStart(9, ' ')} | Specified rank & badges\n`;
			}

			if (desiredrank && badges) {
				content += '--------------------------------\n';

				let minRank = 1;
				let maxRank = user.pp.rank;

				if (rank) {
					maxRank = rank;
				}

				let resultingRank = Math.round(expr.evaluate({ rank: Math.round((maxRank + minRank) / 2), badges: badges }));

				let iterator = 0;
				while (resultingRank !== desiredrank && iterator < 100) {
					iterator++;

					if (resultingRank > desiredrank) {
						maxRank = Math.round((maxRank + minRank) / 2);
					} else {
						minRank = Math.round((maxRank + minRank) / 2);
					}

					resultingRank = Math.round(expr.evaluate({ rank: Math.round((maxRank + minRank) / 2), badges: badges }));
				}

				content += `${badges.toString().padStart(7, ' ')} | ${humanReadable(Math.round((maxRank + minRank) / 2)).padStart(9, ' ')} | ${humanReadable(Math.round(expr.evaluate({ rank: Math.round((maxRank + minRank) / 2), badges: badges }))).padStart(9, ' ')} | Specified desired rank & badges\n`;
			}

			content += '```';

			return await interaction.followUp(content);
		})
		.catch(err => {
			if (err.message === 'Not found') {
				return interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
			} else {
				console.error(err);
			}
		});
}