const { DBOsuTrackingUsers, DBDiscordUsers, DBOsuGuildTrackers } = require('../dbObjects');
const osu = require('node-osu');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { Op } = require('sequelize');

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
				let userTimer = await DBOsuTrackingUsers.findOne({
					where: {
						osuUserId: osuUser.osuUserId,
					}
				});

				if (!userTimer) {
					let nextCheck = new Date();
					nextCheck.setMinutes(nextCheck.getMinutes() + 15);

					await DBOsuTrackingUsers.create({
						osuUserId: osuUser.osuUserId,
						nextCheck: nextCheck,
					});
				}

				//Create or update the guild tracker
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
		}
	},
};