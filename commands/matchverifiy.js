const { DBOsuMultiScores, DBDiscordUsers, DBDuelRatingHistory } = require('../dbObjects');
const { showUnknownInteractionError, developers } = require('../config.json');
const { Op } = require('sequelize');

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
			let unverifiedScores = await DBOsuMultiScores.findAll({
				Attributes: ['matchId', 'matchName'],
				where: {
					matchEndDate: {
						[Op.not]: null,
					},
					verifiedAt: null,
				},
				group: ['matchId', 'matchName'],
				order: [
					['matchStartDate', 'DESC'],
				],
				limit: 10,
			});

			let unverifiedScoresEmbed = {
				title: 'Unverified Scores',
				description: 'The following scores have not been verified yet.',
				fields: [],
			};

			for (let i = 0; i < unverifiedScores.length; i++) {
				let score = unverifiedScores[i];
				unverifiedScoresEmbed.fields.push({
					name: score.matchName,
					value: `https://osu.ppy.sh/mp/${score.matchId}`,
					inline: false,
				});
			}

			await interaction.editReply({ embeds: [unverifiedScoresEmbed] });
		} else if (interaction.options._subcommand === 'update') {
			let matchId = interaction.options.getString('id');
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

			let scores = await DBOsuMultiScores.findAll({
				where: {
					matchId: matchId,
				},
			});

			if (!developers.includes(interaction.user.id)) {
				for (let i = 0; i < scores.length; i++) {
					let score = scores[i];
					if (score.osuUserId === discordUser.osuUserId) {
						return await interaction.editReply('You cannot verify your own scores.');
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
					tourneyMatchChangedString = '**Changed**: ';
				}

				score.tourneyMatch = valid;
				score.verifiedAt = new Date();
				score.verifiedBy = discordUser.osuUserId;
				score.verificationComment = comment;
				await score.save();
			}

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
				interaction.guild.channels.cache.get('1068905937219362826').send(`${tourneyMatchChangedString} - Valid: ${valid} https://osu.ppy.sh/mp/${matchId} was verified by ${interaction.user.username}#${interaction.user.discriminator} (<@${interaction.user.id}> | <https://osu.ppy.sh/users/${discordUser.osuUserId}>)`);
			}

			await interaction.editReply(`Updated ${scores.length} scores.`);
		}
	}
};