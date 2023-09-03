const { logBroadcastEval } = require('../config.json');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		// console.log('nameSync');

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting processQueueTasks/nameSync.js to shards...');
		}

		client.shard.broadcastEval(async (c, { guildId, processQueueEntryId, setting }) => {
			try {
				// eslint-disable-next-line no-undef
				const { DBProcessQueue, DBDiscordUsers } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
				// eslint-disable-next-line no-undef
				const { logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);
				const { Op } = require('sequelize');

				let guild;
				try {
					guild = await c.guilds.cache.get(guildId);
				} catch (e) {
					if (e.message === 'Missing Access') {
						logDatabaseQueries(2, 'processQueueTasks/nameSync.js DBProcessQueue destroy');
						await DBProcessQueue.destroy({ where: { id: processQueueEntryId } });
						return;
					} else {
						return console.error('processQueueTasks/nameSync.js fetch guild', e);
					}
				}

				if (!guild || guild.shardId !== c.shardId) {
					return;
				}

				//Fetch all members
				let members = null;
				try {
					members = await guild.members.fetch({ time: 300000 });

					members = members.filter(member => member.user.bot !== true).map(member => member);
				} catch (e) {
					if (e.message !== 'Members didn\'t arrive in time.') {
						console.error('processQueueTasks/nameSync.js | Get members', e);
						return;
					}
				}

				logDatabaseQueries(2, 'processQueueTasks/nameSync.js DBDiscordUsers');
				let discordUsers = await DBDiscordUsers.findAll({
					attributes: ['userId', 'osuUserId', 'osuName', 'osuRank', 'osuVerified'],
					where: {
						userId: {
							[Op.in]: members.map(member => member.user.id),
						},
					}
				});

				for (let i = 0; i < members.length; i++) {
					//Get the user
					let discordUser = discordUsers.find(user => user.userId === members[i].user.id);

					if (members[i].user.id !== guild.ownerId && discordUser && discordUser.osuUserId && discordUser.osuVerified) {
						try {
							//Get the users displayname
							let userDisplayName = members[i].user.username;

							if (members[i].nickname) {
								userDisplayName = members[i].nickname;
							}

							//Set what the user's nickname should be
							let nickname = '';
							if (setting === 'osuname') {
								nickname = discordUser.osuName;
							} else if (setting === 'osunameandrank') {
								let rank = discordUser.osuRank;
								if (rank.length > 4) {
									rank = `${rank.substring(0, rank.length - 3)}k`;
								}

								nickname = `${discordUser.osuName} [${rank}]`;
							}
							//Set nickname if needed
							if (userDisplayName !== nickname) {
								await members[i].setNickname(nickname);
							}
						} catch (e) {
							if (!e.message === 'Missing Permissions') {
								return console.error('processQueueTasks/nameSync.js setNickname', e);
							}
						}
					}
				}
			} catch (e) {
				console.error('Error in processQueueTasks/nameSync.js', e);
			}
		}, { context: { guildId: processQueueEntry.guildId, processQueueEntryId: processQueueEntry.id, setting: processQueueEntry.additions } });

		//Set the date and prepare for new execution
		let date = new Date();
		date.setMinutes(date.getMinutes() + 10);
		processQueueEntry.date = date;
		processQueueEntry.beingExecuted = false;
		processQueueEntry.save();
	},
};