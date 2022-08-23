const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');
const osu = require('node-osu');
const { getIDFromPotentialOsuLink, getOsuBeatmap, updateOsuDetailsforUser, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-referee',
	aliases: ['osu-host'],
	description: 'Lets you schedule a match which is being reffed by the bot',
	// usage: '[username] [username] ... (Use `_` instead of spaces; Use `--b` for bancho / `--r` for ripple; Use `--s`/`--t`/`--c`/`--m` for modes)',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (msg) {
			return msg.reply('Please set up the game using the / command `/osu-referee`');
		}
		if (interaction) {
			await interaction.reply('Information is being processed');
			if (interaction.options._subcommand === 'soloqualifiers') {
				let date = new Date();
				date.setUTCSeconds(0);
				let dbMaps = [];
				let dbPlayers = [];
				let useNoFail = false;
				let channel = null;
				let matchname = '';
				let mappoolReadable = '';
				let scoreMode = 0;
				let matchLength = 600 + 60 + 180; //Set to forfeit time by default + 1 end minute + 3 extra minutes backup
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'date') {
						date.setUTCDate(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'month') {
						date.setUTCMonth(interaction.options._hoistedOptions[i].value - 1);
					} else if (interaction.options._hoistedOptions[i].name === 'year') {
						date.setUTCFullYear(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'hour') {
						date.setUTCHours(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'minute') {
						date.setUTCMinutes(interaction.options._hoistedOptions[i].value);
					} else if (interaction.options._hoistedOptions[i].name === 'mappool') {
						let maps = interaction.options._hoistedOptions[i].value.split(',');
						mappoolReadable = interaction.options._hoistedOptions[i].value;

						for (let j = 0; j < maps.length; j++) {
							if (!maps[j].match(/[a-zA-Z][a-zA-Z]\d+/gm)) {
								return interaction.followUp(`${maps[j]} is not a valid map`);
							}
							let modBits;

							if (maps[j].toLowerCase().startsWith('nm')) {
								modBits = 0;
							} else if (maps[j].toLowerCase().startsWith('hd')) {
								modBits = 8;
							} else if (maps[j].toLowerCase().startsWith('hr')) {
								modBits = 16;
							} else if (maps[j].toLowerCase().startsWith('dt')) {
								modBits = 64;
							} else {
								return interaction.followUp(`${maps[j].substring(0, 2)} is not a valid mod.`);
							}

							let dbBeatmap = await getOsuBeatmap({ beatmapId: maps[j].substring(2), modBits: modBits });

							if (dbBeatmap) {
								dbMaps.push(dbBeatmap.id);
								matchLength += 120 + parseInt(dbBeatmap.totalLength);
							} else {
								return interaction.followUp(`The beatmap \`${maps[j].substring(2)}\` could not be found.`);
							}
						}
					} else if (interaction.options._hoistedOptions[i].name === 'players') {
						// eslint-disable-next-line no-undef
						const osuApi = new osu.Api(process.env.OSUTOKENV1, {
							// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
							notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
							completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
							parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
						});
						let players = interaction.options._hoistedOptions[i].value.split(',');

						for (let j = 0; j < players.length; j++) {
							const response = await osuApi.getUser({ u: getIDFromPotentialOsuLink(players[j]), m: 0 })
								.then(async (user) => {
									updateOsuDetailsforUser(user, 0);

									logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 1');
									const dbDiscordUser = await DBDiscordUsers.findOne({
										where: {
											userId: {
												[Op.not]: null
											},
											osuUserId: user.id
										},
									});

									if (dbDiscordUser) {
										dbPlayers.push(dbDiscordUser.id);
									} else {
										return interaction.followUp(`\`${user.name}\` doesn't have their account connected. Please tell them to connect their account using \`/osu-link connect\`. (Use \`_\` instead of spaces)`);
									}
								})
								.catch(err => {
									if (err.message === 'Not found') {
										return interaction.followUp(`Could not find user \`${getIDFromPotentialOsuLink(players[j]).replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
									} else {
										console.log(err);
										return interaction.followUp(`The bot ran into an error processing the user ${getIDFromPotentialOsuLink(players[j])}. Please try again.`);
									}
								});

							if (response) {
								return;
							}
						}
					} else if (interaction.options._hoistedOptions[i].name === 'usenofail' && interaction.options._hoistedOptions[i].value) {
						useNoFail = true;
					} else if (interaction.options._hoistedOptions[i].name === 'channel') {
						channel = await interaction.guild.channels.fetch(interaction.options._hoistedOptions[i].value);
						if (channel.type !== 'GUILD_TEXT') {
							return interaction.followUp(`<#${channel.id}> is not a valid text channel.`);
						}
					} else if (interaction.options._hoistedOptions[i].name === 'matchname') {
						matchname = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'score') {
						scoreMode = interaction.options._hoistedOptions[i].value;
					}
				}

				let now = new Date();
				if (now > date) {
					return interaction.followUp('You are trying to schedule a match in the past which is not allowed.');
				} else if (now.setUTCDate(now.getUTCDate() + 14) < date) {
					return interaction.followUp('You are trying to schedule a match more than 2 weeks in the future which is not allowed.');
				}

				//Calculate if there are going to be other matches running during that time
				let endDate = new Date();
				endDate.setUTCFullYear(date.getUTCFullYear());
				endDate.setUTCMonth(date.getUTCMonth());
				endDate.setUTCDate(date.getUTCDate());
				endDate.setUTCHours(date.getUTCHours());
				endDate.setUTCMinutes(date.getUTCMinutes());
				endDate.setUTCSeconds(0);
				endDate.setUTCSeconds(matchLength);

				date.setUTCMinutes(date.getUTCMinutes() - 15);

				DBProcessQueue.create({ guildId: interaction.guildId, task: 'tourneyMatchNotification', priority: 10, additions: `${interaction.user.id};${channel.id};${dbMaps.join(',')};${dbPlayers.join(',')};${useNoFail};${matchname};${mappoolReadable};${scoreMode}`, date: date });
				return interaction.followUp('The match has been scheduled. The players will be informed as soon as it happens. To look at your scheduled matches please use `/osu-referee scheduled`');
			} else if (interaction.options._subcommand === 'scheduled') {
				let scheduledMatches = [];
				//Get all scheduled matches that still need to notify
				logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 1');
				const tourneyMatchNotifications = await DBProcessQueue.findAll({
					where: { task: 'tourneyMatchNotification' }
				});

				for (let i = 0; i < tourneyMatchNotifications.length; i++) {
					//Get the match data from the additions field
					let additions = tourneyMatchNotifications[i].additions.split(';');
					//Check if the executing user is the 0 index of the additions
					if (additions[0] === interaction.user.id) {
						//Get the player IDs from the additions on index 3
						let players = additions[3].split(',');
						//Translate the player IDs to osu! usernames
						let dbPlayerNames = [];
						for (let j = 0; j < players.length; j++) {
							logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 2');
							const dbDiscordUser = await DBDiscordUsers.findOne({
								where: { id: players[j] }
							});
							dbPlayerNames.push(dbDiscordUser.osuName);
						}

						//Get the match date from the date the task is scheduled to
						const matchDate = tourneyMatchNotifications[i].date;
						//Increase the matchDate by 15 minutes to get the date the match actually starts (Because notifications happen 15 minutes earlier)
						matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 15);

						scheduledMatches.push(`\`\`\`Scheduled:\nInternal ID: ${tourneyMatchNotifications[i].id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${dbPlayerNames.join(', ')}\nMappool: ${additions[6]}\`\`\``);
					}
				}

				logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 2');
				const tourneyMatchReferees = await DBProcessQueue.findAll({
					where: { task: 'tourneyMatchReferee' }
				});

				for (let i = 0; i < tourneyMatchReferees.length; i++) {
					let additions = tourneyMatchReferees[i].additions.split(';');
					if (additions[0] === interaction.user.id) {
						let players = additions[3].split(',');
						let dbPlayerNames = [];
						for (let j = 0; j < players.length; j++) {
							logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 3');
							const dbDiscordUser = await DBDiscordUsers.findOne({
								where: { id: players[j] }
							});
							dbPlayerNames.push(dbDiscordUser.osuName);
						}

						const matchDate = tourneyMatchReferees[i].date;
						matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 10);

						scheduledMatches.push(`\`\`\`Scheduled (Already pinged):\nInternal ID: ${tourneyMatchReferees[i].id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${dbPlayerNames.join(', ')}\nMappool: ${additions[6]}\`\`\``);
					}
				}

				if (!scheduledMatches.length) {
					scheduledMatches = 'No matches scheduled.';
				} else {
					scheduledMatches = scheduledMatches.join('\n');
				}

				return interaction.followUp(`Your scheduled matches:\n${scheduledMatches}`);
			} else if (interaction.options._subcommand === 'remove') {
				const internalId = interaction.options._hoistedOptions[0].value;
				logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 3');
				const processQueueTask = await DBProcessQueue.findOne({
					where: { id: internalId }
				});

				if (processQueueTask && (processQueueTask.task === 'tourneyMatchNotification' || processQueueTask.task === 'tourneyMatchReferee')) {
					let additions = processQueueTask.additions.split(';');
					if (additions[0] === interaction.user.id) {
						let players = additions[3].split(',');
						let dbPlayerNames = [];
						for (let j = 0; j < players.length; j++) {
							logDatabaseQueries(4, 'commands/osu-referee.js DBDiscordUsers 4');
							const dbDiscordUser = await DBDiscordUsers.findOne({
								where: { id: players[j] }
							});
							dbPlayerNames.push(dbDiscordUser.osuName);
						}

						const matchDate = processQueueTask.date;
						if (processQueueTask.task === 'tourneyMatchNotification') {
							matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 15);
						} else if (processQueueTask.task === 'tourneyMatchReferee') {
							matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 10);
						}

						interaction.followUp(`The following match has been removed and is no longer scheduled to happen:\n\`\`\`Internal ID: ${processQueueTask.id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${dbPlayerNames.join(', ')}\nMappool: ${additions[6]}\`\`\``);

						return processQueueTask.destroy();
					}
				}

				return interaction.followUp('I couldn\'t find a scheduled match created by you with that internal ID.\nTo see what ID you need to put please use `/osu-referee scheduled`');
			}
		}
	},
};