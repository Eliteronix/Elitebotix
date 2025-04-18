//Log message upon starting the bot
// eslint-disable-next-line no-console
console.log('Bot is starting...');
const { wrongCluster, syncJiraCards, createNewForumPostRecords, processOsuTrack, logDatabaseQueries, reconnectToBanchoAndChannels } = require('./utils');

require('dotenv').config();

//require the discord.js module
const Discord = require('discord.js');
//create a Discord client with discord.js
const client = new Discord.Client({
	intents: [
		Discord.GatewayIntentBits.Guilds,
		Discord.GatewayIntentBits.GuildMembers,
		Discord.GatewayIntentBits.GuildBans,
		Discord.GatewayIntentBits.GuildEmojisAndStickers,
		Discord.GatewayIntentBits.GuildIntegrations,
		Discord.GatewayIntentBits.GuildWebhooks,
		Discord.GatewayIntentBits.GuildInvites,
		Discord.GatewayIntentBits.GuildVoiceStates,
		Discord.GatewayIntentBits.GuildMessages,
		Discord.GatewayIntentBits.GuildMessageReactions,
		Discord.GatewayIntentBits.DirectMessages,
		Discord.GatewayIntentBits.DirectMessageReactions,
	],
	partials: [
		Discord.Partials.Message,
		Discord.Partials.Reaction,
		Discord.Partials.Channel,
	]
});

//Get gotMessage
const gotMessage = require('./gotMessage');

//Get messageUpdate
const messageUpdate = require('./messageUpdate');

//Get messageDelete
const messageDelete = require('./messageDelete');

//Get guildMemberAdd
const guildMemberAdd = require('./guildMemberAdd');

//Get guildMemberRemove
const guildMemberRemove = require('./guildMemberRemove');

//Get guildMemberUpdate
const guildMemberUpdate = require('./guildMemberUpdate');

//Get guildBanAdd
const guildBanAdd = require('./guildBanAdd');

//Get guildBanRemove
const guildBanRemove = require('./guildBanRemove');

//Get userUpdate
const userUpdate = require('./userUpdate');

//Get reactionAdded
const reactionAdded = require('./reactionAdded');

//Get reactionRemoved
const reactionRemoved = require('./reactionRemoved');

//Get voiceStateUpdate
const voiceStateUpdate = require('./voiceStateUpdate');

//Get guildCreate
const guildCreate = require('./guildCreate');

//Get guildUpdate
const guildUpdate = require('./guildUpdate');

//Get roleCreate
const roleCreate = require('./roleCreate');

//Get roleUpdate
const roleUpdate = require('./roleUpdate');

//Get roleDelete
const roleDelete = require('./roleDelete');

//Get channelCreate
const channelCreate = require('./channelCreate');

//Get channelUpdate
const channelUpdate = require('./channelUpdate');

//Get channelDelete
const channelDelete = require('./channelDelete');

//Get inviteCreate
const inviteCreate = require('./inviteCreate');

//Get inviteDelete
const inviteDelete = require('./inviteDelete');

//Get emojiCreate
const emojiCreate = require('./emojiCreate');

//Get emojiUpdate
const emojiUpdate = require('./emojiUpdate');

//Get emojiDelete
const emojiDelete = require('./emojiDelete');

//Get interactionCreate
const interactionCreate = require('./interactionCreate');

//Get executeNextProcessQueueTask
const { executeNextProcessQueueTask, refreshOsuRank, restartProcessQueueTask, cleanUpDuplicateEntries, checkForBirthdays } = require('./utils');

const Banchojs = require('bancho.js');
const { DBProcessQueue } = require('./dbObjects');
const { Op } = require('sequelize');

const bancho = new Banchojs.BanchoClient({ username: process.env.OSUNAME, password: process.env.OSUIRC, apiKey: process.env.OSUTOKENV1 });

client.bancho = bancho;

//login with the Discord client using the Token from the .env file
client.login(process.env.BOTTOKEN);

//Get manager messages
process.webRequestsWaiting = [];
process.on('message', message => {
	if (!message.type) return false;

	if (message.type == 'shardId') {
		// eslint-disable-next-line no-console
		console.log(`The shard id is: ${message.data.shardId}`);
		client.shardId = message.data.shardId;
		process.shardId = message.data.shardId;

		// log websocket connection
		if (message.data.shardId === 7) {
			//client.on('shardDisconnect', (event, shardId) => console.log(`[${shardId}] Shard disconnected with code: ${event.code} and reason: ${event.reason}`));
			//client.on('shardReconnecting', (shardId) => console.log(`[${shardId}] Shard reconnecting...`));
			//client.on('shardReady', (shardId) => console.log(`[${shardId}] Shard ready!`));
			//client.on('shardResume', (shardId, replayedEvents) => console.log(`[${shardId}] Shard resumed with ${replayedEvents} events replayed`));
			//client.on('shardError', (error, shardId) => console.log(`[${shardId}] Shard error: ${error}`));

		}

		if (!wrongCluster(client)) {
			restartProcessQueueTask();
		}

		//Connect for the first shard
		if (!wrongCluster(client)) {

			bancho.lastUserMaps = new Discord.Collection();

			bancho.on('error', async (error) => {
				if (error.message === 'Timeout reached') {
					console.error('Timeout reached, reconnecting...');
				} else {
					console.error('Bancho error index.js:', error);
				}

				await reconnectToBanchoAndChannels(bancho);
			});
		}
	} else if (message.type == 'totalShards') {
		// eslint-disable-next-line no-console
		// console.log(`[${client.shardId}] The total amount of shards is: ${message.data.totalShards}`);
		client.totalShards = message.data.totalShards;
	} else if (message.type == 'osuWebRequest') {
		if (process.webRequestsWaiting.find(item => item.string === message.data)) {
			// Remove all instances of the message

			process.webRequestsWaiting = process.webRequestsWaiting.filter(item => item.string !== message.data);
		} else if (message.data.endsWith('.jpg') ||
			message.data.startsWith('https://osu.ppy.sh/osu/') ||
			message.data.startsWith('https://s.ppy.sh/a/') ||
			message.data.startsWith('https://assets.ppy.sh/profile-badges/')) {

			for (let i = 0; i < process.webRequestsWaiting.length; i++) {
				if (process.webRequestsWaiting[i].link === message.data) {
					process.webRequestsWaiting[i].coveredByOtherRequest = true;
				}
			}
		}
	}
});

process.on('uncaughtException', (error, origin) => {
	if (error?.code === 'ECONNRESET') {
		return;
	} else if (error?.code === 'ETIMEDOUT') {
		return;
	}
	console.error('UNCAUGHT EXCEPTION');
	console.error(error);
	console.error(origin);
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled rejection, bot.js:', reason);
});

//declare what the discord client should do when it's ready
client.on('ready', readyDiscord);

//declare the function which will be used when ready
function readyDiscord() {
	//log a message when ready
	// eslint-disable-next-line no-console
	console.log('The Bot is ready.');

	client.startDate = new Date();
	client.duels = [];
	client.otherMatches = [];
	client.matchTracks = [];
	client.bingoMatches = [];
	client.hostCommands = [];
	client.update = 0;
	client.knownSuspiciousMatches = [];

	client.user.setPresence({
		status: 'online',  //You can show online, idle....
		activities: [{
			name: 'with /help',  //The message shown
			//type: 'PLAYING' //PLAYING: WATCHING: LISTENING: STREAMING:
		}]
	});

	const { REST, Routes } = require('discord.js');
	const fs = require('node:fs');

	const commands = [];
	// Grab all the command files from the commands directory you created earlier
	const commandFiles = fs.readdirSync('./commands');

	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		if (!file.endsWith('.js')) {
			continue;
		}

		const command = require(`./commands/${file}`);

		if (command.tags !== 'debug' && command.data || command.name === 'admin') {
			commands.push(command.data.toJSON());
		}
	}

	const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);

	(async () => {
		let notDone = true;
		while (notDone) {
			try {
				// eslint-disable-next-line no-console
				console.log(`Started refreshing ${commands.length} application (/) commands.`);

				const data = await rest.put(
					Routes.applicationCommands(client.user.id),
					{ body: commands },
				);

				// eslint-disable-next-line no-console
				console.log(`Successfully reloaded ${data.length} application (/) commands.`);

				client.slashCommandData = data;
				notDone = false;
			} catch (error) {
				console.error('bot.js | Set application commands' + error);
			}
		}
	})();

	setTimeout(() => {
		executeProcessQueue(client, bancho);

		startJiraCardSync(client);
	}, 60000);

}

//log what what the client.ws is receiving
// client.on('raw', (packet) => {
// 	if (packet.t && client.shardId === 7) {
// 		// eslint-disable-next-line no-console
// 		console.log(`[${client.shardId}] ${packet.t} received`);
// 	}
// });

// client.ws.on('close', (code, reason) => {
// 	if (client.shard.ids[0] === 7) {
// 		console.warn(`[Shard ${client.shard.ids[0]}] WebSocket closed. Code: ${code}, Reason: ${reason}`);
// 	}
// });

// client.ws.on('debug', (info) => {
// 	if (client.shard.ids[0] === 7) {
// 		console.log(`[Shard ${client.shard.ids[0]}] WS Debug: ${info}`);
// 	}
// });

// // Debug logging for heartbeat etc
// client.on('debug', (msg) => {
// 	if (client.shard.ids[0] === 7) {
// 		console.log(`[DEBUG][Shard ${client.shard?.ids?.[0]}]: ${msg}`);
// 	}
// });

// const eventLoopLag = require('event-loop-lag')(1000); // check every 1s

// setInterval(() => {
// 	const lag = eventLoopLag();
// 	if (lag > 200) {
// 		console.warn(`[Shard ${client.shard.ids[0]}] Event loop lag detected: ${lag}ms`);
// 	}
// }, 5000);

let reconnects = 0;

client.on('shardReconnecting', () => {
	reconnects++;
	if (reconnects >= 10) {
		console.error(`[Shard ${client.shard.ids[0]}] Too many reconnects, exiting...`);
		process.exit(1);
	}
});

const blocked = require('blocked-at');

blocked((time, stack) => {
	console.warn(`[LAG DETECTED] Blocked for ${time}ms`);
	console.warn(stack);
}, { threshold: 10000 });

client.on('messageCreate', msg => gotMessage(msg, bancho));

client.on('messageUpdate', messageUpdate);

client.on('messageDelete', messageDelete);

client.on('guildMemberAdd', guildMemberAdd);

client.on('guildMemberRemove', guildMemberRemove);

client.on('guildMemberUpdate', guildMemberUpdate);

client.on('guildBanAdd', guildBanAdd);

client.on('guildBanRemove', guildBanRemove);

client.on('userUpdate', userUpdate);

client.on('messageReactionAdd', (reaction, user) => {
	reactionAdded(reaction, user, [client, bancho]);
});

client.on('messageReactionRemove', reactionRemoved);

client.on('voiceStateUpdate', voiceStateUpdate);

client.on('guildCreate', guildCreate);

client.on('guildUpdate', guildUpdate);

client.on('roleCreate', roleCreate);

client.on('roleUpdate', roleUpdate);

client.on('roleDelete', roleDelete);

client.on('channelCreate', channelCreate);

client.on('channelUpdate', channelUpdate);

client.on('channelDelete', channelDelete);

client.on('inviteCreate', inviteCreate);

client.on('inviteDelete', inviteDelete);

client.on('emojiCreate', emojiCreate);

client.on('emojiUpdate', emojiUpdate);

client.on('emojiDelete', emojiDelete);

client.on('interactionCreate', interaction => {
	interactionCreate(client, bancho, interaction);
});

client.on('error', console.error);

setTimeout(() => {
	if (wrongCluster(client)) {
		return;
	}

	// eslint-disable-next-line no-console
	console.log('Starting regular tasks...');

	cleanUpDuplicates(client);
	getForumPosts(client);
	checkOsuTracks(client);
	resetSaveMultiMatches();

	setInterval(() => checkForBirthdays(client), 300000);

	setInterval(() => refreshOsuRank(client), 50000);
}, 60000);

// Set update to 1 after 23 hours to make it restart
setTimeout(() => {
	client.update = 1;
}, 82800000);

// let nextMBThreshold = 3000;

// setInterval(function () {
// 	let memMB = process.memoryUsage().rss / 1048576;
// 	if (memMB > nextMBThreshold) {
// 		// eslint-disable-next-line no-console
// 		console.log(`[${client.shardId}] ${new Date()} Heap snapshot taken at ${memMB}MB`);

// 		const fs = require('fs');

// 		//Check if the maps folder exists and create it if necessary
// 		if (!fs.existsSync('./heapSnapshots')) {
// 			fs.mkdirSync('./heapSnapshots');
// 		}

// 		require('v8').writeHeapSnapshot(`./heapSnapshots/heapSnapshot${client.shardId}-${nextMBThreshold}.heapsnapshot`);
// 		nextMBThreshold += 500;
// 	}
// }, 6000 * 2);

async function executeProcessQueue(client, bancho) {
	try {
		await executeNextProcessQueueTask(client, bancho);
	} catch (e) {
		console.error('bot.js | executeNextProcessQueueTask' + e);
	}

	setTimeout(() => {
		executeProcessQueue(client, bancho);
	}, 650);
}

async function cleanUpDuplicates(client) {
	try {
		await cleanUpDuplicateEntries(client);
	} catch (e) {
		console.error('bot.js | cleanUpDuplicates' + e);
	}

	setTimeout(() => {
		cleanUpDuplicates(client);
	}, 3600000);
}

async function startJiraCardSync(client) {
	try {
		await syncJiraCards(client);
	} catch (e) {
		console.error('bot.js | syncJiraCards' + e);
	}

	setTimeout(() => {
		startJiraCardSync(client);
	}, 900000);
}

async function getForumPosts(client) {
	try {
		await createNewForumPostRecords(client);
	} catch (e) {
		console.error('bot.js | createNewForumPostRecords' + e);
	}

	setTimeout(() => {
		getForumPosts(client);
	}, 3600000);
}

async function checkOsuTracks(client) {
	try {
		await processOsuTrack(client);
	} catch (e) {
		if (e !== 'Timeout in osu! track - reject') {
			console.error('bot.js | processOsuTrack ' + e);
		}
	}

	setTimeout(() => {
		checkOsuTracks(client);
	}, 1000);
}

async function resetSaveMultiMatches() {
	try {
		const tasksToReset = ['saveMultiMatches', 'importMatch'];

		logDatabaseQueries(2, 'bot.js DBProcessQueue');
		const task = await DBProcessQueue.findOne({
			attributes: ['id', 'task', 'beingExecuted', 'updatedAt'],
			where: {
				task: {
					[Op.in]: tasksToReset,
				},
				beingExecuted: true,
			},
		});

		let date = new Date();
		date.setMinutes(date.getMinutes() - 5);

		if (task && task.updatedAt < date) {
			task.beingExecuted = false;
			await task.save();
			// eslint-disable-next-line no-console
			// console.log(`Reset ${task.task} task`);
		}
	} catch (e) {
		console.error('bot.js | resetSaveMultiMatches' + e);
	}

	setTimeout(() => {
		resetSaveMultiMatches();
	}, 10000);
}