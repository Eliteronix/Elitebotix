const { DBDiscordUsers, DBDuelRatingHistory, DBOsuMultiGameScores, DBOsuMultiMatches, DBOsuMultiGames } = require('../dbObjects');
const { showUnknownInteractionError, developers } = require('../config.json');
const { Op } = require('sequelize');
const { getIDFromPotentialOsuLink, humanReadable, getOsuPlayerName, createLeaderboard, getOsuBeatmap, pause, logOsuAPICalls } = require('../utils');
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const osu = require('node-osu');
const matchIdsGettingProcessed = [];

module.exports = {
	name: 'matchverify',
	description: 'Allows for managing the validity of a match',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'debug',
	data: new SlashCommandBuilder()
		.setName('matchverify')
		.setNameLocalizations({
			'de': 'matchverifikation',
			'en-GB': 'matchverify',
			'en-US': 'matchverify',
		})
		.setDescription('Allows for managing the validity of a match')
		.setDescriptionLocalizations({
			'de': 'Ermöglicht das Verwalten der Gültigkeit eines Matches',
			'en-GB': 'Allows for managing the validity of a match',
			'en-US': 'Allows for managing the validity of a match',
		})
		.setDefaultMemberPermissions('0')
		.setDMPermission(false)
		.addSubcommand(subcommand =>
			subcommand
				.setName('update')
				.setDescription('Allows for updating the validity of a match')
				.setDescriptionLocalizations({
					'de': 'Ermöglicht das Aktualisieren der Gültigkeit eines Matches',
					'en-GB': 'Allows for updating the validity of a match',
					'en-US': 'Allows for updating the validity of a match',
				})
				.addStringOption(option =>
					option.setName('id')
						.setDescription('The match id')
						.setDescriptionLocalizations({
							'de': 'Die Match ID',
							'en-GB': 'The match id',
							'en-US': 'The match id',
						})
						.setRequired(true)
				)
				.addBooleanOption(option =>
					option.setName('valid')
						.setNameLocalizations({
							'de': 'gültig',
							'en-GB': 'valid',
							'en-US': 'valid',
						})
						.setDescription('Is the match valid or not?')
						.setDescriptionLocalizations({
							'de': 'Ist das Match gültig oder nicht?',
							'en-GB': 'Is the match valid or not?',
							'en-US': 'Is the match valid or not?',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('comment')
						.setNameLocalizations({
							'de': 'kommentar',
							'en-GB': 'comment',
							'en-US': 'comment',
						})
						.setDescription('Why is the match valid or not?')
						.setDescriptionLocalizations({
							'de': 'Warum ist das Match gültig oder nicht?',
							'en-GB': 'Why is the match valid or not?',
							'en-US': 'Why is the match valid or not?',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('check')
				.setNameLocalizations({
					'de': 'prüfen',
					'en-GB': 'check',
					'en-US': 'check',
				})
				.setDescription('Checks details about a match')
				.setDescriptionLocalizations({
					'de': 'Prüft Details zu einem Match',
					'en-GB': 'Checks details about a match',
					'en-US': 'Checks details about a match',
				})
				.addStringOption(option =>
					option.setName('id')
						.setDescription('The match id')
						.setDescriptionLocalizations({
							'de': 'Die Match ID',
							'en-GB': 'The match id',
							'en-US': 'The match id',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('acronym')
						.setNameLocalizations({
							'de': 'akronym',
							'en-GB': 'acronym',
							'en-US': 'acronym',
						})
						.setDescription('The actual acronym of the match')
						.setDescriptionLocalizations({
							'de': 'Das tatsächliche Akronym des Matches',
							'en-GB': 'The actual acronym of the match',
							'en-US': 'The actual acronym of the match',
						})
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setNameLocalizations({
					'de': 'liste',
					'en-GB': 'list',
					'en-US': 'list',
				})
				.setDescription('Lists all the matches that need to be verified')
				.setDescriptionLocalizations({
					'de': 'Listet alle Matches auf, die verifiziert werden müssen',
					'en-GB': 'Lists all the matches that need to be verified',
					'en-US': 'Lists all the matches that need to be verified',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('leaderboard')
				.setNameLocalizations({
					'de': 'rangliste',
					'en-GB': 'leaderboard',
					'en-US': 'leaderboard',
				})
				.setDescription('Show a leaderboard of hardest working verifiers')
				.setDescriptionLocalizations({
					'de': 'Zeigt eine Rangliste der fleißigsten Verifizierer',
					'en-GB': 'Show a leaderboard of hardest working verifiers',
					'en-US': 'Show a leaderboard of hardest working verifiers',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tournament')
				.setNameLocalizations({
					'de': 'turnier',
					'en-GB': 'tournament',
					'en-US': 'tournament',
				})
				.setDescription('Shows all unverified matches of a tournament')
				.setDescriptionLocalizations({
					'de': 'Zeigt alle unverifizierten Matches eines Turniers',
					'en-GB': 'Shows all unverified matches of a tournament',
					'en-US': 'Shows all unverified matches of a tournament',
				})
				.addStringOption(option =>
					option.setName('acronym')
						.setNameLocalizations({
							'de': 'akronym',
							'en-GB': 'acronym',
							'en-US': 'acronym',
						})
						.setDescription('The acronym of the tournament')
						.setDescriptionLocalizations({
							'de': 'Das Akronym des Turniers',
							'en-GB': 'The acronym of the tournament',
							'en-US': 'The acronym of the tournament',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('player')
				.setNameLocalizations({
					'de': 'spieler',
					'en-GB': 'player',
					'en-US': 'player',
				})
				.setDescription('Shows all unverified matches of a player')
				.setDescriptionLocalizations({
					'de': 'Zeigt alle unverifizierten Matches eines Spielers',
					'en-GB': 'Shows all unverified matches of a player',
					'en-US': 'Shows all unverified matches of a player',
				})
				.addStringOption(option =>
					option.setName('player')
						.setNameLocalizations({
							'de': 'spieler',
							'en-GB': 'player',
							'en-US': 'player',
						})
						.setDescription('The name of the player')
						.setDescriptionLocalizations({
							'de': 'Der Name des Spielers',
							'en-GB': 'The name of the player',
							'en-US': 'The name of the player',
						})
						.setRequired(true)
				)
		),
	async execute(interaction) {
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

		if (interaction.options.getSubcommand() === 'list') {
			let acronyms = await DBOsuMultiMatches.findAll({
				attributes: [
					'acronym',
					[DBOsuMultiMatches.sequelize.fn('COUNT', DBOsuMultiMatches.sequelize.col('acronym')), 'count'],
				],
				where: {
					matchEndDate: {
						[Op.not]: null,
					},
					verifiedAt: null,
					tourneyMatch: true,
					matchId: {
						[Op.notIn]: matchIdsGettingProcessed,
					},
				},
				group: ['acronym'],
				order: [
					[DBOsuMultiMatches.sequelize.fn('COUNT', DBOsuMultiMatches.sequelize.col('acronym')), 'DESC'],
					['acronym', 'ASC'],
				],
				limit: 50000,
			});

			acronyms = acronyms.map(acronym => {
				return {
					acronym: acronym.acronym,
					count: acronym.get('count'),
				};
			});

			let first20Acronyms = acronyms.slice(0, 20);

			let unverifiedScores = await DBOsuMultiMatches.findAll({
				attributes: ['matchId', 'matchName', 'acronym', 'verificationComment'],
				where: {
					matchEndDate: {
						[Op.not]: null,
					},
					verifiedAt: null,
					tourneyMatch: true,
					matchId: {
						[Op.notIn]: matchIdsGettingProcessed,
					},
					acronym: {
						[Op.in]: first20Acronyms.map(acronym => acronym.acronym),
					},
				},
				limit: 100,
			});

			// Order by acronym count DESC

			let orderedUnverifiedScores = [];
			for (let i = 0; i < acronyms.length; i++) {
				let acronym = acronyms[i].acronym;
				let acronymScores = unverifiedScores.filter((score) => score.acronym === acronym);

				orderedUnverifiedScores = orderedUnverifiedScores.concat(acronymScores);
			}

			let unverifiedScoresEmbed = {
				title: 'Unverified Scores',
				description: 'The following scores have not been verified yet.',
			};

			let unverifiedMatchesLeft = await DBOsuMultiMatches.count({
				where: {
					matchEndDate: {
						[Op.not]: null,
					},
					verifiedAt: null,
					matchId: {
						[Op.notIn]: matchIdsGettingProcessed,
					},
				},
				group: ['matchId'],
			});

			for (let i = 0; i < orderedUnverifiedScores.length; i++) {
				if (i % 25 === 0) {
					if (i !== 0) {
						await interaction.followUp({ embeds: [unverifiedScoresEmbed] });
					}

					unverifiedScoresEmbed.footer = {
						text: `There are ${humanReadable(unverifiedMatchesLeft.length)} unverified matches left.`,
					};

					unverifiedScoresEmbed.fields = [];
				}

				let score = orderedUnverifiedScores[i];

				let comment = 'No comment available yet.';

				if (score.verificationComment) {
					comment = score.verificationComment;
				}

				unverifiedScoresEmbed.fields.push({
					name: score.matchName,
					value: `[${comment}](<https://osu.ppy.sh/mp/${score.matchId}>)`,
					inline: false,
				});

				if (i === orderedUnverifiedScores.length - 1) {
					await interaction.followUp({ embeds: [unverifiedScoresEmbed] });
				}
			}

			unverifiedScores = unverifiedScores.map(score => `https://osu.ppy.sh/mp/${score.matchId}`);

			await interaction.followUp({ files: [new AttachmentBuilder(Buffer.from(unverifiedScores.join('\n'), 'utf-8'), { name: 'unverified-scores.txt' })] });
		} else if (interaction.options.getSubcommand() === 'update') {
			let matchIds = interaction.options.getString('id').split(/ +/);
			let valid = interaction.options.getBoolean('valid');
			let comment = interaction.options.getString('comment');

			let discordUser = await DBDiscordUsers.findOne({
				attributes: ['osuUserId'],
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

			for (let i = 0; i < matchIds.length; i++) {
				matchIdsGettingProcessed.push(getIDFromPotentialOsuLink(matchIds[i]));
			}

			for (let matchIndex = 0; matchIndex < matchIds.length; matchIndex++) {
				try {
					let matchId = getIDFromPotentialOsuLink(matchIds[matchIndex]);

					let match = await DBOsuMultiMatches.findOne({
						attributes: ['matchId', 'matchName', 'matchStartDate'],
						where: {
							matchId: matchId,
						},
					});

					let scores = await DBOsuMultiGameScores.findAll({
						attributes: ['osuUserId', 'tourneyMatch'],
						where: {
							matchId: matchId,
						},
					});

					if (!developers.includes(interaction.user.id)) {
						let ownScore = scores.find(score => score.osuUserId === discordUser.osuUserId);

						if (ownScore) {
							await interaction.followUp('You cannot verify your own scores.');

							while (matchIdsGettingProcessed.includes(matchId)) {
								matchIdsGettingProcessed.splice(matchIdsGettingProcessed.indexOf(matchId), 1);
							}

							continue;
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
					}

					if (match.tourneyMatch !== valid) {
						tourneyMatchChanged = true;
						tourneyMatchChangedString = 'ini\n[Changed]``````';
					}

					await DBOsuMultiMatches.update({
						tourneyMatch: valid,
						verifiedAt: new Date(),
						verifiedBy: discordUser.osuUserId,
						verificationComment: comment,
					}, {
						where: {
							matchId: matchId,
							[Op.or]: [
								{
									tourneyMatch: {
										[Op.not]: valid,
									},
								},
								{
									verifiedAt: null,
								},
								{
									verifiedBy: '31050083'
								},
							],
						},
					});

					let gamesUpdated = await DBOsuMultiGames.update({
						tourneyMatch: valid,
					}, {
						where: {
							matchId: matchId,
							tourneyMatch: {
								[Op.not]: valid,
							},
						},
					});

					await DBOsuMultiGameScores.update({
						tourneyMatch: valid,
					}, {
						where: {
							matchId: matchId,
							tourneyMatch: {
								[Op.not]: valid,
							},
						},
					});

					if (tourneyMatchChanged) {
						let ratingHistories = await DBDuelRatingHistory.findAll({
							attributes: ['id', 'date', 'month', 'year'],
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

							if (ratingHistoryDate > new Date(match.matchStartDate)) {
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

					let validString = '-';

					if (valid) {
						validString = '+';
					}

					let channelId = '1068905937219362826';

					if (process.env.SERVER === 'Dev') {
						channelId = '1070013925334204516';
					}

					await interaction.guild.channels.cache.get(channelId).send({ content: `\`\`\`${tourneyMatchChangedString}diff\n${validString} Valid: ${valid}\nComment: ${comment}\`\`\`https://osu.ppy.sh/mp/${matchId} was verified by ${interaction.user.username}#${interaction.user.discriminator} (<@${interaction.user.id}> | <https://osu.ppy.sh/users/${discordUser.osuUserId}>)`, allowedMentions: { 'users': [] } });

					await interaction.followUp(`Updated ${gamesUpdated[0]} games and ${scores.length} scores for https://osu.ppy.sh/mp/${matchId}`);
				} catch (error) {
					if (error.message !== 'Invalid Webhook Token') {
						console.error(error);
					}
				}

				await pause(3000);
			}
			try {
				await interaction.editReply('Done processing.');
			} catch (error) {
				if (error.message !== 'Invalid Webhook Token') {
					console.error(error);
				}
			}
		} else if (interaction.options.getSubcommand() === 'check') {
			let matchId = getIDFromPotentialOsuLink(interaction.options.getString('id'));
			let acronym = interaction.options.getString('acronym');

			let scores = await DBOsuMultiGameScores.findAll({
				attributes: ['matchId', 'beatmapId', 'osuUserId', 'gameId'],
				where: {
					matchId: matchId,
				},
				order: [
					['gameId', 'ASC'],
				],
			});

			if (scores.length === 0) {
				return await interaction.editReply(`No scores found for https://osu.ppy.sh/mp/${matchId}`);
			}

			let match = await DBOsuMultiMatches.findOne({
				attributes: ['matchName', 'acronym', 'matchStartDate'],
				where: {
					matchId: matchId,
				},
			});

			if (!match) {
				return await interaction.editReply(`No match found for https://osu.ppy.sh/mp/${matchId}`);
			}

			if (!acronym) {
				acronym = match.acronym;
			}

			let mapsPlayed = [];
			let players = [];

			for (let i = 0; i < scores.length; i++) {
				let score = scores[i];

				if (!mapsPlayed.includes(score.beatmapId)) {
					mapsPlayed.push(score.beatmapId);
				}

				if (!players.includes(score.osuUserId)) {
					players.push(score.osuUserId);
				}
			}

			let weeksBeforeMatch = new Date(match.matchStartDate);
			weeksBeforeMatch.setDate(weeksBeforeMatch.getDate() - 21);

			let weeksAfterMatch = new Date(match.matchStartDate);
			weeksAfterMatch.setDate(weeksAfterMatch.getDate() + 21);

			let relatedMatches = await DBOsuMultiMatches.findAll({
				attributes: ['matchId'],
				where: {
					matchStartDate: {
						[Op.between]: [weeksBeforeMatch, weeksAfterMatch],
					},
					acronym: acronym
				},
			});

			let relatedScores = await DBOsuMultiGameScores.findAll({
				attributes: ['matchId', 'beatmapId', 'osuUserId'],
				where: {
					[Op.or]: [
						{
							beatmapId: {
								[Op.in]: mapsPlayed,
							},
						},
						{
							osuUserId: {
								[Op.in]: players,
							},
						},
					],
					matchId: {
						[Op.in]: relatedMatches.map((match) => match.matchId),
					},
				},
			});

			let embed = new EmbedBuilder()
				.setTitle(match.matchName)
				.setURL(`https://osu.ppy.sh/mp/${matchId}`)
				.setColor('#ff0000')
				.setTimestamp();

			for (let i = 0; i < mapsPlayed.length; i++) {
				if (i % 25 === 0 && i !== 0) {
					await interaction.followUp({ embeds: [embed] });

					embed = new EmbedBuilder()
						.setTitle(match.matchName)
						.setURL(`https://osu.ppy.sh/mp/${matchId}`)
						.setColor('#ff0000')
						.setTimestamp();
				}

				let mapScores = relatedScores.filter((score) => score.beatmapId === mapsPlayed[i] && score.matchId !== matchId);

				let beatmap = await getOsuBeatmap({ beatmapId: mapsPlayed[i] });

				if (!beatmap || !beatmap.artist || !beatmap.title || !beatmap.difficulty) {
					beatmap = {
						artist: 'Unknown',
						title: 'Unknown',
						difficulty: 'Unknown',
					};
				}

				embed.addFields([{
					name: `Map ${i + 1} | ${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] | https://osu.ppy.sh/b/${mapsPlayed[i]}`,
					value: `${mapScores.length} scores found for this map with the same acronym.`,
				}]);
			}

			await interaction.followUp({ embeds: [embed] });

			embed = new EmbedBuilder()
				.setTitle(match.matchName)
				.setURL(`https://osu.ppy.sh/mp/${matchId}`)
				.setColor('#ff0000')
				.setTimestamp();

			for (let i = 0; i < players.length; i++) {
				let playerScores = relatedScores.filter((score) => score.osuUserId === players[i] && score.matchId !== matchId);

				if (i % 25 === 0 && i !== 0) {
					await interaction.followUp({ embeds: [embed] });

					embed = new EmbedBuilder()
						.setTitle(match.matchName)
						.setURL(`https://osu.ppy.sh/mp/${matchId}`)
						.setColor('#ff0000')
						.setTimestamp();
				}

				embed.addFields([{
					name: `Player ${i + 1} | ${await getOsuPlayerName(players[i])} | https://osu.ppy.sh/users/${players[i]}`,
					value: `${playerScores.length} scores found for this player with the same acronym.`,
				}]);
			}

			await interaction.followUp({ embeds: [embed] });
		} else if (interaction.options.getSubcommand() === 'leaderboard') {
			let counts = await DBOsuMultiMatches.findAll({
				attributes: ['verifiedBy', 'matchId'],
				where: {
					verifiedAt: {
						[Op.ne]: null,
					},
				},
				group: ['verifiedBy', 'matchId'],
			});

			counts = counts.map((count) => {
				return {
					verifiedBy: count.verifiedBy,
					count: 1,
				};
			});

			// Sort by count
			counts.sort((a, b) => {
				return b.count - a.count;
			});

			let leaderboardData = [];

			for (let i = 0; i < counts.length; i++) {
				let count = counts[i];

				let existingLeaderboardData = leaderboardData.find((leaderboardData) => {
					return leaderboardData.osuUserId === count.verifiedBy;
				});

				if (existingLeaderboardData) {
					existingLeaderboardData.value += count.count;
				} else {
					leaderboardData.push({
						name: await getOsuPlayerName(count.verifiedBy),
						value: count.count,
						osuUserId: count.verifiedBy,
					});
				}
			}

			// Sort by count
			leaderboardData.sort((a, b) => {
				return b.value - a.value;
			});

			for (let i = 0; i < leaderboardData.length; i++) {
				let leaderboardDataItem = leaderboardData[i];

				leaderboardDataItem.value = leaderboardDataItem.value + ' match' + (leaderboardDataItem.value === 1 ? '' : 'es');
			}

			const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', 'Top Match Verifiers', 'top-match-verifiers.png');

			await interaction.editReply({ files: [attachment] });
		} else if (interaction.options.getSubcommand() === 'tournament') {
			let acronym = interaction.options.getString('acronym', true);

			let userScores = await DBOsuMultiMatches.findAll({
				attributes: ['matchId', 'matchStartDate', 'matchName', 'verificationComment'],
				where: {
					acronym: acronym,
					tourneyMatch: true,
					verifiedAt: null,
					matchEndDate: {
						[Op.not]: null,
					},
					matchId: {
						[Op.notIn]: matchIdsGettingProcessed,
					},
				},
				group: ['matchId', 'matchStartDate', 'matchName', 'verificationComment'],
				order: [
					['matchId', 'DESC'],
				],
			});

			if (userScores.length === 0) {
				return await interaction.editReply(`No scores found for the acronym \`${acronym.replace(/`/g, '')}\`.`);
			}

			let matchesPlayed = userScores.map((score) => `${(new Date(score.matchStartDate).getUTCMonth() + 1).toString().padStart(2, '0')}-${new Date(score.matchStartDate).getUTCFullYear()} - ${score.matchName} - ${score.verificationComment} ----- https://osu.ppy.sh/community/matches/${score.matchId}`);

			matchesPlayed = new AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${acronym}.txt` });

			await interaction.editReply({ content: `All matches found for the acronym \`${acronym.replace(/`/g, '')}\` are attached.`, files: [matchesPlayed] });
		} else if (interaction.options.getSubcommand() === 'player') {
			let player = getIDFromPotentialOsuLink(interaction.options.getString('player', true));

			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			let user = null;

			try {
				logOsuAPICalls('commands/matchverify.js');
				user = await osuApi.getUser({ u: player });
			} catch (error) {
				return await interaction.editReply(`Could not find user \`${player.replace(/`/g, '')}\`.`);
			}

			let userScores = await DBOsuMultiGameScores.findAll({
				attributes: ['matchId'],
				where: {
					osuUserId: user.id,
					tourneyMatch: true,
					matchId: {
						[Op.notIn]: matchIdsGettingProcessed,
					},
				},
				group: ['matchId'],
			});

			if (userScores.length === 0) {
				return await interaction.editReply(`No scores found for the player \`${player.replace(/`/g, '')}\`.`);
			}

			let matches = await DBOsuMultiMatches.findAll({
				attributes: ['matchId', 'matchStartDate', 'matchName', 'verificationComment'],
				where: {
					tourneyMatch: true,
					verifiedAt: null,
					matchEndDate: {
						[Op.not]: null,
					},
					matchId: {
						[Op.in]: userScores.map((score) => score.matchId),
					},
				},
				group: ['matchId', 'matchStartDate', 'matchName', 'verificationComment'],
				order: [
					['matchId', 'DESC'],
				],
			});

			if (matches.length === 0) {
				return await interaction.editReply(`No matches found for the player \`${player.replace(/`/g, '')}\`.`);
			}

			let matchesPlayed = matches.map((match) => `${(new Date(match.matchStartDate).getUTCMonth() + 1).toString().padStart(2, '0')}-${new Date(match.matchStartDate).getUTCFullYear()} - ${match.matchName} - ${match.verificationComment} ----- https://osu.ppy.sh/community/matches/${match.matchId}`);

			matchesPlayed = new AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${user.id}.txt` });

			await interaction.editReply({ content: `All matches found for the player \`${player.replace(/`/g, '')}\` are attached.`, files: [matchesPlayed] });
		}
	}
};