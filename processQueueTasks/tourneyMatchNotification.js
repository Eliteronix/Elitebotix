const { DBDiscordUsers, DBProcessQueue } = require('../dbObjects');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let channel = await client.channels.fetch(args[1]);
		if (channel) {
			let players = args[3].split(',');
			let dbPlayers = [];
			for (let i = 0; i < players.length; i++) {
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
			let timeUntilMatch = Math.round((matchTime - now) / 1000 / 60);
			if (timeUntilMatch < 1) {
				timeUntilMatch = 1;
			}
			let timeUntilInvites = Math.round((inviteTime - now) / 1000 / 60);
			if (timeUntilInvites < 1) {
				timeUntilInvites = 1;
			}
			channel.send(`Hi, I will be reffing your match <@${dbPlayers.join('>, <@')}>!\nYour match starts in ${timeUntilMatch} minutes. Invites will be sent in ${timeUntilInvites} minutes.\nIngame invites will be sent out by \`Eliteronix\` - be sure to allow DMs on discord as a backup.`);
			DBProcessQueue.create({ guildId: processQueueEntry.guildId, task: 'tourneyMatchReferee', priority: 10, additions: processQueueEntry.additions, date: inviteTime });
		} else {
			let players = args[3].split(',');
			let dbPlayers = [];
			for (let i = 0; i < players.length; i++) {
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