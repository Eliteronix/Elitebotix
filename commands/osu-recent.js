const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { getLinkModeName, rippleToBanchoScore, rippleToBanchoUser, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname, getIDFromPotentialOsuLink, populateMsgFromInteraction, getOsuBeatmap, logDatabaseQueries, scoreCardAttachment } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-recent',
	aliases: ['ors'],
	description: 'Sends an info card about the last score of the specified player',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-recent')
		.setNameLocalizations({
			'de': 'osu-recent',
			'en-GB': 'osu-recent',
			'en-US': 'osu-recent',
		})
		.setDescription('Sends an info card about the last score of the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet eine Info-Karte über den letzten Score des angegebenen Spielers',
			'en-GB': 'Sends an info card about the last score of the specified player',
			'en-US': 'Sends an info card about the last score of the specified player',
		})
		.setDMPermission(true)
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
			option.setName('pass')
				.setNameLocalizations({
					'de': 'pass',
					'en-GB': 'pass',
					'en-US': 'pass',
				})
				.setDescription('Show the recent pass?')
				.setDescriptionLocalizations({
					'de': 'Zeige den letzten Pass?',
					'en-GB': 'Show the recent pass?',
					'en-US': 'Show the recent pass?',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'True', value: '--pass' }
				)
		)
		.addStringOption(option =>
			option.setName('gamemode')
				.setNameLocalizations({
					'de': 'spielmodus',
					'en-GB': 'gamemode',
					'en-US': 'gamemode',
				})
				.setDescription('Gamemode')
				.setDescriptionLocalizations({
					'de': 'Spielmodus',
					'en-GB': 'Gamemode',
					'en-US': 'Gamemode',
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
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			try {
				//TODO: Deferreply
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
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}
		}
		let pass = false;
		for (let i = 0; i < args.length; i++) {
			if (args[i] === '--pass') {
				pass = true;
				args.splice(i, 1);
				i--;
			}
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		const server = commandConfig[1];
		const mode = commandConfig[2];

		if (!args[0]) {//Get profile by author if no argument
			//get discordUser from db
			if (commandUser && commandUser.osuUserId) {
				getScore(msg, commandUser.osuUserId, server, mode, false, pass);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getScore(msg, userDisplayName, server, mode, false, pass);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-recent.js DBDiscordUsers');
					const discordUser = await DBDiscordUsers.findOne({
						attributes: ['osuUserId'],
						where: {
							userId: args[i].replace('<@', '').replace('>', '').replace('!', '')
						},
					});

					if (discordUser && discordUser.osuUserId) {
						getScore(msg, discordUser.osuUserId, server, mode, false, pass);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${msg.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
						getScore(msg, args[i], server, mode);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getScore(msg, getIDFromPotentialOsuLink(args[i]), server, mode, true, pass);
						} else {
							getScore(msg, getIDFromPotentialOsuLink(args[i]), server, mode, false, pass);
						}
					} else {
						getScore(msg, getIDFromPotentialOsuLink(args[i]), server, mode, false, pass);
					}
				}
			}
		}
	},
};

async function getScore(msg, username, server, mode, noLinkedAccount, pass) {
	if (server === 'bancho') {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});
		let i = 0;
		// eslint-disable-next-line no-undef
		process.send('osu!API');
		osuApi.getUserRecent({ u: username, m: mode })
			.then(async (scores) => {
				if (!(scores[0])) {
					return msg.channel.send(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				} else {
					if (pass) {
						do {
							i++;
						} while (scores[i] && scores[i].rank == 'F');
						if (!scores[i] || scores[i].rank == 'F') {
							return msg.channel.send(`Couldn't find any recent passes for \`${username.replace(/`/g, '')}\`.`);
						}
					}
				}

				const dbBeatmap = await getOsuBeatmap({ beatmapId: scores[i].beatmapId, modBits: 0 });
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				const user = await osuApi.getUser({ u: username, m: mode });
				updateOsuDetailsforUser(msg.client, user, mode);

				let mapRank = 0;
				//Get the map leaderboard and fill the maprank if found
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				await osuApi.getScores({ b: dbBeatmap.beatmapId, m: mode, limit: 100 })
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

				const input = {
					beatmap: dbBeatmap,
					score: scores[i],
					mode: mode,
					user: user,
					server: server,
					mapRank: mapRank,
				};

				const scoreCard = await scoreCardAttachment(input);

				logDatabaseQueries(4, 'commands/osu-recent.js DBDiscordUsers Bancho linkedUser');
				const linkedUser = await DBDiscordUsers.findOne({
					attributes: ['userId'],
					where: {
						osuUserId: user.id
					}
				});

				if (linkedUser && linkedUser.userId) {
					noLinkedAccount = false;
				}

				let messageContent = `${user.name}: <https://osu.ppy.sh/users/${user.id}/${getLinkModeName(mode)}>\nBeatmap: <https://osu.ppy.sh/b/${dbBeatmap.beatmapId}>`;

				if (noLinkedAccount) {
					messageContent += `\nFeel free to use </osu-link connect:${msg.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`;
				}

				let sentMessage = await msg.channel.send({ content: messageContent, files: [scoreCard] });

				if (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved' || dbBeatmap.approvalStatus === 'Qualified' || dbBeatmap.approvalStatus === 'Loved') {
					sentMessage.react('<:COMPARE:827974793365159997>');
				}
				await sentMessage.react('🗺️');
				await sentMessage.react('👤');
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	} else if (server === 'ripple') {
		let processingMessage = await msg.channel.send(`[\`${username.replace(/`/g, '')}\`] Processing...`);
		fetch(`https://www.ripple.moe/api/get_user_recent?u=${username}&m=${mode}`)
			.then(async (response) => {
				const responseJson = await response.json();
				if (!responseJson[0]) {
					return msg.channel.send(`Couldn't find any recent scores for \`${username.replace(/`/g, '')}\`.`);
				}

				let score = rippleToBanchoScore(responseJson[0]);

				const dbBeatmap = await getOsuBeatmap({ beatmapId: score.beatmapId, modBits: 0 });
				fetch(`https://www.ripple.moe/api/get_user?u=${username}&m=${mode}`)
					.then(async (response) => {
						const responseJson = await response.json();
						if (!responseJson[0]) {
							return msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
						}

						let user = rippleToBanchoUser(responseJson[0]);

						let mapRank = 0;
						//Get the map leaderboard and fill the maprank if found
						await fetch(`https://www.ripple.moe/api/get_scores?b=${dbBeatmap.beatmapId}&m=${mode}&limit=100`)
							.then(async (response) => {
								const responseJson = await response.json();

								//Order by score
								responseJson.sort((a, b) => {
									return parseInt(b.score) - parseInt(a.score);
								});

								for (let j = 0; j < responseJson.length && !mapRank; j++) {
									if (score.raw_mods === responseJson[j].enabled_mods && score.user.id === responseJson[j].user_id && score.score === responseJson[j].score) {
										mapRank = j + 1;
									}
								}
							})
							.catch(err => {
								if (err.message === 'Not found') {
									msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
								} else {
									console.error(err);
								}
							});

						const input = {
							beatmap: dbBeatmap,
							score: score,
							mode: mode,
							user: user,
							server: server,
						};

						const scoreCard = await scoreCardAttachment(input);

						//Send attachment
						const sentMessage = await msg.channel.send({ content: `${user.name}: <https://ripple.moe/u/${user.id}?mode=${mode}>\nBeatmap: <https://osu.ppy.sh/b/${dbBeatmap.beatmapId}>`, files: [scoreCard] });
						processingMessage.delete();
						if (dbBeatmap.approvalStatus === 'Ranked' || dbBeatmap.approvalStatus === 'Approved' || dbBeatmap.approvalStatus === 'Qualified' || dbBeatmap.approvalStatus === 'Loved') {
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
	}
}