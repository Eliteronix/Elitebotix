const { DBDiscordUsers } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('nameSync');
		let guild;
		try {
			guild = await client.guilds.fetch(processQueueEntry.guildId);
		} catch (e) {
			if (e.message === 'Missing Access') {
				processQueueEntry.destroy();
				return;
			} else {
				return console.log('processQueueTasks/nameSync.js fetch guild', e);
			}
		}

		//Fetch all members
		await guild.members.fetch()
			.then(async (guildMembers) => {
				const members = [];
				guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));
				for (let i = 0; i < members.length; i++) {
					//Get the user
					logDatabaseQueries(2, 'processQueueTasks/nameSync.js DBDiscordUsers');
					let discordUser = await DBDiscordUsers.findOne({
						where: {
							userId: members[i].user.id,
						}
					});

					if (members[i].user.id !== guild.ownerId && discordUser && discordUser.osuUserId && discordUser.osuVerified) {
						try {
							//Get the users displayname
							let userDisplayName = members[i].user.username;

							if (members[i].nickname) {
								userDisplayName = members[i].nickname;
							}

							//Set what the user's nickname should be
							let nickname = '';
							if (processQueueEntry.additions === 'osuname') {
								nickname = discordUser.osuName;
							} else if (processQueueEntry.additions === 'osunameandrank') {
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
								let date = new Date();
								date.setMinutes(date.getMinutes() + 10);
								processQueueEntry.date = date;
								processQueueEntry.beingExecuted = false;
								processQueueEntry.save();
								return console.log('processQueueTasks/nameSync.js setNickname', e);
							}
						}
					}
				}
			});

		//Set the date and prepare for new execution
		let date = new Date();
		date.setMinutes(date.getMinutes() + 10);
		processQueueEntry.date = date;
		processQueueEntry.beingExecuted = false;
		processQueueEntry.save();
	},
};