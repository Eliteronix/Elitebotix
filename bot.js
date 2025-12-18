//Log message upon starting the bot
// eslint-disable-next-line no-console
const { wrongCluster, syncJiraCards, createNewForumPostRecords, processOsuTrack } = require('./utils');

require('dotenv').config();

if (typeof process.send !== 'function') {
	const noop = () => { };
	noop.__isNoop = true;
	process.send = noop;
}

const originalConsoleError = console.error;

console.error = function (...args) {
	process.send('error');
	originalConsoleError.apply(console, args);
};

//require the discord.js module
const Discord = require('discord.js');

let clientProperties = {
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
};

const shardId = parseInt(process.argv[2]);
const shardCount = parseInt(process.argv[3]);

if (shardId) {
	clientProperties.shards = [shardId];
	clientProperties.shardCount = shardCount;

	// command to start a specific shard:
	// clinic flame -- node shard.js shardId shardCount
	// eslint-disable-next-line no-console
	console.log(`Starting shard ${shardId} out of ${shardCount} shards manually with PID ${process.pid}`);
}

//create a Discord client with discord.js
const client = new Discord.Client(clientProperties);

//Get gotMessage
const gotMessage = require('./gotMessage');

//Get guildMemberAdd
const guildMemberAdd = require('./guildMemberAdd');

//Get guildMemberRemove
const guildMemberRemove = require('./guildMemberRemove');

//Get reactionAdded
const reactionAdded = require('./reactionAdded');

//Get reactionRemoved
const reactionRemoved = require('./reactionRemoved');

//Get voiceStateUpdate
const voiceStateUpdate = require('./voiceStateUpdate');

//Get guildCreate
const guildCreate = require('./guildCreate');

//Get channelDelete
const channelDelete = require('./channelDelete');

//Get interactionCreate
const interactionCreate = require('./interactionCreate');

//Get executeNextProcessQueueTask
const { executeNextProcessQueueTask, refreshOsuRank, restartProcessQueueTask, cleanUpDuplicateEntries, checkForBirthdays } = require('./utils');

const { DBProcessQueue } = require('./dbObjects');
const { Op } = require('sequelize');

//login with the Discord client using the Token from the .env file
client.login(process.env.BOTTOKEN);

client.startDate = new Date();
client.matchTracks = [];
client.bingoMatches = [];
client.hostCommands = [];
client.update = 0;
client.knownSuspiciousMatches = [];

process.messages = [];

//Get manager messages
process.webRequestsWaiting = [];
process.on('message', message => {
	if (!message.type) return false;

	if (message.type == 'shardId') {
		// eslint-disable-next-line no-console
		console.log(`Shard ${message.data.shardId} is ready with PID ${process.pid}`);
		client.shardId = message.data.shardId;
		process.shardId = message.data.shardId;

		if (!wrongCluster(client)) {
			restartProcessQueueTask();
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

process.on('unhandledRejection', (reason) => {
	if (reason.message !== 'Channel closed') {
		console.error('Unhandled rejection, bot.js: ', reason.message, ' | ', reason);
	}
});

//declare what the discord client should do when it's ready
client.on('ready', readyDiscord);

//declare the function which will be used when ready
function readyDiscord() {
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
			let commandJson = command.data.toJSON();
			commandJson.integration_types = command.integration_types;
			commandJson.contexts = command.contexts;

			commands.push(commandJson);
		}
	}

	const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);

	(async () => {
		let notDone = true;
		while (notDone) {
			try {
				const data = await rest.put(
					Routes.applicationCommands(client.user.id),
					{ body: commands },
				);

				// eslint-disable-next-line no-console
				console.log(`[${client.shardId}] Successfully reloaded ${data.length} application (/) commands.`);

				client.slashCommandData = data;
				notDone = false;
			} catch (error) {
				console.error('bot.js | Set application commands' + error);
			}
		}
	})();

	setTimeout(() => {
		executeProcessQueue(client);

		startJiraCardSync(client);
	}, 60000);

	const blocked = require('blocked-at');

	const { logBroadcastEval } = require('./config.json');

	blocked((time, stack, { type, resource }) => {
		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting bot.js event loop blocked...');
		}

		let header = '###';

		if (time.toFixed() > 20000) {
			header = '#';
		} else if (time.toFixed() > 10000) {
			header = '##';
		}

		client.shard.broadcastEval(async (c, { message }) => {
			let guildId = null;
			let channelId = null;
			if (process.env.SERVER === 'Dev') {
				guildId = '800641468321759242';
				channelId = '1365819208545603605';
			} else {
				guildId = '727407178499096597';
				channelId = '1365819043306672208';
			}

			const guild = await c.guilds.cache.get(guildId);

			if (!guild || guild.shardId !== c.shardId) {
				return;
			}

			const channel = await guild.channels.cache.get(channelId);

			if (!channel) return;

			await channel.send(message);
		}, { context: { message: `${header} Shard ${client.shardId} Blocked for ${time.toFixed()}ms\noperation: ${type}, resource: ${resource}\n\`\`\`${stack.join('\n')}\`\`\`` } });
	}, { threshold: 5000 });
}

client.on('messageCreate', msg => gotMessage(msg));

client.on('guildMemberAdd', guildMemberAdd);

client.on('guildMemberRemove', guildMemberRemove);

client.on('messageReactionAdd', (reaction, user) => {
	reactionAdded(reaction, user);
});

client.on('messageReactionRemove', reactionRemoved);

client.on('voiceStateUpdate', voiceStateUpdate);

client.on('guildCreate', guildCreate);

client.on('channelDelete', channelDelete);

client.on('interactionCreate', interaction => {
	interactionCreate(client, interaction);
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
	resetImportMatches();

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

async function executeProcessQueue(client) {
	try {
		await executeNextProcessQueueTask(client);
	} catch (e) {
		console.error('bot.js | executeNextProcessQueueTask' + e);
	}

	setTimeout(() => {
		executeProcessQueue(client);
	}, 1000);
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

async function resetImportMatches() {
	try {
		const tasksToReset = ['importMatch'];

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
		console.error('bot.js | resetImportMatches' + e);
	}

	setTimeout(() => {
		resetImportMatches();
	}, 10000);
}