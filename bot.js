//Log message upon starting the bot
console.log('Bot is starting...');
const { getOsuBeatmap } = require('./utils');

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

//Get executeNextProcessQueueTask
const { executeNextProcessQueueTask, refreshOsuRank, restartProcessQueueTask } = require('./utils');

//Get MOTD/getMapsOnTime
const { initializeMOTD } = require('./MOTD/initializeMOTD');

const Banchojs = require('bancho.js');
// eslint-disable-next-line no-undef
const bancho = new Banchojs.BanchoClient({ username: 'Eliteronix', password: process.env.OSUIRC, apiKey: process.env.OSUTOKENV1 });

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
			name: 'with e!help',  //The message shown
			type: 'PLAYING' //PLAYING: WATCHING: LISTENING: STREAMING:
		}]
	});

	restartProcessQueueTask();
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

setInterval(() => executeNextProcessQueueTask(client, bancho), 725);

setInterval(() => initializeMOTD(client, bancho, false, false), 60000);

setInterval(() => refreshOsuRank(), 60000);

client.on('interactionCreate', interaction => {
	interactionCreate(client, bancho, interaction);
});

let twitchChannel = 'Eliteronix';

//Require twitch irc module
const tmi = require('tmi.js');

// Define configuration options
const opts = {
	identity: {
		// eslint-disable-next-line no-undef
		username: process.env.TWITCH_USERNAME,
		// eslint-disable-next-line no-undef
		password: process.env.TWITCH_OAUTH_TOKEN
	},
	channels: [
		twitchChannel
	]
};

// Create a client with our options
const twitchClient = new tmi.client(opts);

// Register our event handlers (defined below)
twitchClient.on('message', onMessageHandler);
twitchClient.on('connected', onConnectedHandler);

// Connect to Twitch:
twitchClient.connect();

// Called every time a message comes in
async function onMessageHandler(target, context, msg, self) {
	if (self) { return; } // Ignore messages from the bot

	const longRegex = /https?:\/\/osu\.ppy\.sh\/beatmapsets\/.+\/\d+/gm;
	const shortRegex = /https?:\/\/osu\.ppy\.sh\/b\/\d+/gm;
	const longMatches = longRegex.exec(msg);
	const shortMatches = shortRegex.exec(msg);

	let map = null;
	if (longMatches) {
		map = longMatches[0];
	} else if (shortMatches) {
		map = shortMatches[0];
	}

	if (map) {
		map = map.replace(/.+\//gm, '');
		try {
			await bancho.connect();
		} catch (error) {
			if (!error.message === 'Already connected/connecting') {
				throw (error);
			}
		}

		try {
			const IRCUser = await bancho.getUser(twitchChannel);

			let prefix = [];
			if (context.mod) {
				prefix.push('MOD');
			}
			if (context.badges && context.badges.vip) {
				prefix.push('VIP');
			}
			if (context.subscriber) {
				prefix.push('SUB');
			}

			if (prefix.length > 0) {
				prefix = `[${prefix.join('/')}] `;
			} else {
				prefix = '';
			}

			let dbBeatmap = await getOsuBeatmap(map, 0);

			await IRCUser.sendMessage(`${prefix}${context['display-name']} -> https://osu.ppy.sh/b/${dbBeatmap.beatmapId} ${dbBeatmap.artist} - ${dbBeatmap.title} [${dbBeatmap.difficulty}] | ${Math.round(dbBeatmap.starRating * 100) / 100}* | ${dbBeatmap.bpm} BPM`);
		} catch (error) {
			if (error.message !== 'Currently disconnected!') {
				console.log(error);
			}
		}

		twitchClient.say(twitchChannel, `${context['display-name']} -> Your request has been sent.`);
	}
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}