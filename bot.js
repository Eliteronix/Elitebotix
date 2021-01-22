//Log message upon starting the bot
console.log('Bot is starting...');

//require the dotenv node module
require('dotenv').config();

//require the discord.js module
const Discord = require('discord.js');
//create a Discord client with discord.js
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });

//Get gotMessage
const gotMessage = require('./gotMessage');

//Get memberJoined
const memberJoined = require('./memberJoined');

//Get memberLeaved
const memberLeaved = require('./memberLeaved');

//Get reactionAdded
const reactionAdded = require('./reactionAdded');

//Get reactionRemoved
const reactionRemoved = require('./reactionRemoved');
//Get voiceStateUpdate
const voiceStateUpdate = require('./voiceStateUpdate');

//login with the Discord client using the Token from the .env file
// eslint-disable-next-line no-undef
client.login(process.env.BOTTOKEN);

//declare what the discord client should do when it's ready
client.on('ready', readyDiscord);

//declare the function which will be used when ready
function readyDiscord() {
	//log a message when ready
	console.log('The Bot is ready.');

	if(process.env.SERVER === 'Live'){
		client.user.setPresence({
			status: 'online',  //You can show online, idle....
			game: {
				name: 'Using e!help',  //The message shown
				type: 'PLAYING:' //PLAYING: WATCHING: LISTENING: STREAMING:
			}
		});   
	}
}

//declare what the discord client should do when a new member joins the server
client.on('guildMemberAdd', memberJoined);

//declare what the discord client should do when a new member joins the server
client.on('guildMemberRemove', memberLeaved);

client.on('messageReactionAdd', reactionAdded);

client.on('messageReactionRemove', reactionRemoved);

//declare what the discord client should do when it receives a message
client.on('message', gotMessage);

client.on('voiceStateUpdate', voiceStateUpdate);
