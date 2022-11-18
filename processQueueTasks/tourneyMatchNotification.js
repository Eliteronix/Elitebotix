const { DBDiscordUsers } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('tourneyMatchNotification');
		let args = processQueueEntry.additions.split(';');

		let foundChannel = await client.shard.broadcastEval(async (c, { channelId, processQueueEntryId }) => {
			// eslint-disable-next-line no-undef
			const { DBDiscordUsers, DBProcessQueue } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
			// eslint-disable-next-line no-undef
			const { logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);
			let processQueueEntry = await DBProcessQueue.findOne({ where: { id: processQueueEntryId } });
			let args = processQueueEntry.additions.split(';');

			let channel = await c.channels.fetch(channelId);
			if (channel) {
				let players = args[3].split(',');
				let dbPlayers = [];
				for (let i = 0; i < players.length; i++) {
					logDatabaseQueries(2, 'processQueueTasks/tourneyMatchNotification.js DBDiscordUsers 1');
					const dbDiscordUser = await DBDiscordUsers.findOne({
						where: { id: players[i] }
					});
					dbPlayers.push(dbDiscordUser.userId);
				}
				let matchTime = new Date();
				matchTime.setUTCFullYear(processQueueEntry.date.getUTCFullYear());
				matchTime.setUTCMonth(processQueueEntry.date.getUTCMonth());
				matchTime.setUTCDate(processQueueEntry.date.getUTCDate());
				matchTime.setUTCHours(processQueueEntry.date.getUTCHours());
				matchTime.setUTCMinutes(processQueueEntry.date.getUTCMinutes());
				matchTime.setUTCSeconds(processQueueEntry.date.getUTCSeconds());
				matchTime.setUTCMinutes(processQueueEntry.date.getUTCMinutes() + 15);
				let inviteTime = new Date();
				inviteTime.setUTCFullYear(processQueueEntry.date.getUTCFullYear());
				inviteTime.setUTCMonth(processQueueEntry.date.getUTCMonth());
				inviteTime.setUTCDate(processQueueEntry.date.getUTCDate());
				inviteTime.setUTCHours(processQueueEntry.date.getUTCHours());
				inviteTime.setUTCMinutes(processQueueEntry.date.getUTCMinutes());
				inviteTime.setUTCSeconds(processQueueEntry.date.getUTCSeconds());
				inviteTime.setUTCMinutes(processQueueEntry.date.getUTCMinutes() + 5);
				let now = new Date();

				let inviteSendTime = Date.parse(inviteTime) / 1000;
				if (inviteTime < now) {
					inviteSendTime = Date.parse(now) / 1000;
				}

				// eslint-disable-next-line no-undef
				channel.send(`Hi, I will be reffing your match <@${dbPlayers.join('>, <@')}>!\nYour match starts <t:${Date.parse(matchTime) / 1000}:R>. Invites will be sent <t:${inviteSendTime}:R>.\nIngame invites will be sent out by \`${process.env.OSUNAME}\` - be sure to allow DMs on discord as a backup.`);
				DBProcessQueue.create({ guildId: processQueueEntry.guildId, task: 'tourneyMatchReferee', priority: 10, additions: processQueueEntry.additions, date: inviteTime });
			}
		}, { context: { channelId: args[1], processQueueEntryId: processQueueEntry.id } });

		foundChannel = foundChannel.some(channel => channel);

		if (foundChannel) {
			let players = args[3].split(',');
			let dbPlayers = [];
			for (let i = 0; i < players.length; i++) {
				logDatabaseQueries(2, 'processQueueTasks/tourneyMatchNotification.js DBDiscordUsers 2');
				const dbDiscordUser = await DBDiscordUsers.findOne({
					where: { id: players[i] }
				});
				dbPlayers.push(dbDiscordUser.osuName);
			}
			let user = await client.users.fetch(args[0]);
			user.send(`The defined discord channel for a scheduled match could not be found anymore and therefore the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayers.join(', ')}\nMappool: ${args[2]}`);
		}

		processQueueEntry.destroy();
	},
};