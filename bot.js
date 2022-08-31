//Log message upon starting the bot
console.log('Bot is starting...');
const { twitchConnect, wrongCluster, syncJiraCards, createNewForumPostRecords } = require('./utils');

//require the dotenv node module
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
const { executeNextProcessQueueTask, refreshOsuRank, restartProcessQueueTask, cleanUpDuplicateEntries, checkForBirthdays } = require('./utils');

//Get MOTD/getMapsOnTime
const { initializeMOTD } = require('./MOTD/initializeMOTD');

const Banchojs = require('bancho.js');
// eslint-disable-next-line no-undef
const bancho = new Banchojs.BanchoClient({ username: process.env.OSUNAME, password: process.env.OSUIRC, apiKey: process.env.OSUTOKENV1, limiterTimespan: 60000, limiterPrivate: 67, limiterPublic: 13 });

//Connect for the first worker
// eslint-disable-next-line no-undef
if (!wrongCluster() && process.env.SERVER !== 'QA') {
	bancho.connect();

	//Listen to messages
	bancho.on('PM', async (message) => {
		gotBanchoPrivateMessage(client, bancho, message);
	});
}

let twitchClient = null;
twitchConnect(bancho).then(twitch => {
	twitchClient = twitch;
	return;
});

//login with the Discord client using the Token from the .env file
// eslint-disable-next-line no-undef
client.login(process.env.BOTTOKEN);

//declare what the discord client should do when it's ready
client.on('ready', readyDiscord);

//declare the function which will be used when ready
function readyDiscord() {
	//log a message when ready
	console.log('The Bot is ready.');

	client.user.setPresence({
		status: 'online',  //You can show online, idle....
		activities: [{
			name: 'with /help',  //The message shown
			type: 'PLAYING' //PLAYING: WATCHING: LISTENING: STREAMING:
		}]
	});

	if (!wrongCluster()) {
		restartProcessQueueTask();
	}

	executeProcessQueue(client, bancho);

	startJiraCardSync(client);
}

client.on('messageCreate', msg => gotMessage(msg, bancho, twitchClient));

client.on('messageUpdate', messageUpdate);

client.on('messageDelete', messageDelete);

client.on('guildMemberAdd', guildMemberAdd);

client.on('guildMemberRemove', guildMemberRemove);

client.on('guildMemberUpdate', guildMemberUpdate);

client.on('guildBanAdd', guildBanAdd);

client.on('guildBanRemove', guildBanRemove);

client.on('userUpdate', userUpdate);

client.on('messageReactionAdd', (reaction, user) => {
	if (wrongCluster(user.id)) {
		return;
	}
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

setInterval(() => initializeMOTD(client, bancho, false, false), 60000);

setInterval(() => checkForBirthdays(client), 300000);

setInterval(() => refreshOsuRank(), 60000);

setTimeout(() => {
	cleanUpDuplicates();
	getForumPosts(client);
}, 60000);

client.on('interactionCreate', interaction => {
	if (wrongCluster(interaction.id)) {
		return;
	}
	interactionCreate(client, bancho, interaction);
});

async function executeProcessQueue(client, bancho) {
	try {
		await executeNextProcessQueueTask(client, bancho);
	} catch (e) {
		console.log(e);
	}

	setTimeout(() => {
		executeProcessQueue(client, bancho);
	}, 650);
}

async function cleanUpDuplicates() {
	try {
		await cleanUpDuplicateEntries();
	} catch (e) {
		console.log(e);
	}

	setTimeout(() => {
		cleanUpDuplicates();
	}, 3600000);
}

async function startJiraCardSync(client) {
	try {
		await syncJiraCards(client);
	} catch (e) {
		console.log(e);
	}

	setTimeout(() => {
		startJiraCardSync(client);
	}, 900000);
}

async function getForumPosts(client) {
	try {
		await createNewForumPostRecords(client);
	} catch (e) {
		console.log(e);
	}

	setTimeout(() => {
		getForumPosts(client);
	}, 3600000);
}