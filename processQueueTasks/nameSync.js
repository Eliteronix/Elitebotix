module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('nameSync');

		client.shard.broadcastEval(async (c, { guildId, processQueueEntryId, setting }) => {
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
					await DBProcessQueue.destroy({ where: { id: processQueueEntryId } });
					return;
				} else {
					return console.error('processQueueTasks/nameSync.js fetch guild', e);
				}
			}

			if (guild) {
				//Fetch all members
				await guild.members.fetch()
					.then(async (guildMembers) => {
						const members = [];
						guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));

						logDatabaseQueries(2, 'processQueueTasks/nameSync.js DBDiscordUsers');
						let discordUsers = await DBDiscordUsers.findAll({
							where: {
								userId: {
									[Op.in]: members.map(member => member.user.id),
								},
							}
						});

						for (let i = 0; i < members.length; i++) {
							//Get the user
							logDatabaseQueries(2, 'processQueueTasks/nameSync.js DBDiscordUsers');
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
					});
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