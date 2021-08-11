const { DBDiscordUsers, DBProcessQueue, DBElitiriCupSignUp, DBElitiriCupSubmissions } = require('../dbObjects');
const { getOsuBadgeNumberById } = require('../utils.js');
const osu = require('node-osu');

module.exports = {
	async execute(client, processQueueEntry) {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		const discordUserId = processQueueEntry.additions;

		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: discordUserId }
		});

		try {
			const osuUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 0 });

			discordUser.osuName = osuUser.name;
			discordUser.osuPP = osuUser.pp.raw;
			discordUser.osuRank = osuUser.pp.rank;

			const taikoUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 1 });

			discordUser.taikoPP = taikoUser.pp.raw;
			discordUser.taikoRank = taikoUser.pp.rank;

			const catchUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 2 });

			discordUser.catchPP = catchUser.pp.raw;
			discordUser.catchRank = catchUser.pp.rank;

			const maniaUser = await osuApi.getUser({ u: discordUser.osuUserId, m: 3 });

			discordUser.maniaPP = maniaUser.pp.raw;
			discordUser.maniaRank = maniaUser.pp.rank;

			discordUser.osuBadges = await getOsuBadgeNumberById(discordUser.osuUserId);

			discordUser.osuNotFoundFirstOccurence = null;

			await discordUser.save();
		} catch (error) {
			if (error.message === 'Not found') {
				let now = new Date();
				let halfWeekAgo = new Date();
				halfWeekAgo.setUTCDate(halfWeekAgo.getUTCDate() - 3);
				if (discordUser.osuNotFoundFirstOccurence === null) {
					discordUser.osuNotFoundFirstOccurence = now;
					discordUser.save();
				} else if (discordUser.osuNotFoundFirstOccurence && halfWeekAgo > discordUser.osuNotFoundFirstOccurence) {
					const user = await client.users.fetch(discordUser.userId).catch(async () => {
						//Nothing
					});

					discordUser.osuUserId = null;
					discordUser.osuVerificationCode = null;
					discordUser.osuVerified = null;
					discordUser.osuName = null;
					discordUser.osuBadges = 0;
					discordUser.osuPP = null;
					discordUser.osuRank = null;
					discordUser.taikoPP = null;
					discordUser.taikoRank = null;
					discordUser.catchPP = null;
					discordUser.catchRank = null;
					discordUser.maniaPP = null;
					discordUser.maniaRank = null;

					if (user) {
						try {
							await user.send('Your osu! account could not be found anymore for multiple days.\nIf you think this is an issue try linking it again or message Eliteronix#4208');
						} catch (error) {
							//Nothing
						}
					}

					//Remove from MOTD
					discordUser.osuMOTDRegistered = null;
					discordUser.osuMOTDMuted = null;
					discordUser.osuMOTDLastRoundPlayed = null;
					discordUser.osuMOTDerrorFirstOccurence = null;
					discordUser.osuMOTDmutedUntil = null;

					discordUser.osuNotFoundFirstOccurence = null;
					await discordUser.save();

					if (user) {
						try {
							await user.send('Your MOTD registration has been removed in the process.');
						} catch (error) {
							//Nothing
						}
					}

					const elitiriSignUp = await DBElitiriCupSignUp.findOne({
						where: { osuUserId: discordUser.osuUserId, tournamentName: 'Elitiri Cup Summer 2021' }
					});

					if (elitiriSignUp) {
						const task = await DBProcessQueue.findOne({
							where: { guildId: 'None', task: 'refreshElitiriSignUp', additions: discordUser.osuUserId }
						});

						if (!task) {
							DBProcessQueue.create({ guildId: 'None', task: 'refreshElitiriSignUp', priority: 3, additions: discordUser.osuUserId });
						}

						const allSubmissions = await DBElitiriCupSubmissions.findAll({
							where: { osuUserId: elitiriSignUp.osuUserId, tournamentName: 'Elitiri Cup Summer 2021' }
						});

						allSubmissions.forEach(submission => {
							submission.destroy();
						});

						await elitiriSignUp.destroy();

						if (user) {
							try {
								await user.send('Your Elitiri Cup registration has been removed in the process.');
							} catch (error) {
								//Nothing
							}
						}
					}

				}

			} else {
				console.log(error);
			}
		}

		const elitiriSignUp = await DBElitiriCupSignUp.findOne({
			where: { osuUserId: discordUser.osuUserId, tournamentName: 'Elitiri Cup Summer 2021' }
		});

		if (elitiriSignUp) {
			const guild = await client.guilds.fetch('727407178499096597');
			try {
				const member = await guild.members.fetch(discordUserId);

				const ecs2021ParticipantRoleId = '875031092921532416';
				const ecs2021ParticipantRole = await guild.roles.fetch(ecs2021ParticipantRoleId);

				if (elitiriSignUp.rankAchieved !== 'Forfeit') {
					try {
						if (!member.roles.cache.has(ecs2021ParticipantRole)) {
							//Assign role if not there yet
							await member.roles.add(ecs2021ParticipantRole);
						}
					} catch (e) {
						console.log(e);
					}
				} else {
					try {
						if (member.roles.cache.has(ecs2021ParticipantRole)) {
							//Remove role if not removed yet
							await member.roles.remove(ecs2021ParticipantRole);
						}
					} catch (e) {
						console.log(e);
					}
				}

				if (elitiriSignUp.rankAchieved === 'Winner') {
					const ecs2021WinnerRoleId = '875031510288306267';
					const ecs2021WinnerRole = await guild.roles.fetch(ecs2021WinnerRoleId);

					try {
						if (!member.roles.cache.has(ecs2021WinnerRole)) {
							//Assign role if not there yet
							await member.roles.add(ecs2021WinnerRole);
						}
					} catch (e) {
						console.log(e);
					}
				}
			} catch (error) {
				//nothing
			}

			const task = await DBProcessQueue.findOne({
				where: { guildId: 'None', task: 'refreshElitiriSignUp', additions: discordUser.osuUserId }
			});

			if (!task) {
				DBProcessQueue.create({ guildId: 'None', task: 'refreshElitiriSignUp', priority: 3, additions: discordUser.osuUserId });
			}
		}
	},
};