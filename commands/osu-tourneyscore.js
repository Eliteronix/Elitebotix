const { Op } = require('sequelize');
const { DBOsuMultiMatches, DBOsuMultiGameScores, DBDiscordUsers } = require('../dbObjects');
const { createLeaderboard, getMods, getOsuPlayerName } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { showUnknownInteractionError, leaderboardEntriesPerPage } = require('../config.json');

module.exports = {
    name: 'osu-tourneyscore',
    description: 'Sends an evaluation of how valuable all the players in the tournament were',
    integration_types: [0, 1], // 0 for guild, 1 for user
    contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
    botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
    botPermissionsTranslated: 'Send Messages and Attach Files',
    cooldown: 15,
    tags: 'osu',
    data: new SlashCommandBuilder()
        .setName('osu-tourneyscore')
        .setNameLocalizations({
            'de': 'osu-tourneebewertung',
            'en-GB': 'osu-tourneyscore',
            'en-US': 'osu-tourneyscore',
        })
        .setDescription('Sends an evaluation of how valuable all the players in the tournament were')
        .setDescriptionLocalizations({
            'de': 'Sendet eine Bewertung, wie wertvoll alle Spieler im Turnier waren',
            'en-GB': 'Sends an evaluation of how valuable all the players in the tournament were',
            'en-US': 'Sends an evaluation of how valuable all the players in the tournament were',
        })
        .setDMPermission(true)
        .addStringOption(option =>
            option.setName('acronym')
                .setNameLocalizations({
                    'de': 'acronym',
                    'en-GB': 'acronym',
                    'en-US': 'acronym',
                })
                .setDescription('Tournament acronym')
                .setDescriptionLocalizations({
                    'de': 'Tournament-Akronym',
                    'en-GB': 'Tournament acronym',
                    'en-US': 'Tournament acronym',
                })
                .setRequired(true)
        )
        .addStringOption(option =>
			option.setName('calculation')
				.setNameLocalizations({
					'de': 'berechnung',
					'en-GB': 'calculation',
					'en-US': 'calculation',
				})
				.setDescription('How the matchscore should be calculated')
				.setDescriptionLocalizations({
					'de': 'Wie die Matchwertung berechnet werden soll',
					'en-GB': 'How the matchscore should be calculated',
					'en-US': 'How the matchscore should be calculated',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Mixed (Default)', value: 'mixed' },
					{ name: 'Sum (favors all-rounders)', value: 'sum' },
					{ name: 'Average (favors niche players)', value: 'avg' },
				)
		)
        .addIntegerOption(option =>
            option.setName('page')
                .setNameLocalizations({
                    'de': 'seite',
                    'en-GB': 'page',
                    'en-US': 'page',
                })
                .setDescription('Leaderboard page to display')
                .setDescriptionLocalizations({
                    'de': 'Anzuzeigende Ranglisten-Seite',
                    'en-GB': 'Leaderboard page to display',
                    'en-US': 'Leaderboard page to display',
                })
                .setRequired(false)
        ), // TODO: add more evaluation methods
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

        const discordUser = await DBDiscordUsers.findOne({
            attributes: ['osuUserId', 'osuName'],
            where: {
                userId: interaction.user.id,
            },
        });

        const acronym = interaction.options.getString('acronym');
        let calculation = 'mixed';

        if (interaction.options.getString('calculation')) {
            calculation = interaction.options.getString('calculation');
        }

        const tournamentMatches = await DBOsuMultiMatches.findAll({
            attributes: ['matchId', 'matchName'],
            where: {
                acronym: acronym.toLowerCase(),
                tourneyMatch: true,
            },
            order: [['matchId', 'DESC']],
        });

        if (!tournamentMatches.length) {
            return await interaction.editReply(`No tournament matches found with the acronym \`${acronym.replace(/`/g, '')}\`.`);
        }

        const matchIds = tournamentMatches.map(match => match.matchId);

        const allScores = await DBOsuMultiGameScores.findAll({
            attributes: ['osuUserId', 'matchId', 'gameId', 'score', 'rawMods'],
            where: {
                matchId: {
                    [Op.in]: matchIds,
                },
                tourneyMatch: true,
                mode: 0,
                score: {
                    [Op.gt]: 10000,
                },
                warmup: {
                    [Op.not]: true,
                },
            },
            order: [['matchId', 'ASC'], ['gameId', 'ASC'], ['score', 'DESC']],
        });

        if (!allScores.length) {
            return await interaction.editReply(`No scores were found for \`${acronym.replace(/`/g, '')}\`.`);
        }

        const playerTourneyResults = [];
        const scoresByGame = new Map();

        for (let i = 0; i < allScores.length; i++) {
            const score = allScores[i];
            const key = `${score.matchId}-${score.gameId}`;

            if (!scoresByGame.has(key)) {
                scoresByGame.set(key, []);
            }

            scoresByGame.get(key).push(score);
        }

        for (const gameScores of scoresByGame.values()) {
            if (gameScores.length <= 1) {
                continue;
            }

            for (let i = 0; i < gameScores.length; i++) {
                if (getMods(gameScores[i].rawMods).includes('EZ')) {
                    gameScores[i].score *= 1.7;
                }
            }

            gameScores.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

            for (let j = 0; j < gameScores.length; j++) {
                const sortedScores = [];
                for (let k = 0; k < gameScores.length; k++) {
                    if (!(gameScores.length % 2 === 0 && gameScores[j].osuUserId === gameScores[k].osuUserId)) {
                        sortedScores.push(gameScores[k].score);
                    }
                }

                const middleScore = getMiddleScore(sortedScores);
                const existingScore = playerTourneyResults.find(score => score.userId === gameScores[j].osuUserId);

                if (existingScore) {
                    existingScore.playedRounds += 1;
                    existingScore.score += 1 / parseInt(middleScore) * parseInt(gameScores[j].score);

                    if (j === 0) {
                        existingScore.wins += 1;
                    }
                } else {
                    playerTourneyResults.push({
                        userId: gameScores[j].osuUserId,
                        playedRounds: 1,
                        score: 1 / parseInt(middleScore) * parseInt(gameScores[j].score),
                        wins: j === 0 ? 1 : 0,
                    });
                }
            }
        }

        if (!playerTourneyResults.length) {
            return await interaction.editReply('No rounds with at least 2 players found in the tournament data.');
        }

        let valueType = 'summed';
        let valueHint = 'Players were judged across the whole tournament making players that play more often more valuable. (Favors all-rounders)';

        if (calculation === 'avg') {
            for (let i = 0; i < playerTourneyResults.length; i++) {
                playerTourneyResults[i].score = playerTourneyResults[i].score / playerTourneyResults[i].playedRounds;
            }

            valueType = 'average';
            valueHint = 'Players were judged across only the maps they played making players that play less often more valuable. (Favors niche players)';
        } else if (calculation === 'mixed') {
            for (let i = 0; i < playerTourneyResults.length; i++) {
                playerTourneyResults[i].score = playerTourneyResults[i].score / playerTourneyResults[i].playedRounds;
                playerTourneyResults[i].score = playerTourneyResults[i].score * (0.8 + 0.2 * playerTourneyResults[i].playedRounds);
            }

            valueType = 'mixed';
            valueHint = 'Players were judged across the whole tournament making players that play more often more valuable. (Middle ground between all-rounders and niche players)';
        }

        playerTourneyResults.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

        const sortedPlayerTourneyResults = [];
        for (let i = 0; i < playerTourneyResults.length; i++) {
            sortedPlayerTourneyResults.push(playerTourneyResults[i].score);
        }

        const middleScore = getMiddleScore(sortedPlayerTourneyResults);

        for (let i = 0; i < playerTourneyResults.length; i++) {
            playerTourneyResults[i].score = 1 / parseFloat(middleScore) * parseFloat(playerTourneyResults[i].score);
        }

        const leaderboardData = [];

        for (let i = 0; i < playerTourneyResults.length; i++) {
            leaderboardData.push({
                name: `${await getOsuPlayerName(playerTourneyResults[i].userId)}`,
                value: `${Math.round(playerTourneyResults[i].score * 100) / 100} ${valueType} over ${playerTourneyResults[i].playedRounds} maps (${playerTourneyResults[i].wins}x #1)`,
            });
        }

        let replyMessage = `The leaderboard shows the evaluation of the players that participated in \`${acronym.toUpperCase()}\`:`;

        if (discordUser && discordUser.osuUserId) {
            const playerResult = playerTourneyResults.find(score => score.userId == discordUser.osuUserId);
            if (playerResult) {
                replyMessage += `\n**${await getOsuPlayerName(discordUser.osuUserId)}**' score: **${Math.round(playerResult.score * 100) / 100}** ${valueType} over **${playerResult.playedRounds}** maps **(${playerResult.wins}x #1**). Position: **#${playerTourneyResults.findIndex(score => score.userId == discordUser.osuUserId) + 1}**`;
            }
        }

        replyMessage += `\n${valueHint}\nAnalyzed **${tournamentMatches.length}** matches and **${allScores.length}** scores.`;

        const totalPages = Math.max(1, Math.ceil(leaderboardData.length / leaderboardEntriesPerPage));
        let page = interaction.options.getInteger('page') || 1;

        if (page < 1) {
            page = 1;
        }

        if (page > totalPages) {
            page = totalPages;
        }

        const filename = page > 1
            ? `osu-tourney-score-${acronym}-page${page}.png`
            : `osu-tourney-score-${acronym}.png`;

        const attachment = await createLeaderboard(leaderboardData, 'osu-background.png', `${acronym.toUpperCase()}`, filename, page);

        const components = [];

        if (totalPages > 1) {
            const row = new ActionRowBuilder();

            if (page > 1) {
                const firstPage = new ButtonBuilder()
                    .setCustomId(`osu-tourneyscore||{"acronym":"${acronym.replace(/"/g, '\\"')}","calculation":"${calculation}","page":1}`)
                    .setLabel('First page')
                    .setStyle(ButtonStyle.Primary);
                row.addComponents(firstPage);
            }

            if (page > 2) {
                const previousPage = new ButtonBuilder()
                    .setCustomId(`osu-tourneyscore||{"acronym":"${acronym.replace(/"/g, '\\"')}","calculation":"${calculation}","page":${page - 1}}`)
                    .setLabel('Previous page')
                    .setStyle(ButtonStyle.Primary);
                row.addComponents(previousPage);
            }

            if (page < totalPages - 1) {
                const nextPage = new ButtonBuilder()
                    .setCustomId(`osu-tourneyscore||{"acronym":"${acronym.replace(/"/g, '\\"')}","calculation":"${calculation}","page":${page + 1}}`)
                    .setLabel('Next page')
                    .setStyle(ButtonStyle.Primary);
                row.addComponents(nextPage);
            }

            if (page < totalPages) {
                const lastPage = new ButtonBuilder()
                    .setCustomId(`osu-tourneyscore||{"acronym":"${acronym.replace(/"/g, '\\"')}","calculation":"${calculation}","page":${totalPages}}`)
                    .setLabel('Last page')
                    .setStyle(ButtonStyle.Primary);
                row.addComponents(lastPage);
            }

            if (row.components.length > 0) {
                components.push(row);
            }
        }

        await interaction.editReply({
            content: replyMessage,
            files: [attachment],
            components: components,
        });
    },
};

function getMiddleScore(scores) {
    if (scores.length % 2) {
        const middleIndex = scores.length - Math.round(scores.length / 2);
        return scores[middleIndex];
    }

    while (scores.length > 2) {
        scores.splice(0, 1);
        scores.splice(scores.length - 1, 1);
    }

    return (parseFloat(scores[0]) + parseFloat(scores[1])) / 2;
}
