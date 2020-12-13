//Log message upon starting the bot
console.log('Bot is starting...');

//require the dotenv node module
require('dotenv').config();

//require the discord.js module
const Discord = require('discord.js');
//import the config variables from config.json
const {prefix} = require('./config.json');
//create a Discord client with discord.js
const client = new Discord.Client();
//login with the Discord client using the Token from the .env file
client.login(process.env.BOTTOKEN);

//declare weebEmojis array
var weebEmojis = ['owo', 'uwu', 'UwU', 'OwO', 'OuO'];

//declare what the discord client should do when it's ready
client.on('ready', readyDiscord);

//declare the function which will be used when ready
function readyDiscord() {
    //log a message when ready
    console.log('The Bot is ready.');
}

//declare what the discord client should do when it's ready
client.on('message', gotMessage);

//declare function which will be used when message received
function gotMessage(msg) {
    //log the message
    console.log(msg);

    //check if the message wasn't sent by the bot itself or another bot
    if(!(msg.author.bot)) {

        //check if the message has a prefix
        if (msg.content.startsWith(prefix)){
            //empty for now
        } else {
            //Answer with a random weebEmoji if a weebEmoji was sent
            if (weebEmojis.includes(msg.content)) {
                msg.channel.send(weebEmojis[Math.floor(Math.random()*weebEmojis.length)]);
            }
        }
    }
}