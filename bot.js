//Log message upon starting the bot
console.log('Bot is starting...');

//require the dotenv node module
require('dotenv').config();

//require the file system module
const fs = require('fs');
//require the discord.js module
const Discord = require('discord.js');
//import the config variables from config.json
const { prefix } = require('./config.json');
//create a Discord client with discord.js
const client = new Discord.Client();
//Create a collection for the commands
client.commands = new Discord.Collection();
//get all command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
//Add the commands from the command files to the client.commands collection
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}
//login with the Discord client using the Token from the .env file
client.login(process.env.BOTTOKEN);

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
    if (!(msg.author.bot)) {
        //console.log('Message is not from a bot');

        //Define if it is a command with prefix
        //Split the message into an args array
        if (msg.content.startsWith(prefix)) {
            var prefixCommand = true;
            var args = msg.content.slice(prefix.length).trim().split(/ +/);
        } else {
            var prefixCommand = false;
            var args = msg.content.trim().split(/ +/);
        }
        //Delete the first item from the args array and use it for the command variable
        const command = args.shift().toLowerCase();

        if (!client.commands.has(command)) return;

        try {
            client.commands.get(command).execute(msg, args, prefixCommand);
        } catch (error) {
            console.error(error);
            msg.reply('there was an error trying to execute that command! Please contact Eliteronix#4208');
        }
    }
}
