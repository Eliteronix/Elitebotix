const { DBOsuTrackingUsers, DBDiscordUsers, DBOsuGuildTrackers } = require('../dbObjects');
const osu = require('node-osu');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'osu-track',
	// aliases: ['developer', 'donate', 'support'],
	description: 'Sends info about the scores achieved by the user',
	usage: '<add/list/remove> <username>',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
		if (interaction.options._subcommand === 'enable') {
			try {
				await interaction.reply({ content: 'Processing...', ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			let usernames = interaction.options.getString('usernames');

			usernames = usernames.split(',');
			usernames = usernames.map(username => username.trim());

			for (let i = 0; i < usernames.length; i++) {
				let username = usernames[i];

				//Get the user from the database if possible
				logDatabaseQueries(4, 'commands/osu-track.js enable DBDiscordUsers');
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
						const user = await osuApi.getUser({ u: username });
						osuUser.osuUserId = user.id;
						osuUser.osuName = user.name;
					} catch (error) {
						console.error(error);
						await interaction.followUp({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\`.`, ephemeral: true });
						continue;
					}
				}

				//Create the timer for checking the user if needed
				logDatabaseQueries(4, 'commands/osu-track.js enable DBOsuTrackingUsers');
				let userTimer = await DBOsuTrackingUsers.findOne({
					where: {
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!userTimer) {
					let nextCheck = new Date();
					nextCheck.setMinutes(nextCheck.getMinutes() + 15);

					userTimer = await DBOsuTrackingUsers.create({
						osuUserId: osuUser.osuUserId,
						nextCheck: nextCheck,
					});
				}

				//Create or update the guild tracker
				logDatabaseQueries(4, 'commands/osu-track.js enable DBOsuGuildTrackers 1');
				let guildTracker = await DBOsuGuildTrackers.findOne({
					where: {
						guildId: interaction.guild.id,
						channelId: interaction.channel.id,
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!guildTracker) {
					guildTracker = await DBOsuGuildTrackers.create({
						guildId: interaction.guild.id,
						channelId: interaction.channel.id,
						osuUserId: osuUser.osuUserId,
					});
				}

				let topPlays = interaction.options.getString('topplays');

				if (topPlays) {
					if (topPlays.includes('o')) {
						guildTracker.osuTopPlays = true;
					} else {
						guildTracker.osuTopPlays = false;
					}

					if (topPlays.includes('t')) {
						guildTracker.taikoTopPlays = true;
					} else {
						guildTracker.taikoTopPlays = false;
					}

					if (topPlays.includes('c')) {
						guildTracker.catchTopPlays = true;
					} else {
						guildTracker.catchTopPlays = false;
					}

					if (topPlays.includes('m')) {
						guildTracker.maniaTopPlays = true;
					} else {
						guildTracker.maniaTopPlays = false;
					}
				}

				let leaderboardPlays = interaction.options.getString('leaderboardplays');

				if (leaderboardPlays) {
					if (leaderboardPlays.includes('o')) {
						guildTracker.osuLeaderboard = true;
					} else {
						guildTracker.osuLeaderboard = false;
					}

					if (leaderboardPlays.includes('t')) {
						guildTracker.taikoLeaderboard = true;
					} else {
						guildTracker.taikoLeaderboard = false;
					}

					if (leaderboardPlays.includes('c')) {
						guildTracker.catchLeaderboard = true;
					} else {
						guildTracker.catchLeaderboard = false;
					}

					if (leaderboardPlays.includes('m')) {
						guildTracker.maniaLeaderboard = true;
					} else {
						guildTracker.maniaLeaderboard = false;
					}
				}

				let ameobea = interaction.options.getString('ameobea');

				if (ameobea) {
					if (ameobea.includes('o')) {
						guildTracker.osuAmeobea = true;
					} else {
						guildTracker.osuAmeobea = false;
					}

					if (ameobea.includes('t')) {
						guildTracker.taikoAmeobea = true;
					} else {
						guildTracker.taikoAmeobea = false;
					}

					if (ameobea.includes('c')) {
						guildTracker.catchAmeobea = true;
					} else {
						guildTracker.catchAmeobea = false;
					}

					if (ameobea.includes('m')) {
						guildTracker.maniaAmeobea = true;
					} else {
						guildTracker.maniaAmeobea = false;
					}
				}

				let showAmeobeaUpdates = interaction.options.getBoolean('showameobeaupdate');

				if ((guildTracker.osuAmeobea || guildTracker.taikoAmeobea || guildTracker.catchAmeobea || guildTracker.maniaAmeobea) && showAmeobeaUpdates) {
					guildTracker.showAmeobeaUpdates = showAmeobeaUpdates;
				}

				let medals = interaction.options.getBoolean('medals');

				if (medals) {
					guildTracker.medals = medals;
				}

				let duelrating = interaction.options.getBoolean('duelrating');

				if (duelrating) {
					guildTracker.duelRating = duelrating;
				}

				let matchactivity = interaction.options.getString('matchactivity');

				if (matchactivity === 'matches') {
					guildTracker.matchActivity = true;
					guildTracker.matchActivityAutoTrack = false;
				} else if (matchactivity === 'matches (auto matchtrack)') {
					guildTracker.matchActivity = true;
					guildTracker.matchActivityAutoTrack = true;
				}

				if (guildTracker.osuTopPlays ||
					guildTracker.taikoTopPlays ||
					guildTracker.catchTopPlays ||
					guildTracker.maniaTopPlays ||
					guildTracker.osuLeaderboard ||
					guildTracker.taikoLeaderboard ||
					guildTracker.catchLeaderboard ||
					guildTracker.maniaLeaderboard ||
					guildTracker.osuAmeobea ||
					guildTracker.taikoAmeobea ||
					guildTracker.catchAmeobea ||
					guildTracker.maniaAmeobea ||
					guildTracker.medals ||
					guildTracker.duelRating ||
					guildTracker.matchActivity) {
					await guildTracker.save();

					await interaction.followUp({ content: `Tracking \`${osuUser.osuName.replace(/`/g, '')}\` in <#${interaction.channel.id}>.`, ephemeral: true });

					continue;
				}

				// If nothing is tracked, delete the tracker
				await guildTracker.destroy();

				// Find other guild trackers, if none exsist, delete the user tracker
				logDatabaseQueries(4, 'commands/osu-track.js enable DBOsuGuildTrackers 2');
				const guildTrackers = await DBOsuGuildTrackers.findAll({
					where: {
						osuUserId: osuUser.osuUserId,
					},
				});

				if (guildTrackers.length === 0) {
					await userTimer.destroy();
				}

				await interaction.followUp({ content: `Not tracking \`${osuUser.osuName.replace(/`/g, '')}\` because no attributes are going to be tracked.`, ephemeral: true });
			}

			return interaction.editReply({ content: 'Finished processing.', ephemeral: true });
		} else if (interaction.options._subcommand === 'disable') {
			try {
				await interaction.reply({ content: 'Processing...', ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			let usernames = interaction.options.getString('usernames');

			usernames = usernames.split(',');
			usernames = usernames.map(username => username.trim());

			for (let i = 0; i < usernames.length; i++) {
				let username = usernames[i];

				//Get the user from the database if possible
				logDatabaseQueries(4, 'commands/osu-track.js disable DBDiscordUsers');
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
						const user = await osuApi.getUser({ u: username });
						osuUser.osuUserId = user.id;
						osuUser.osuName = user.name;
					} catch (error) {
						console.error(error);
						await interaction.followUp({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\`.`, ephemeral: true });
						continue;
					}
				}

				//Create the timer for checking the user if needed
				logDatabaseQueries(4, 'commands/osu-track.js disable DBOsuTrackingUsers');
				let userTimer = await DBOsuTrackingUsers.findOne({
					where: {
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!userTimer) {
					await interaction.editReply({ content: `Currently not tracking \`${osuUser.osuName.replace(/`/g, '')}\` in <#${interaction.channel.id}>.`, ephemeral: true });
					continue;
				}

				//Create or update the guild tracker
				logDatabaseQueries(4, 'commands/osu-track.js disable DBOsuGuildTrackers 1');
				let guildTracker = await DBOsuGuildTrackers.findOne({
					where: {
						guildId: interaction.guild.id,
						channelId: interaction.channel.id,
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!guildTracker) {
					await interaction.editReply({ content: `Currently not tracking \`${osuUser.osuName.replace(/`/g, '')}\` in <#${interaction.channel.id}>.`, ephemeral: true });
					continue;
				}

				let disableEverything = true;

				if (interaction.options.getBoolean('topplays')
					|| interaction.options.getBoolean('leaderboardplays')
					|| interaction.options.getBoolean('ameobea')
					|| interaction.options.getBoolean('showameobeaupdates')
					|| interaction.options.getBoolean('medals')
					|| interaction.options.getBoolean('duelrating')
					|| interaction.options.getBoolean('matchactivity')) {
					disableEverything = false;
				}

				let topPlays = interaction.options.getBoolean('topplays');

				if (topPlays || disableEverything) {
					guildTracker.osuTopPlays = false;
					guildTracker.taikoTopPlays = false;
					guildTracker.catchTopPlays = false;
					guildTracker.maniaTopPlays = false;
				}

				let leaderboardPlays = interaction.options.getBoolean('leaderboardplays');

				if (leaderboardPlays || disableEverything) {
					guildTracker.osuLeaderboard = false;
					guildTracker.taikoLeaderboard = false;
					guildTracker.catchLeaderboard = false;
					guildTracker.maniaLeaderboard = false;
				}

				let ameobea = interaction.options.getBoolean('ameobea');

				if (ameobea || disableEverything) {
					guildTracker.osuAmeobea = false;
					guildTracker.taikoAmeobea = false;
					guildTracker.catchAmeobea = false;
					guildTracker.maniaAmeobea = false;
					guildTracker.showAmeobeaUpdates = false;
				}

				let showAmeobeaUpdates = interaction.options.getBoolean('showameobeaupdates');

				if (showAmeobeaUpdates || disableEverything) {
					guildTracker.showAmeobeaUpdates = false;
				}

				let medals = interaction.options.getBoolean('medals');

				if (medals || disableEverything) {
					guildTracker.medals = false;
				}

				let duelrating = interaction.options.getBoolean('duelrating');

				if (duelrating || disableEverything) {
					guildTracker.duelRating = false;
				}

				let matchactivity = interaction.options.getBoolean('matchactivity');

				if (matchactivity || disableEverything) {
					guildTracker.matchActivity = false;
					guildTracker.matchActivityAutoTrack = false;
				}

				if (guildTracker.osuTopPlays ||
					guildTracker.taikoTopPlays ||
					guildTracker.catchTopPlays ||
					guildTracker.maniaTopPlays ||
					guildTracker.osuLeaderboard ||
					guildTracker.taikoLeaderboard ||
					guildTracker.catchLeaderboard ||
					guildTracker.maniaLeaderboard ||
					guildTracker.osuAmeobea ||
					guildTracker.taikoAmeobea ||
					guildTracker.catchAmeobea ||
					guildTracker.maniaAmeobea ||
					guildTracker.medals ||
					guildTracker.duelRating ||
					guildTracker.matchActivity) {
					await guildTracker.save();

					await interaction.followUp({ content: `Updated tracking \`${osuUser.osuName.replace(/`/g, '')}\` in <#${interaction.channel.id}>.`, ephemeral: true });

					continue;
				}

				// If nothing is tracked, delete the tracker
				await guildTracker.destroy();

				// Find other guild trackers, if none exsist, delete the user tracker
				logDatabaseQueries(4, 'commands/osu-track.js disable DBOsuGuildTrackers 2');
				const guildTrackers = await DBOsuGuildTrackers.findAll({
					where: {
						osuUserId: osuUser.osuUserId,
					},
				});

				if (guildTrackers.length === 0) {
					await userTimer.destroy();
				}

				await interaction.followUp({ content: `Removed tracking \`${osuUser.osuName.replace(/`/g, '')}\` because no attributes are going to be tracked.`, ephemeral: true });
			}

			return interaction.editReply({ content: 'Finished processing.', ephemeral: true });
		} else if (interaction.options._subcommand === 'list') {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			logDatabaseQueries(4, 'commands/osu-track.js list DBOsuGuildTrackers users');
			let guildTrackers = await DBOsuGuildTrackers.findAll({
				where: {
					channelId: interaction.channel.id,
					osuUserId: {
						[Op.ne]: null,
					}
				},
			});

			let output = [];

			if (guildTrackers.length === 0) {
				output.push('There are currently no users tracked in this channel.');
			}

			for (let i = 0; i < guildTrackers.length; i++) {
				let username = guildTrackers[i].osuUserId;

				//Get the user from the database if possible
				logDatabaseQueries(4, 'commands/osu-track.js list DBDiscordUsers');
				let discordUser = await DBDiscordUsers.findOne({
					where: {
						osuUserId: username,
					},
					order: [
						['osuName', 'ASC'],
					],
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
						const user = await osuApi.getUser({ u: username });
						osuUser.osuUserId = user.id;
						osuUser.osuName = user.name;
					} catch (error) {
						console.error(error);
						await interaction.followUp({ content: `Could not find user \`${osuUser.id.replace(/`/g, '')}\` anymore.`, ephemeral: true });
						continue;
					}
				}

				let topPlayTrackings = [];

				if (guildTrackers[i].osuTopPlays) {
					topPlayTrackings.push('osu!');
				}

				if (guildTrackers[i].taikoTopPlays) {
					topPlayTrackings.push('Taiko');
				}

				if (guildTrackers[i].catchTopPlays) {
					topPlayTrackings.push('Catch');
				}

				if (guildTrackers[i].maniaTopPlays) {
					topPlayTrackings.push('Mania');
				}

				if (!topPlayTrackings.length) {
					topPlayTrackings.push('Not tracked');
				}

				let leaderboardTrackings = [];

				if (guildTrackers[i].osuLeaderboard) {
					leaderboardTrackings.push('osu!');
				}

				if (guildTrackers[i].taikoLeaderboard) {
					leaderboardTrackings.push('Taiko');
				}

				if (guildTrackers[i].catchLeaderboard) {
					leaderboardTrackings.push('Catch');
				}

				if (guildTrackers[i].maniaLeaderboard) {
					leaderboardTrackings.push('Mania');
				}

				if (!leaderboardTrackings.length) {
					leaderboardTrackings.push('Not tracked');
				}

				let ameobeaTrackings = [];

				if (guildTrackers[i].osuAmeobea) {
					ameobeaTrackings.push('osu!');
				}

				if (guildTrackers[i].taikoAmeobea) {
					ameobeaTrackings.push('Taiko');
				}

				if (guildTrackers[i].catchAmeobea) {
					ameobeaTrackings.push('Catch');
				}

				if (guildTrackers[i].maniaAmeobea) {
					ameobeaTrackings.push('Mania');
				}

				if (!ameobeaTrackings.length) {
					ameobeaTrackings.push('Not tracked');
				}

				let showAmeobeaUpdates = guildTrackers[i].showAmeobeaUpdates ? ' \n- Showing ameobea updates' : '';

				let medals = guildTrackers[i].medals ? ' \n- Showing medals' : '';

				let duelRating = guildTrackers[i].duelRating ? ' \n- Showing duel rating updates' : '';

				let matchActivity = '';

				if (guildTrackers[i].matchActivity) {
					matchActivity = ' \n- Showing match activity';
					if (guildTrackers[i].matchActivityAutoTrack) {
						matchActivity += ' (auto-track)';
					}
				}

				output.push(`\`${osuUser.osuName}\`\n- Top Plays: ${topPlayTrackings.join(', ')}\n- Leaderboard Scores: ${leaderboardTrackings.join(', ')}\n- Ameobea updates: ${ameobeaTrackings.join(', ')}${showAmeobeaUpdates}${medals}${duelRating}${matchActivity}`);
			}

			output.push('\n');

			logDatabaseQueries(4, 'commands/osu-track.js list DBOsuGuildTrackers users');
			guildTrackers = await DBOsuGuildTrackers.findAll({
				where: {
					channelId: interaction.channel.id,
					acronym: {
						[Op.ne]: null,
					}
				},
				order: [
					['acronym', 'ASC']
				]
			});

			if (guildTrackers.length === 0) {
				output.push('There are currently no tourneys tracked in this channel.');
			}

			for (let i = 0; i < guildTrackers.length; i++) {
				let matchActivity = ' \n- Showing match activity';
				if (guildTrackers[i].matchActivityAutoTrack) {
					matchActivity += ' (auto-track)';
				}
				output.push(`\`${guildTrackers[i].acronym}\`${matchActivity}`);
			}

			let currentOutput = [];

			while (output.length) {
				while (currentOutput.length < 10 && output.length) {
					currentOutput.push(output.shift());
				}

				await interaction.followUp({ content: currentOutput.join('\n\n'), ephemeral: true });
				currentOutput = [];
			}
		} else if (interaction.options._subcommand === 'tourneyenable') {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			let acronym = interaction.options.getString('acronym');

			let tracking = interaction.options.getString('matchactivity');

			let guildTracker = await DBOsuGuildTrackers.findOne({
				where: {
					guildId: interaction.guild.id,
					channelId: interaction.channel.id,
					acronym: acronym,
				}
			});

			if (!guildTracker) {
				guildTracker = await DBOsuGuildTrackers.create({
					guildId: interaction.guild.id,
					channelId: interaction.channel.id,
					acronym: acronym,
					matchActivity: true,
				});
			}

			if (tracking === 'matches (auto matchtrack)') {
				guildTracker.matchActivityAutoTrack = true;
			} else {
				guildTracker.matchActivityAutoTrack = false;
			}

			await guildTracker.save();

			return interaction.followUp({ content: `Match activity tracking updated for ${acronym} in this channel.`, ephemeral: true });
		} else if (interaction.options._subcommand === 'tourneydisable') {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			let acronym = interaction.options.getString('acronym');

			let guildTracker = await DBOsuGuildTrackers.findOne({
				where: {
					guildId: interaction.guild.id,
					channelId: interaction.channel.id,
					acronym: acronym,
				}
			});

			if (guildTracker) {
				await guildTracker.destroy();

				return interaction.followUp({ content: `Match activity tracking disabled for ${acronym} in this channel.`, ephemeral: true });
			}

			return interaction.followUp({ content: `Match activity tracking is not enabled for ${acronym} in this channel.`, ephemeral: true });
		}
	},
};