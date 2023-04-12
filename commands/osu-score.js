const { DBDiscordUsers, DBOsuMultiScores } = require('../dbObjects');
const osu = require('node-osu');
const { getLinkModeName, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname, getIDFromPotentialOsuLink, populateMsgFromInteraction, getOsuBeatmap, logDatabaseQueries, getBeatmapModeId, getModBits, multiToBanchoScore, scoreCardAttachment } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-score',
	description: 'Sends an info card about the score of the specified player on the map',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 45,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-score')
		.setNameLocalizations({
			'de': 'osu-score',
			'en-GB': 'osu-score',
			'en-US': 'osu-score',
		})
		.setDescription('Sends an info card about the score of the specified player on the map')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über den Score des angegebenen Spielers auf der map',
			'en-GB': 'Sends an info card about the score of the specified player on the map',
			'en-US': 'Sends an info card about the score of the specified player on the map',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('beatmap')
				.setNameLocalizations({
					'de': 'beatmap',
					'en-GB': 'beatmap',
					'en-US': 'beatmap',
				})
				.setDescription('The beatmap id or link')
				.setDescriptionLocalizations({
					'de': 'Die Beatmap-ID oder der Link',
					'en-GB': 'The beatmap id or link',
					'en-US': 'The beatmap id or link',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('mods')
				.setNameLocalizations({
					'de': 'mods',
					'en-GB': 'mods',
					'en-US': 'mods',
				})
				.setDescription('The mod combination that should be displayed (i.e. all, NM, HDHR, ...)')
				.setDescriptionLocalizations({
					'de': 'Die Mod-Kombination, die angezeigt werden soll (z. B. alle, NM, HDHR, ...)',
					'en-GB': 'The mod combination that should be displayed (i.e. all, NM, HDHR, ...)',
					'en-US': 'The mod combination that should be displayed (i.e. all, NM, HDHR, ...)',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('gamemode')
				.setNameLocalizations({
					'de': 'spielmodus',
					'en-GB': 'gamemode',
					'en-US': 'gamemode',
				})
				.setDescription('The gamemode that should be displayed')
				.setDescriptionLocalizations({
					'de': 'Der Spielmodus, der angezeigt werden soll',
					'en-GB': 'The gamemode that should be displayed',
					'en-US': 'The gamemode that should be displayed',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Standard', value: '--s' },
					{ name: 'Taiko', value: '--t' },
					{ name: 'Catch The Beat', value: '--c' },
					{ name: 'Mania', value: '--m' },
				)
		)
		.addStringOption(option =>
			option.setName('server')
				.setNameLocalizations({
					'de': 'server',
					'en-GB': 'server',
					'en-US': 'server',
				})
				.setDescription('The server from which the results will be displayed')
				.setDescriptionLocalizations({
					'de': 'Der Server, von dem die Ergebnisse angezeigt werden',
					'en-GB': 'The server from which the results will be displayed',
					'en-US': 'The server from which the results will be displayed',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Bancho', value: '--b' },
					{ name: 'Ripple', value: '--r' },
					{ name: 'Tournaments', value: '--tournaments' },
				)
		)
		.addStringOption(option =>
			option.setName('username')
				.setNameLocalizations({
					'de': 'nutzername',
					'en-GB': 'username',
					'en-US': 'username',
				})
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
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
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
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
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
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
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
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
				.setDescription('The username, id or link of the player')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers',
					'en-GB': 'The username, id or link of the player',
					'en-US': 'The username, id or link of the player',
				})
				.setRequired(false)
		),
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		let mods = 'best';
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			try {
				//TODO:Deferreply
				await interaction.reply('Players are being processed');
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'mods') {
						args.push(`--${interaction.options._hoistedOptions[i].value.toUpperCase()}`);
					} else {
						args.push(interaction.options._hoistedOptions[i].value);
					}
				}
			}
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		const server = commandConfig[1];
		let mode = commandConfig[2];

		let mapRank = 0;

		for (let i = 0; i < args.length; i++) {
			if (args[i].startsWith('--event')) {
				mapRank = args[i].substring(7);
				args.splice(i, 1);
				i--;
			} else if (args[i] === '--ALL') {
				mods = 'all';
				args.splice(i, 1);
				i--;
			} else if (args[i].startsWith('--NM') || args[i].startsWith('--NF') || args[i].startsWith('--HT') || args[i].startsWith('--EZ')
				|| args[i].startsWith('--HR') || args[i].startsWith('--HD') || args[i].startsWith('--SD') || args[i].startsWith('--DT')
				|| args[i].startsWith('--NC') || args[i].startsWith('--FL') || args[i].startsWith('--SO') || args[i].startsWith('--PF')
				|| args[i].startsWith('--K4') || args[i].startsWith('--K5') || args[i].startsWith('--K6') || args[i].startsWith('--K7')
				|| args[i].startsWith('--K8') || args[i].startsWith('--FI') || args[i].startsWith('--RD') || args[i].startsWith('--K9')
				|| args[i].startsWith('--KC') || args[i].startsWith('--K1') || args[i].startsWith('--K2') || args[i].startsWith('--K3')
				|| args[i].startsWith('--MR')) {
				mods = args[i].substring(2);
				if (mods === 'NM') {
					mods = '';
				}
				args.splice(i, 1);
				i--;
			}
		}

		const beatmapId = getIDFromPotentialOsuLink(args.shift());

		const dbBeatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: 0 });
		if (!dbBeatmap) {
			return msg.channel.send(`Couldn't find beatmap \`${beatmapId.replace(/`/g, '')}\``);
		} else if (dbBeatmap.mode !== 'Standard') {
			mode = getBeatmapModeId(dbBeatmap);
		}

		if (!args[0]) {//Get profile by author if no argument
			if (commandUser && commandUser.osuUserId) {
				getScore(msg, dbBeatmap, commandUser.osuUserId, server, mode, false, mapRank, mods);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getScore(msg, dbBeatmap, userDisplayName, server, mode, false, mapRank, mods);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-score.js DBDiscordUsers 1');
					const discordUser = await DBDiscordUsers.findOne({
						attributes: ['osuUserId'],
						where: {
							userId: args[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						getScore(msg, dbBeatmap, discordUser.osuUserId, server, mode, false, mapRank, mods);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${msg.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						getScore(msg, dbBeatmap, args[i], server, mode, false, mapRank, mods);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getScore(msg, dbBeatmap, getIDFromPotentialOsuLink(args[i]), server, mode, true, mapRank, mods);
						} else {
							getScore(msg, dbBeatmap, getIDFromPotentialOsuLink(args[i]), server, mode, false, mapRank, mods);
						}
					} else {
						getScore(msg, dbBeatmap, getIDFromPotentialOsuLink(args[i]), server, mode, false, mapRank, mods);
					}
				}
			}
		}
	},
};

async function getScore(msg, beatmap, username, server, mode, noLinkedAccount, mapRank, mods) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	if (server === 'bancho') {
		logDatabaseQueries(4, 'commands/osu-score.js DBDiscordUsers 2');
		const discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuName', 'osuUserId'],
			where: {
				osuUserId: username
			}
		});

		if (discordUser && discordUser.osuUserId) {
			username = discordUser.osuName;
		}

		// eslint-disable-next-line no-undef
		process.send('osu!API');
		osuApi.getScores({ b: beatmap.beatmapId, u: username, m: mode })
			.then(async (scores) => {
				if (!(scores[0])) {
					return msg.channel.send(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
				}
				let scoreHasBeenOutput = false;
				for (let i = 0; i < scores.length; i++) {
					if (mods === 'best' && i === 0 || mods === 'all' || mods !== 'best' && mods !== 'all' && getModBits(mods) === scores[i].raw_mods) {
						scoreHasBeenOutput = true;
						// eslint-disable-next-line no-undef
						process.send('osu!API');
						const user = await osuApi.getUser({ u: username, m: mode });
						updateOsuDetailsforUser(msg.client, user, mode);

						//Get the map leaderboard and fill the maprank if found
						if (!mapRank) {
							// eslint-disable-next-line no-undef
							process.send('osu!API');
							await osuApi.getScores({ b: beatmap.beatmapId, m: mode, limit: 100 })
								.then(async (mapScores) => {
									for (let j = 0; j < mapScores.length && !mapRank; j++) {
										if (scores[i].raw_mods === mapScores[j].raw_mods && scores[i].user.id === mapScores[j].user.id && scores[i].score === mapScores[j].score) {
											mapRank = j + 1;
										}
									}
								})
								// eslint-disable-next-line no-unused-vars
								.catch(err => {
									//Nothing
								});
						}

						const input = {
							beatmap: beatmap,
							score: scores[i],
							mode: mode,
							user: user,
							server: server,
							mapRank: mapRank,
						};

						const scoreCard = await scoreCardAttachment(input);

						logDatabaseQueries(4, 'commands/osu-score.js DBDiscordUsers 3');
						const linkedUser = await DBDiscordUsers.findOne({
							attributes: ['userId'],
							where: {
								osuUserId: user.id
							}
						});

						if (linkedUser && linkedUser.userId) {
							noLinkedAccount = false;
						}

						let messageContent = `${user.name}: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.beatmapId}>`;

						if (noLinkedAccount) {
							messageContent += `\nFeel free to use </osu-link connect:${msg.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`;
						}

						let sentMessage = await msg.channel.send({ content: messageContent, files: [scoreCard] });

						try {
							if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
								await sentMessage.react('<:COMPARE:827974793365159997>');
							}
							await sentMessage.react('🗺️');
							await sentMessage.react('👤');
						} catch (err) {
							//Nothing
						}

						//Reset maprank in case of multiple scores displayed
						mapRank = 0;
					}
				}
				if (!scoreHasBeenOutput) {
					msg.channel.send(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\` with \`${mods}\`.`);
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'ripple') {
		let processingMessage = await msg.channel.send(`[\`${username.replace(/`/g, '')}\`] Processing...`);
		fetch(`https://www.ripple.moe/api/get_scores?b=${beatmap.beatmapId}&u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return msg.channel.send(`Couldn't find any scores for \`${username.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
				}

				let score = rippleToBanchoScore(responseJson[0]);

				fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
					.then(async (response) => {
						const responseJson = await response.json();
						if (!responseJson[0]) {
							return msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						}

						let user = rippleToBanchoUser(responseJson[0]);

						const input = {
							beatmap: beatmap,
							score: score,
							mode: mode,
							user: user,
							server: server,
							mapRank: mapRank,
						};

						const scoreCard = await scoreCardAttachment(input);

						//Send attachment
						let sentMessage = await msg.channel.send({ content: `${user.name}: <https://osu.ppy.sh/users/${user.id}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.beatmapId}>`, files: [scoreCard] });

						processingMessage.delete();
						if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
							sentMessage.react('<:COMPARE:827974793365159997>');
						}
						await sentMessage.react('🗺️');
						await sentMessage.react('👤');
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						} else {
							console.error(err);
						}
					});
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'tournaments') {
		// eslint-disable-next-line no-undef
		process.send('osu!API');
		const osuUser = await osuApi.getUser({ u: username, m: mode });

		logDatabaseQueries(4, 'commands/osu-score.js DBOsuMultiScores');
		const beatmapScores = await DBOsuMultiScores.findAll({
			attributes: [
				'id',
				'score',
				'gameRawMods',
				'rawMods',
				'teamType',
				'pp',
				'beatmapId',
				'createdAt',
				'gameStartDate',
				'osuUserId',
				'count50',
				'count100',
				'count300',
				'countGeki',
				'countKatu',
				'countMiss',
				'maxCombo',
				'perfect',
				'matchName',
				'mode',
			],
			where: {
				beatmapId: beatmap.beatmapId,
				scoringType: 'Score v2'
			}
		});

		beatmapScores.sort((a, b) => parseInt(b.score) - parseInt(a.score));

		const userScores = [];

		let userScoreAmount = 0;

		for (let i = 0; i < beatmapScores.length; i++) {
			if (parseInt(beatmapScores[i].score) < 10000) {
				beatmapScores.splice(i, 1);
				i--;
				continue;
			}

			if (beatmapScores[i].osuUserId === osuUser.id) {
				userScoreAmount++;
				if (mods === 'best' && userScores.length === 0 || mods === 'all'
					|| mods !== 'best' && mods !== 'all' && getModBits(mods) === parseInt(beatmapScores[i].rawMods) + parseInt(beatmapScores[i].gameRawMods)
					|| mods !== 'best' && mods !== 'all' && mods.includes('NF') && getModBits(mods) - 1 === parseInt(beatmapScores[i].rawMods) + parseInt(beatmapScores[i].gameRawMods)
					|| mods !== 'best' && mods !== 'all' && !mods.includes('NF') && getModBits(mods) + 1 === parseInt(beatmapScores[i].rawMods) + parseInt(beatmapScores[i].gameRawMods)) {
					beatmapScores[i].mapRank = i + 1;
					userScores.push(beatmapScores[i]);
				}
			}

			if (beatmapScores[i].osuUserId !== osuUser.id) {
				for (let j = i + 1; j < beatmapScores.length; j++) {
					if (beatmapScores[j] && beatmapScores[i].osuUserId === beatmapScores[j].osuUserId) {
						beatmapScores.splice(j, 1);
						j--;
					}
				}
			}
		}

		if (!userScores.length) {
			return msg.channel.send(`Couldn't find any tournament scores for \`${osuUser.name.replace(/`/g, '')}\` on \`${beatmap.artist} - ${beatmap.title} [${beatmap.difficulty}] (${beatmap.beatmapId})\`.`);
		}

		for (let i = 0; i < userScores.length; i++) {
			userScores[i] = await multiToBanchoScore(userScores[i]);
			mapRank = `${userScores[i].mapRank}/${beatmapScores.length - userScoreAmount + 1}`;

			updateOsuDetailsforUser(msg.client, osuUser, mode);

			const input = {
				beatmap: beatmap,
				score: userScores[i],
				mode: mode,
				user: osuUser,
				server: server,
				mapRank: mapRank,
			};

			const scoreCard = await scoreCardAttachment(input);

			logDatabaseQueries(4, 'commands/osu-score.js DBDiscordUsers 4');
			const linkedUser = await DBDiscordUsers.findOne({
				attributes: ['userId'],
				where: {
					osuUserId: osuUser.id
				}
			});

			if (linkedUser && linkedUser.userId) {
				noLinkedAccount = false;
			}

			let messageContent = `${osuUser.name}: <https://osu.ppy.sh/users/${osuUser.id}/${getLinkModeName(mode)}>\nBeatmap: <https://osu.ppy.sh/b/${beatmap.beatmapId}>`;

			if (noLinkedAccount) {
				messageContent += `\nFeel free to use </osu-link connect:${msg.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`;
			}

			let sentMessage = await msg.channel.send({ content: messageContent, files: [scoreCard] });

			if (beatmap.approvalStatus === 'Ranked' || beatmap.approvalStatus === 'Approved' || beatmap.approvalStatus === 'Qualified' || beatmap.approvalStatus === 'Loved') {
				await sentMessage.react('<:COMPARE:827974793365159997>');
			}
			await sentMessage.react('🗺️');
			await sentMessage.react('👤');
		}
	}
}