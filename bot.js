//Log message upon starting the bot
// eslint-disable-next-line no-console
console.log('Bot is starting...');
const { twitchConnect, wrongCluster, syncJiraCards, createNewForumPostRecords, processOsuTrack } = require('./utils');
require('dotenv').config();

//require the discord.js module
const Discord = require('discord.js');
//create a Discord client with discord.js
const client = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_BANS,
		Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
		Discord.Intents.FLAGS.GUILD_WEBHOOKS,
		Discord.Intents.FLAGS.GUILD_INVITES,
		Discord.Intents.FLAGS.GUILD_VOICE_STATES,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
	],
	partials: ['MESSAGE', 'REACTION', 'CHANNEL']
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

//Get gotBanchoPrivateMessage
const gotBanchoPrivateMessage = require('./gotBanchoPrivateMessage');

//Get executeNextProcessQueueTask
const { executeNextProcessQueueTask, refreshOsuRank, restartProcessQueueTask, cleanUpDuplicateEntries, checkForBirthdays, updateTwitchNames } = require('./utils');

//Get MOTD/getMapsOnTime
const { initializeMOTD } = require('./MOTD/initializeMOTD');

const Banchojs = require('bancho.js');
// eslint-disable-next-line no-undef
const bancho = new Banchojs.BanchoClient({ username: process.env.OSUNAME, password: process.env.OSUIRC, apiKey: process.env.OSUTOKENV1, limiterTimespan: 60000, limiterPrivate: 45, limiterPublic: 9 });

client.bancho = bancho;

//login with the Discord client using the Token from the .env file
// eslint-disable-next-line no-undef
client.login(process.env.BOTTOKEN);
client.twitchClient = null;

//Get manager messages
// eslint-disable-next-line no-undef
process.on('message', message => {
	if (!message.type) return false;

	if (message.type == 'shardId') {
		// eslint-disable-next-line no-console
		console.log(`The shard id is: ${message.data.shardId}`);
		client.shardId = message.data.shardId;

		if (!wrongCluster(client)) {
			restartProcessQueueTask();
		}

		twitchConnect(client, bancho).then(twitch => {
			client.twitchClient = twitch;
		});

		//Connect for the first shard
		// eslint-disable-next-line no-undef
		if (!wrongCluster(client) && process.env.SERVER !== 'QA') {
			bancho.connect();

			bancho.lastUserMaps = new Discord.Collection();

			//Listen to messages
			bancho.on('PM', async (message) => {
				gotBanchoPrivateMessage(client, bancho, message);
			});
		}
	} else if (message.type == 'totalShards') {
		// eslint-disable-next-line no-console
		console.log(`[${client.shardId}] The total amount of shards is: ${message.data.totalShards}`);
		client.totalShards = message.data.totalShards;
	}
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
	client.bingoMatches = 0;
	client.update = 0;

	client.user.setPresence({
		status: 'online',  //You can show online, idle....
		activities: [{
			name: 'with /help',  //The message shown
			type: 'PLAYING' //PLAYING: WATCHING: LISTENING: STREAMING:
		}]
	});

	setTimeout(() => {
		executeProcessQueue(client, bancho);

		startJiraCardSync(client);
	}, 60000);

}

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
	// eslint-disable-next-line no-undef
	if (wrongCluster(client)) {
		return;
	}
	cleanUpDuplicates();
	getForumPosts(client);
	checkOsuTracks(client);
	updateTwitchNames(client);

	setInterval(() => initializeMOTD(client, bancho, false, false), 60000);

	setInterval(() => checkForBirthdays(client), 300000);

	setInterval(() => refreshOsuRank(client), 60000);
}, 60000);

async function executeProcessQueue(client, bancho) {
	try {
		await executeNextProcessQueueTask(client, bancho);
	} catch (e) {
		console.error(e);
	}

	setTimeout(() => {
		executeProcessQueue(client, bancho);
	}, 650);
}

async function cleanUpDuplicates() {
	try {
		await cleanUpDuplicateEntries();
	} catch (e) {
		console.error(e);
	}

	setTimeout(() => {
		cleanUpDuplicates();
	}, 3600000);
}

async function startJiraCardSync(client) {
	try {
		await syncJiraCards(client);
	} catch (e) {
		console.error(e);
	}

	setTimeout(() => {
		startJiraCardSync(client);
	}, 900000);
}

async function getForumPosts(client) {
	try {
		await createNewForumPostRecords(client);
	} catch (e) {
		console.error(e);
	}

	setTimeout(() => {
		getForumPosts(client);
	}, 3600000);
}

async function checkOsuTracks(client) {
	try {
		await processOsuTrack(client);
	} catch (e) {
		console.error(e);
	}

	setTimeout(() => {
		checkOsuTracks(client);
	}, 10000);
}