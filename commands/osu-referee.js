const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');
const osu = require('node-osu');
const { getIDFromPotentialOsuLink, getOsuBeatmap, updateOsuDetailsforUser, logDatabaseQueries, getModBits } = require('../utils');
const { Permissions } = require('discord.js');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-referee',
	aliases: ['osu-host'],
	description: 'Lets you schedule a match which is being reffed by the bot',
	// usage: '[username] [username] ... (Use `_` instead of spaces; Use `--b` for bancho / `--r` for ripple; Use `--s`/`--t`/`--c`/`--m` for modes)',
	// permissions: Permissions.FLAGS.MANAGE_GUILD,
	// permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		if (msg) {
			return msg.reply('Please set up the game using the / command `/osu-referee`');
		}

		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}
		if (interaction.options._subcommand === 'soloqualifiers' || interaction.options._subcommand === 'teamqualifiers') {
			let matchname = interaction.options.getString('matchname');
			let date = new Date();
			date.setUTCSeconds(0);
			date.setUTCMinutes(interaction.options.getInteger('minute'));
			date.setUTCHours(interaction.options.getInteger('hour'));
			date.setUTCDate(interaction.options.getInteger('date'));
			date.setUTCMonth(interaction.options.getInteger('month') - 1);
			date.setUTCFullYear(interaction.options.getInteger('year'));
			let useNoFail = interaction.options.getBoolean('usenofail');
			let scoreMode = interaction.options.getString('score');
			let freemodMessage = interaction.options.getString('freemodmessage');
			let teamsize = 1;

			if (interaction.options._subcommand === 'teamqualifiers') {
				teamsize = interaction.options.getInteger('teamsize');
			}

			let channel = interaction.options.getChannel('channel');
			if (channel.type !== 'GUILD_TEXT') {
				return interaction.followUp(`<#${channel.id}> is not a valid text channel.`);
			}

			// eslint-disable-next-line no-undef
			const osuApi = new osu.Api(process.env.OSUTOKENV1, {
				// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
				notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
				completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
				parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
			});

			let players = interaction.options.getString('players');

			if (interaction.options._subcommand === 'soloqualifiers') {
				players = players.replaceAll(',', ';');
			}

			let teams = players.split(';');

			let dbPlayers = [];
			for (let i = 0; i < teams.length; i++) {
				let team = [];
				for (let j = 0; j < teams[i].split(',').length; j++) {
					const response = await osuApi.getUser({ u: getIDFromPotentialOsuLink(teams[i].split(',')[j]), m: 0 })
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
								// Add the user to the team
								team.push(dbDiscordUser.id);
							} else {
								return interaction.followUp(`\`${user.name}\` doesn't have their account connected. Please tell them to connect their account using </osu-link connect:1023849632599658496>. (Use \`_\` instead of spaces)`);
							}
						})
						.catch(err => {
							if (err.message === 'Not found') {
								return interaction.followUp(`Could not find user \`${getIDFromPotentialOsuLink(teams[i].split(',')[j]).replace(/`/g, '')}\`. (Use \`_\` instead of spaces)`);
							} else {
								console.error(err);
								return interaction.followUp(`The bot ran into an error processing the user ${getIDFromPotentialOsuLink(teams[i].split(',')[j])}. Please try again.`);
							}
						});

					if (response) {
						return;
					}
				}
				//Push the team to the array
				dbPlayers.push(team.join(','));
			}

			let dbMaps = [];
			let maps = interaction.options.getString('mappool').split(',');
			let mappoolReadable = interaction.options.getString('mappool');

			for (let j = 0; j < maps.length; j++) {
				if (!maps[j].match(/[a-zA-Z]*\d+/gm)) {
					return interaction.followUp(`${maps[j]} is not a valid map`);
				}

				let mods = maps[j].replace(/\d*/gm, '');

				if (mods.length % 2 !== 0) {
					return interaction.followUp(`${maps[j]} does not have a valid mod combination`);
				}

				let modBits = 0;

				for (let i = 0; i < mods.length; i += 2) {
					let mod = mods.substr(i, 2).toUpperCase();

					if (mod === 'NM' || mod === 'FM') {
						continue;
					}

					mod = getModBits(mod);

					if (mod === 0) {
						return interaction.followUp(`${maps[j]} does not have a valid mod combination`);
					}

					modBits += mod;
				}

				let beatmapId = maps[j].replace(/[a-zA-Z]*/gm, '');

				let dbBeatmap = await getOsuBeatmap({ beatmapId: beatmapId, modBits: modBits });

				if (dbBeatmap) {
					dbMaps.push(dbBeatmap.id);
				} else {
					return interaction.followUp(`The beatmap \`${beatmapId}\` could not be found.`);
				}
			}

			let now = new Date();
			if (now > date) {
				return interaction.followUp('You are trying to schedule a match in the past which is not allowed.');
			} else if (now.setUTCDate(now.getUTCDate() + 14) < date) {
				return interaction.followUp('You are trying to schedule a match more than 2 weeks in the future which is not allowed.');
			}

			date.setUTCMinutes(date.getUTCMinutes() - 15);

			DBProcessQueue.create({ guildId: interaction.guildId, task: 'tourneyMatchNotification', priority: 10, additions: `${interaction.user.id};${channel.id};${dbMaps.join(',')};${dbPlayers.join('|')};${useNoFail};${matchname};${mappoolReadable};${scoreMode};${freemodMessage};${teamsize}`, date: date });
			return interaction.editReply('The match has been scheduled. The players will be informed as soon as it happens. To look at your scheduled matches please use </osu-referee scheduled:1023849805648252988>');
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
					let players = additions[3].replaceAll('|', ',').split(',');
					let dbPlayers = [];
					for (let j = 0; j < players.length; j++) {
						logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 1');
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayers.push(dbDiscordUser);
					}

					// Sort players by id desc
					dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

					players = additions[3];
					for (let j = 0; j < dbPlayers.length; j++) {
						players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
					}

					//Get the match date from the date the task is scheduled to
					const matchDate = tourneyMatchNotifications[i].date;
					//Increase the matchDate by 15 minutes to get the date the match actually starts (Because notifications happen 15 minutes earlier)
					matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 15);

					scheduledMatches.push(`\`\`\`Scheduled:\nInternal ID: ${tourneyMatchNotifications[i].id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${players}\nMappool: ${additions[6]}\`\`\``);
				}
			}

			logDatabaseQueries(4, 'commands/osu-referee.js DBProcessQueue 2');
			const tourneyMatchReferees = await DBProcessQueue.findAll({
				where: { task: 'tourneyMatchReferee' }
			});

			for (let i = 0; i < tourneyMatchReferees.length; i++) {
				let additions = tourneyMatchReferees[i].additions.split(';');
				if (additions[0] === interaction.user.id) {
					let players = additions[3].replaceAll('|', ',').split(',');
					let dbPlayers = [];
					for (let j = 0; j < players.length; j++) {
						logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 1');
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayers.push(dbDiscordUser);
					}

					// Sort players by id desc
					dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

					players = additions[3];
					for (let j = 0; j < dbPlayers.length; j++) {
						players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
					}

					const matchDate = tourneyMatchReferees[i].date;
					matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 10);

					scheduledMatches.push(`\`\`\`Scheduled (Already pinged):\nInternal ID: ${tourneyMatchReferees[i].id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${players}\nMappool: ${additions[6]}\`\`\``);
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
					let players = additions[3].replaceAll('|', ',').split(',');
					let dbPlayers = [];
					for (let j = 0; j < players.length; j++) {
						logDatabaseQueries(2, 'processQueueTasks/tourneyMatchReferee.js DBDiscordUsers 1');
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayers.push(dbDiscordUser);
					}

					// Sort players by id desc
					dbPlayers.sort((a, b) => (a.id > b.id) ? 1 : -1);

					players = additions[3];
					for (let j = 0; j < dbPlayers.length; j++) {
						players = players.replace(dbPlayers[j].dataValues.id, dbPlayers[j].dataValues.osuName);
					}

					const matchDate = processQueueTask.date;
					if (processQueueTask.task === 'tourneyMatchNotification') {
						matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 15);
					} else if (processQueueTask.task === 'tourneyMatchReferee') {
						matchDate.setUTCMinutes(matchDate.getUTCMinutes() + 10);
					}

					interaction.followUp(`The following match has been removed and is no longer scheduled to happen:\n\`\`\`Internal ID: ${processQueueTask.id}\nTime: ${matchDate.getUTCDate().toString().padStart(2, '0')}.${(matchDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${matchDate.getUTCFullYear()} ${matchDate.getUTCHours().toString().padStart(2, '0')}:${matchDate.getUTCMinutes().toString().padStart(2, '0')} UTC\nMatch: ${additions[5]}\nScheduled players: ${players}\nMappool: ${additions[6]}\`\`\``);

					return processQueueTask.destroy();
				}
			}

			return interaction.followUp('I couldn\'t find a scheduled match created by you with that internal ID.\nTo see what ID you need to put please use </osu-referee scheduled:1023849805648252988>');
		}
	},
};