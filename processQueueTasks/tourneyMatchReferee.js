const { DBDiscordUsers, DBOsuBeatmaps } = require('../dbObjects');
const { pause, saveOsuMultiScores } = require('../utils');

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
		let playerIds = [];
		let users = [];
		for (let i = 0; i < players.length; i++) {
			const dbDiscordUser = await DBDiscordUsers.findOne({
				where: { id: players[i] }
			});
			dbPlayers.push(dbDiscordUser);
			playerIds.push(dbDiscordUser.osuUserId);
			const user = await client.users.fetch(dbDiscordUser.userId);
			users.push(user);
		}

		const lobby = channel.lobby;

		const password = Math.random().toString(36).substring(8);

		await lobby.setPassword(password);
		await channel.sendMessage('!mp map 975342 0');
		await channel.sendMessage(`!mp set 0 3 ${dbPlayers.length}`);
		let lobbyStatus = 'Joining phase';
		let mapIndex = 0;
		let maps = args[2].split(',');
		let dbMaps = [];
		for (let i = 0; i < maps.length; i++) {
			const dbOsuBeatmap = await DBOsuBeatmaps.findOne({
				where: { id: maps[i] }
			});
			dbMaps.push(dbOsuBeatmap);
		}


		for (let i = 0; i < users.length; i++) {
			await channel.sendMessage(`!mp invite #${dbPlayers[i].osuUserId}`);
			await messageUserWithRetries(client, users[i], args[1], `Your match has been created. <https://osu.ppy.sh/mp/${lobby.id}>\nPlease join it using the sent invite ingame.\nIf you did not receive an invite search for the lobby \`${lobby.name}\` and enter the password \`${password}\``);
		}

		//Add timers to 10 minutes after the match and also during the scheduled time send another message
		let matchStartingTime = new Date();
		matchStartingTime.setUTCFullYear(processQueueEntry.date.getUTCFullYear());
		matchStartingTime.setUTCMonth(processQueueEntry.date.getUTCMonth());
		matchStartingTime.setUTCDate(processQueueEntry.date.getUTCDate());
		matchStartingTime.setUTCHours(processQueueEntry.date.getUTCHours());
		matchStartingTime.setUTCMinutes(processQueueEntry.date.getUTCMinutes());
		matchStartingTime.setUTCSeconds(processQueueEntry.date.getUTCSeconds());
		matchStartingTime.setUTCMinutes(processQueueEntry.date.getUTCMinutes() + 10);

		let forfeitTimer = new Date();
		forfeitTimer.setUTCFullYear(processQueueEntry.date.getUTCFullYear());
		forfeitTimer.setUTCMonth(processQueueEntry.date.getUTCMonth());
		forfeitTimer.setUTCDate(processQueueEntry.date.getUTCDate());
		forfeitTimer.setUTCHours(processQueueEntry.date.getUTCHours());
		forfeitTimer.setUTCMinutes(processQueueEntry.date.getUTCMinutes());
		forfeitTimer.setUTCSeconds(processQueueEntry.date.getUTCSeconds());
		forfeitTimer.setUTCMinutes(processQueueEntry.date.getUTCMinutes() + 20);
		//Add discord messages and also ingame invites for the timers
		channel.on('message', async (msg) => {
			let now = new Date();
			if (msg.user.ircUsername === 'BanchoBot' && msg.message === 'Countdown finished') {
				//Banchobot countdown finished
				if (lobbyStatus === 'Joining phase') {
					await lobby.updateSettings();
					let allPlayersReady = true;
					for (let i = 0; i < 16; i++) {
						let player = lobby.slots[i];
						if (player && player.state !== require('bancho.js').BanchoLobbyPlayerStates.Ready) {
							allPlayersReady = false;
						}
					}

					if (allPlayersReady) {
						await channel.sendMessage('!mp start 10');

						lobbyStatus === 'Map being played';
					} else {
						lobbyStatus = 'Waiting for start';

						await channel.sendMessage('Everyone please ready up!');
						await channel.sendMessage('!mp timer 120');
					}
				} else if (lobbyStatus === 'Waiting for start') {
					await channel.sendMessage('!mp start 10');

					lobbyStatus === 'Map being played';
				}
			} else if (forfeitTimer < now && lobbyStatus === 'Joining phase') {
				lobbyStatus = 'Waiting for start';

				await channel.sendMessage('Everyone please ready up!');
				await channel.sendMessage('!mp timer 120');
			}
		});

		lobby.on('playerJoined', async (obj) => {
			if (!playerIds.includes(obj.player.user.id.toString())) {
				channel.sendMessage(`!mp kick #${obj.player.user.id}`);
			} else if (lobbyStatus === 'Joining phase') {
				let allPlayersJoined = true;
				for (let i = 0; i < dbPlayers.length && allPlayersJoined; i++) {
					if (!lobby.playersById[dbPlayers[i].osuUserId.toString()]) {
						allPlayersJoined = false;
					}
				}
				if (allPlayersJoined) {
					lobbyStatus = 'Waiting for start';

					await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
					await channel.sendMessage(`!mp mods ${dbMaps[mapIndex].mods}`);
					await channel.sendMessage('Everyone please ready up!');
					await channel.sendMessage('!mp timer 120');
				}
			}
		});

		lobby.on('allPlayersReady', async () => {
			await lobby.updateSettings();
			let playersInLobby = 0;
			for (let i = 0; i < 16; i++) {
				if (lobby.slots[i]) {
					playersInLobby++;
				}
			}
			if (lobbyStatus === 'Waiting for start' && playersInLobby === dbPlayers.length) {
				await channel.sendMessage('!mp start 10');

				lobbyStatus === 'Map being played';
			}
		});

		lobby.on('matchFinished', async () => {
			if (mapIndex !== dbMaps.length) {
				mapIndex++;
				lobbyStatus = 'Waiting for start';

				await channel.sendMessage(`!mp map ${dbMaps[mapIndex].beatmapId}`);
				await channel.sendMessage(`!mp mods ${dbMaps[mapIndex].mods}`);
				await channel.sendMessage('Everyone please ready up!');
				await channel.sendMessage('!mp timer 120');
			} else {
				lobbyStatus = 'Lobby finished';

				await channel.sendMessage('Thank you everyone for playing! The lobby will automatically close in one minute.');
				await pause(60000);
				await channel.sendMessage('!mp close');
				// eslint-disable-next-line no-undef
				const osuApi = new osu.Api(process.env.OSUTOKENV1, {
					// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
					notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
					completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
					parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
				});

				osuApi.getMatch({ mp: lobby.id })
					.then(async (match) => {
						saveOsuMultiScores(match);
					})
					.catch(() => {
						//Nothing
					});
				return await channel.leave();

			}
		});

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