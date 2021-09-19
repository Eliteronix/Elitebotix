const { DBDiscordUsers } = require('../dbObjects');
const { pause } = require('../utils');

module.exports = {
	async execute(client, bancho, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let channel;

		for (let i = 0; i < 5; i++) {
			try {
				try {
					await bancho.connect();
				} catch (error) {
					if (!error.message === 'Already connected/connecting') {
						throw (error);
					}
				}
				channel = await bancho.createLobby(args[5]);
				break;
			} catch (error) {
				if (i === 4) {
					let players = args[3].split(',');
					let dbPlayers = [];
					for (let j = 0; j < players.length; j++) {
						const dbDiscordUser = await DBDiscordUsers.findOne({
							where: { id: players[j] }
						});
						dbPlayers.push(dbDiscordUser.osuName);
					}
					let user = await client.users.fetch(args[0]);
					user.send(`I am having issues creating the lobby and the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayers.join(', ')}\nMappool: ${args[2]}`);
					let discordChannel = await client.channels.fetch(args[1]);
					return discordChannel.send(`I am having issues creating the lobby and the match has been aborted.\nMatch: \`${args[5]}\`\nScheduled players: ${dbPlayers.join(', ')}\nMappool: ${args[2]}`);
				} else {
					await pause(10000);
				}
			}
		}

		let players = args[3].split(',');
		let dbPlayers = [];
		let users = [];
		for (let i = 0; i < players.length; i++) {
			const dbDiscordUser = await DBDiscordUsers.findOne({
				where: { id: players[i] }
			});
			dbPlayers.push(dbDiscordUser);
			const user = await client.users.fetch(dbDiscordUser.userId);
			users.push(user);
		}

		const lobby = channel.lobby;

		const password = Math.random().toString(36).substring(8);

		await lobby.setPassword(password);
		await channel.sendMessage('!mp map 975342 0');
		await channel.sendMessage(`!mp set 0 3 ${dbPlayers.length}`);


		for (let i = 0; i < users.length; i++) {
			await channel.sendMessage(`!mp invite #${dbPlayers[i].osuUserId}`);
			await messageUserWithRetries(client, users[i], args[1], `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
		}

		processQueueEntry.destroy();
	},
};

async function messageUserWithRetries(client, user, channelId, content) {
	for (let i = 0; i < 3; i++) {
		try {
			await user.send(content)
				.then(() => {
					i = Infinity;
				})
				.catch(async (error) => {
					throw (error);
				});
		} catch (error) {
			if (error.message === 'Cannot send messages to this user' || error.message === 'Internal Server Error') {
				if (i === 2) {
					const channel = await client.channels.fetch(channelId);
					channel.send(`<@${user.id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
				} else {
					await pause(2500);
				}
			} else {
				i = Infinity;
				console.log(error);
			}
		}
	}
}