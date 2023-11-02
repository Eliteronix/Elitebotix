const { DBOsuMultiScores, DBDiscordUsers } = require('../../dbObjects');
const { logDatabaseQueries, logOsuAPICalls } = require('../../utils');
const { Op } = require('sequelize');
const { daysHidingQualifiers } = require('../../config.json');

module.exports = {
	name: 'reffedMatches',
	usage: '<username>',
	async execute(interaction) {
		let username = interaction.options.getString('argument');

		//Get the user from the database if possible
		logDatabaseQueries(4, 'commands/admin/reffedMatches.js DBDiscordUsers 1');
		let discordUser = await DBDiscordUsers.findOne({
			where: {
				[Op.or]: {
					osuUserId: username,
					osuName: username,
					userId: username.replace('<@', '').replace('>', '').replace('!', ''),
				}
			}
		});

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
				logOsuAPICalls('commands/admin/reffedMatches.js');
				const user = await osuApi.getUser({ u: username });
				osuUser.osuUserId = user.id;
				osuUser.osuName = user.name;
			} catch (error) {
				console.error(error);
				await interaction.followUp({ content: `Could not find user \`${username.replace(/`/g, '')}\`.`, ephemeral: true });
			}
		}


		logDatabaseQueries(4, 'commands/admin/reffedMatches.js DBOsuMultiScores');
		const reffedScores = await DBOsuMultiScores.findAll({
			attributes: ['matchId', 'matchName', 'matchStartDate'],
			where: {
				tourneyMatch: true,
				warmup: false,
				referee: osuUser.osuUserId,
			},
			group: ['matchId', 'matchName', 'matchStartDate'],
		});

		if (!reffedScores.length) {
			return await interaction.editReply(`No reffed matches found for \`${osuUser.osuName}\`.`);
		}

		//Bubblesort userscores by matchId property descending
		reffedScores.sort((a, b) => {
			if (parseInt(a.matchId) > parseInt(b.matchId)) {
				return -1;
			}
			if (parseInt(a.matchId) < parseInt(b.matchId)) {
				return 1;
			}
			return 0;
		});

		let hideQualifiers = new Date();
		hideQualifiers.setUTCDate(hideQualifiers.getUTCDate() - daysHidingQualifiers);

		let reffedMatches = [];
		for (let i = 0; i < reffedScores.length; i++) {
			//Push matches for the history txt
			let date = new Date(reffedScores[i].matchStartDate);

			if (date > hideQualifiers && reffedScores[i].matchName.toLowerCase().includes('qualifier')) {
				reffedScores[i].matchId = `XXXXXXXXX (hidden for ${daysHidingQualifiers} days)`;
			}

			if (!reffedMatches.includes(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${reffedScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${reffedScores[i].matchId}`)) {
				reffedMatches.push(`${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCFullYear()} - ${reffedScores[i].matchName} ----- https://osu.ppy.sh/community/matches/${reffedScores[i].matchId}`);
			}
		}

		// eslint-disable-next-line no-undef
		reffedMatches = new Discord.AttachmentBuilder(Buffer.from(reffedMatches.join('\n'), 'utf-8'), { name: `multi-matches-reffed-${osuUser.osuUserId}.txt` });

		try {
			await interaction.editReply({ content: `All matches found reffed for \`${osuUser.osuName}\` are attached.`, files: [reffedMatches] });
		} catch (error) {
			if (error.message !== 'Unknown Message') {
				console.error(error);
			}
		}
	},
};