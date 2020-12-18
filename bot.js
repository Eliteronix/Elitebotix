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
const { noCooldownMessage } = require('./commands/f');
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

//Create cooldowns collection
const cooldowns = new Discord.Collection();

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
        const commandName = args.shift().toLowerCase();

        //Set the command and check for possible uses of aliases
        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        //if there is no command used then break
        if (!command) return;

        //Check if the command can't be used outside of DMs
        if (command.guildOnly && msg.channel.type === 'dm') {
            return msg.reply('I can\'t execute that command inside DMs!');
        }

        //Check if arguments are provided if needed
        if (command.args && !args.length) {
            //Set standard reply
            let reply = `You didn't provide any arguments.`;

            //Set reply with usage if needed.
            if (command.usage) {
                reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
            }

            //Send message
            return msg.channel.send(reply);
        }

        //Check if the cooldown collection has the command already; if not write it in
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }

        //Set current time
        const now = Date.now();
        //gets the collections for the current command used
        const timestamps = cooldowns.get(command.name);
        //set necessary cooldown amount; if non stated in command default to 5; calculate ms afterwards
        const cooldownAmount = (command.cooldown || 5) * 1000;

        //get expiration times for the cooldowns for the authorID
        if (timestamps.has(msg.author.id)) {
            const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

            //If cooldown didn't expire yet send cooldown message
            if (command.noCooldownMessage) {
                return;
            } else if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return msg.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
            }
        }

        //Set timestamp for the used command
        timestamps.set(msg.author.id, now);
        //Automatically delete the timestamp after the cooldown
        setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

        try {
            command.execute(msg, args, prefixCommand);
        } catch (error) {
            console.error(error);
            msg.reply('there was an error trying to execute that command. The developers have been alerted.');
            client.users.cache.get("138273136285057025").send(`There was an error trying to execute a command.\n\n${error}`);
        }
    }
}
