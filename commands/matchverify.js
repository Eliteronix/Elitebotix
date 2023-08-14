const { DBOsuMultiScores, DBDiscordUsers, DBDuelRatingHistory } = require('../dbObjects');
const { showUnknownInteractionError, developers } = require('../config.json');
const { Op } = require('sequelize');
const { getIDFromPotentialOsuLink, humanReadable, getOsuPlayerName, createLeaderboard, getOsuBeatmap, logDatabaseQueries, pause } = require('../utils');
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
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
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
			logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores list');
			let matchNames = await DBOsuMultiScores.findAll({
				Attributes: ['matchName'],
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
				group: ['matchName'],
				limit: 50000,
			});

			let acronyms = [];
			for (let i = 0; i < matchNames.length; i++) {
				let matchAcronym = matchNames[i].matchName.replace(/:.*/gm, '');

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

			logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores list unverifiedScores');
			let unverifiedScores = await DBOsuMultiScores.findAll({
				Attributes: ['matchId', 'matchName'],
				where: {
					matchEndDate: {
						[Op.not]: null,
					},
					verifiedAt: null,
					tourneyMatch: true,
					matchId: {
						[Op.notIn]: matchIdsGettingProcessed,
					},
					[Op.or]: [
						{
							matchName: {
								[Op.like]: `${acronyms[0].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[1].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[2].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[3].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[4].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[5].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[6].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[7].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[8].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[9].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[10].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[11].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[12].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[13].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[14].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[15].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[16].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[17].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[18].acronym}:%`,
							},
						},
						{
							matchName: {
								[Op.like]: `${acronyms[19].acronym}:%`,
							},
						},
					],
				},
				group: ['matchId', 'matchName'],
				limit: 100,
			});

			// Order by acronym count DESC

			let orderedUnverifiedScores = [];
			for (let i = 0; i < acronyms.length; i++) {
				let acronym = acronyms[i].acronym;
				let acronymScores = unverifiedScores.filter((score) => score.matchName.startsWith(acronym + ':'));

				orderedUnverifiedScores = orderedUnverifiedScores.concat(acronymScores);
			}

			let unverifiedScoresEmbed = {
				title: 'Unverified Scores',
				description: 'The following scores have not been verified yet.',
			};

			logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores list unverifiedScoresLeft');
			let unverifiedScoresLeft = await DBOsuMultiScores.count({
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
						text: `There are ${humanReadable(unverifiedScoresLeft.length)} unverified matches left.`,
					};

					unverifiedScoresEmbed.fields = [];
				}

				let score = orderedUnverifiedScores[i];

				let comment = 'No comment available yet.';

				if (score.verificationComment) {
					comment = score.verificationComment;
				}

				unverifiedScoresEmbed.fields.push({
					name: `[${score.matchName}](<https://osu.ppy.sh/mp/${score.matchId}>)`,
					value: comment,
					inline: false,
				});

				if (i === orderedUnverifiedScores.length - 1) {
					await interaction.followUp({ embeds: [unverifiedScoresEmbed] });
				}
			}

			unverifiedScores = unverifiedScores.map(score => `https://osu.ppy.sh/mp/${score.matchId}`);

			// eslint-disable-next-line no-undef
			await interaction.followUp({ files: [new AttachmentBuilder(Buffer.from(unverifiedScores.join('\n'), 'utf-8'), { name: 'unverified-scores.txt' })] });
		} else if (interaction.options.getSubcommand() === 'update') {
			let matchIds = interaction.options.getString('id').split(/ +/);
			let valid = interaction.options.getBoolean('valid');
			let comment = interaction.options.getString('comment');

			logDatabaseQueries(4, 'commands/matchverify.js DBDiscordUsers update discordUser');
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

					logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores update scores');
					let scores = await DBOsuMultiScores.findAll({
						attributes: ['osuUserId', 'matchId', 'tourneyMatch', 'matchStartDate'],
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

						if (score.tourneyMatch !== valid) {
							tourneyMatchChanged = true;
							tourneyMatchChangedString = 'ini\n[Changed]``````';
						}
					}

					logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores update update');
					await DBOsuMultiScores.update({
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
							],
						},
					});

					if (tourneyMatchChanged) {
						logDatabaseQueries(4, 'commands/matchverify.js DBDuelRatingHistory update ratingHistories');
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

							if (ratingHistoryDate > new Date(scores[0].matchStartDate)) {
								await ratingHistory.destroy();
							}
						}

						logDatabaseQueries(4, 'commands/matchverify.js DBDiscordUsers update update');
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

					// eslint-disable-next-line no-undef
					if (process.env.SERVER === 'Dev') {
						channelId = '1070013925334204516';
					}

					interaction.guild.channels.cache.get(channelId).send({ content: `\`\`\`${tourneyMatchChangedString}diff\n${validString} Valid: ${valid}\nComment: ${comment}\`\`\`https://osu.ppy.sh/mp/${matchId} was verified by ${interaction.user.username}#${interaction.user.discriminator} (<@${interaction.user.id}> | <https://osu.ppy.sh/users/${discordUser.osuUserId}>)`, allowedMentions: { 'users': [] } });

					await interaction.followUp(`Updated ${scores.length} scores for https://osu.ppy.sh/mp/${matchId}`);
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

			logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores check');
			let scores = await DBOsuMultiScores.findAll({
				attributes: ['matchId', 'matchName', 'beatmapId', 'osuUserId', 'gameId', 'matchStartDate'],
				where: {
					matchId: matchId,
				},
			});

			if (scores.length === 0) {
				return await interaction.editReply(`No scores found for https://osu.ppy.sh/mp/${matchId}`);
			}

			scores.sort((a, b) => {
				return a.gameId - b.gameId;
			});

			if (!acronym) {
				acronym = scores[0].matchName.replace(/:.*/gm, '');
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

			let weeksBeforeMatch = new Date(scores[0].matchStartDate);
			weeksBeforeMatch.setDate(weeksBeforeMatch.getDate() - 21);

			let weeksAfterMatch = new Date(scores[0].matchStartDate);
			weeksAfterMatch.setDate(weeksAfterMatch.getDate() + 21);

			logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores check relatedScores');
			let relatedScores = await DBOsuMultiScores.findAll({
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
					matchStartDate: {
						[Op.between]: [weeksBeforeMatch, weeksAfterMatch],
					},
					matchName: {
						[Op.like]: `${acronym}:%`,
					},
				},
			});

			let embed = new EmbedBuilder()
				.setTitle(scores[0].matchName)
				.setURL(`https://osu.ppy.sh/mp/${matchId}`)
				.setColor('#ff0000')
				.setTimestamp();

			for (let i = 0; i < mapsPlayed.length; i++) {
				if (i % 25 === 0 && i !== 0) {
					await interaction.followUp({ embeds: [embed] });

					embed = new EmbedBuilder()
						.setTitle(scores[0].matchName)
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
				.setTitle(scores[0].matchName)
				.setURL(`https://osu.ppy.sh/mp/${matchId}`)
				.setColor('#ff0000')
				.setTimestamp();

			for (let i = 0; i < players.length; i++) {
				let playerScores = relatedScores.filter((score) => score.osuUserId === players[i] && score.matchId !== matchId);

				if (i % 25 === 0 && i !== 0) {
					await interaction.followUp({ embeds: [embed] });

					embed = new EmbedBuilder()
						.setTitle(scores[0].matchName)
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
			logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores leaderboard');
			let counts = await DBOsuMultiScores.findAll({
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

			if (acronym.toLowerCase() === 'o!mm ranked'
				|| acronym.toLowerCase() === 'o!mm private'
				|| acronym.toLowerCase() === 'o!mm team ranked'
				|| acronym.toLowerCase() === 'o!mm team private'
				|| acronym.toLowerCase() === 'etx'
				|| acronym.toLowerCase() === 'etx teams') {
				return await interaction.editReply(`The acronym \`${acronym.replace(/`/g, '')}\` can't be used for this command.`);
			}

			logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores tournament');
			let userScores = await DBOsuMultiScores.findAll({
				attributes: ['matchId', 'matchStartDate', 'matchName', 'verificationComment'],
				where: {
					[Op.or]: [
						{
							matchName: {
								[Op.like]: `${acronym}:%`,
							},
						}, {
							matchName: {
								[Op.like]: `${acronym} :%`,
							}
						}
					],
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
			});

			if (userScores.length === 0) {
				return await interaction.editReply(`No scores found for the acronym \`${acronym.replace(/`/g, '')}\`.`);
			}

			userScores.sort((a, b) => parseInt(b.matchId) - parseInt(a.matchId));

			let matchesPlayed = userScores.map((score) => `${(new Date(score.matchStartDate).getUTCMonth() + 1).toString().padStart(2, '0')}-${new Date(score.matchStartDate).getUTCFullYear()} - ${score.matchName} - ${score.verificationComment} ----- https://osu.ppy.sh/community/matches/${score.matchId}`);

			// eslint-disable-next-line no-undef
			matchesPlayed = new AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${acronym}.txt` });

			await interaction.editReply({ content: `All matches found for the acronym \`${acronym.replace(/`/g, '')}\` are attached.`, files: [matchesPlayed] });
		} else if (interaction.options.getSubcommand() === 'player') {
			let player = getIDFromPotentialOsuLink(interaction.options.getString('player', true));

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			let user = null;

			try {
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				user = await osuApi.getUser({ u: player });
			} catch (error) {
				return await interaction.editReply(`Could not find user \`${player.replace(/`/g, '')}\`.`);
			}

			logDatabaseQueries(4, 'commands/matchverify.js DBOsuMultiScores tournament');
			let userScores = await DBOsuMultiScores.findAll({
				attributes: ['matchId', 'matchStartDate', 'matchName', 'verificationComment'],
				where: {
					osuUserId: user.id,
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
			});

			if (userScores.length === 0) {
				return await interaction.editReply(`No scores found for the player \`${player.replace(/`/g, '')}\`.`);
			}

			userScores.sort((a, b) => parseInt(b.matchId) - parseInt(a.matchId));

			let matchesPlayed = userScores.map((score) => `${(new Date(score.matchStartDate).getUTCMonth() + 1).toString().padStart(2, '0')}-${new Date(score.matchStartDate).getUTCFullYear()} - ${score.matchName} - ${score.verificationComment} ----- https://osu.ppy.sh/community/matches/${score.matchId}`);

			// eslint-disable-next-line no-undef
			matchesPlayed = new AttachmentBuilder(Buffer.from(matchesPlayed.join('\n'), 'utf-8'), { name: `multi-matches-${user.id}.txt` });

			await interaction.editReply({ content: `All matches found for the player \`${player.replace(/`/g, '')}\` are attached.`, files: [matchesPlayed] });
		}
	}
};