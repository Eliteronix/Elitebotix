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
    //console.log(msg);

    //check if the message wasn't sent by the bot itself or another bot
    if(!(msg.author.bot)) {
        //console.log('Message is not from a bot');

        //Define if it is a command with prefix
        //Split the message into an args array
        if(msg.content.startsWith(prefix)){
            var prefixCommand = true;
            var args = msg.content.slice(prefix.length).trim().split(' ');
        } else {
            var prefixCommand = false;
            var args = msg.content.trim().split(' ');
        }
        //Delete the first item from the args array and use it for the command variable
        const command = args.shift().toLowerCase();

        //check if the message has a prefix
        if (prefixCommand){

            //Check sending arguments with the command
            if (command === 'args-info') {
                if (!args.length) {
                    msg.channel.send(`You didn't provide any arguments.`);
                } else {
                    msg.channel.send(`Command name: ${command}\nArguments: ${args}`);
                }
            }
        } else {
            //Answer with a random weebEmoji if a weebEmoji was sent
            if (weebEmojis.includes(command)) {
                msg.channel.send(weebEmojis[Math.floor(Math.random()*weebEmojis.length)]);
            }
        }
    }
}