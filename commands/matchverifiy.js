const { DBOsuMultiScores, DBDiscordUsers, DBDuelRatingHistory } = require('../dbObjects');
const { showUnknownInteractionError, developers } = require('../config.json');
const { Op } = require('sequelize');
const { getIDFromPotentialOsuLink, humanReadable } = require('../utils');

module.exports = {
	name: 'matchverify',
	description: 'Allows for managing the validity of a match',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'debug',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		if (interaction.options._subcommand === 'list') {
			let matchNames = await DBOsuMultiScores.findAll({
				Attributes: ['matchName'],
				where: {
					matchEndDate: {
						[Op.not]: null,
					},
					verifiedAt: null,
					tourneyMatch: true,
				},
				group: ['matchName'],
				limit: 10000,
			});

			let acronyms = [];
			for (let i = 0; i < matchNames.length; i++) {
				let matchAcronym = matchNames[i].matchName.replace(/:.*/gm, '').trim();

				let existingAcronym = acronyms.find((acronym) => acronym.acronym === matchAcronym);

				if (existingAcronym) {
					existingAcronym.count++;
				} else {
					acronyms.push({
						acronym: matchAcronym,
						count: 1,
					});
				}
			}

			//Sort acronyms by count ASC
			acronyms.sort((a, b) => {
				return a.count - b.count;
			});

			let unverifiedScores = await DBOsuMultiScores.findAll({
				Attributes: ['matchId', 'matchName'],
				where: {
					matchEndDate: {
						[Op.not]: null,
					},
					verifiedAt: null,
					tourneyMatch: true,
					[Op.or]: [
						{
							matchName: {
								[Op.like]: `%${acronyms[0].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[1].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[2].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[3].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[4].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[5].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[6].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[7].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[8].acronym}%`,
							},
						},
						{
							matchName: {
								[Op.like]: `%${acronyms[9].acronym}%`,
							},
						},
					],
				},
				group: ['matchId', 'matchName'],
				order: [
					['matchStartDate', 'DESC'],
				],
				limit: 100,
			});

			let unverifiedScoresEmbed = {
				title: 'Unverified Scores',
				description: 'The following scores have not been verified yet.',
			};

			let unverifiedScoresLeft = await DBOsuMultiScores.count({
				where: {
					matchEndDate: {
						[Op.not]: null,
					},
					verifiedAt: null,
				},
				group: ['matchId'],
			});

			for (let i = 0; i < unverifiedScores.length; i++) {
				if (i % 25 === 0 || i === unverifiedScores.length - 1) {
					if (i !== 0) {
						await interaction.followUp({ embeds: [unverifiedScoresEmbed] });
					}

					unverifiedScoresEmbed.footer = {
						text: `There are ${humanReadable(unverifiedScoresLeft.length)} unverified matches left.`,
					};

					unverifiedScoresEmbed.fields = [];
				}

				let score = unverifiedScores[i];
				unverifiedScoresEmbed.fields.push({
					name: score.matchName,
					value: `https://osu.ppy.sh/mp/${score.matchId}`,
					inline: false,
				});
			}
		} else if (interaction.options._subcommand === 'update') {
			let matchIds = interaction.options.getString('id').split(/ +/);
			let valid = interaction.options.getBoolean('valid');
			let comment = interaction.options.getString('comment');

			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id,
					osuUserId: {
						[Op.not]: null,
					},
					osuVerified: true,
				},
			});

			if (!discordUser) {
				return await interaction.editReply('You need to connect and verify your osu! account first to use this command.');
			}

			await interaction.editReply('Processing...');

			for (let matchIndex = 0; matchIndex < matchIds.length; matchIndex++) {
				try {
					let matchId = getIDFromPotentialOsuLink(matchIds[matchIndex]);

					let scores = await DBOsuMultiScores.findAll({
						where: {
							matchId: matchId,
						},
					});

					if (!developers.includes(interaction.user.id)) {
						for (let i = 0; i < scores.length; i++) {
							let score = scores[i];
							if (score.osuUserId === discordUser.osuUserId) {
								await interaction.followUp('You cannot verify your own scores.');
								continue;
							}
						}
					}

					let updatedUsers = [];
					let tourneyMatchChanged = false;
					let tourneyMatchChangedString = '';

					for (let i = 0; i < scores.length; i++) {
						let score = scores[i];

						if (!updatedUsers.includes(score.osuUserId)) {
							updatedUsers.push(score.osuUserId);
						}

						if (score.tourneyMatch !== valid) {
							tourneyMatchChanged = true;
							tourneyMatchChangedString = '**Changed**: - ';
						}
					}

					await DBOsuMultiScores.update({
						tourneyMatch: valid,
						verifiedAt: new Date(),
						verifiedBy: discordUser.osuUserId,
						verificationComment: comment,
					}, {
						where: {
							matchId: matchId,
						},
					});

					if (tourneyMatchChanged) {
						let ratingHistories = await DBDuelRatingHistory.findAll({
							where: {
								osuUserId: {
									[Op.in]: updatedUsers,
								},
							},
						});

						for (let i = 0; i < ratingHistories.length; i++) {
							let ratingHistory = ratingHistories[i];

							let ratingHistoryDate = new Date();
							ratingHistoryDate.setUTCDate(ratingHistory.date);
							ratingHistoryDate.setUTCMonth(ratingHistory.month - 1);
							ratingHistoryDate.setUTCFullYear(ratingHistory.year);

							if (ratingHistoryDate > new Date(scores[0].matchStartDate)) {
								await ratingHistory.destroy();
							}
						}

						await DBDiscordUsers.update({
							lastDuelRatingUpdate: null,
						}, {
							where: {
								osuUserId: {
									[Op.in]: updatedUsers,
								},
							},
						});
					}

					// eslint-disable-next-line no-undef
					if (process.env.SERVER === 'Live') {
						interaction.guild.channels.cache.get('1068905937219362826').send(`${tourneyMatchChangedString}Valid: ${valid} | Comment: ${comment} | https://osu.ppy.sh/mp/${matchId} was verified by ${interaction.user.username}#${interaction.user.discriminator} (<@${interaction.user.id}> | <https://osu.ppy.sh/users/${discordUser.osuUserId}>)`);
						// eslint-disable-next-line no-undef
					} else if (process.env.SERVER === 'Dev') {
						interaction.guild.channels.cache.get('1070013925334204516').send(`${tourneyMatchChangedString}Valid: ${valid} | Comment: ${comment} | https://osu.ppy.sh/mp/${matchId} was verified by ${interaction.user.username}#${interaction.user.discriminator} (<@${interaction.user.id}> | <https://osu.ppy.sh/users/${discordUser.osuUserId}>)`);
					}

					await interaction.followUp(`Updated ${scores.length} scores for https://osu.ppy.sh/mp/${matchId}`);
				} catch (error) {
					if (error.message !== 'Invalid Webhook Token') {
						console.error(error);
					}
				}
			}

			await interaction.editReply('Done processing.');
		}
	}
};