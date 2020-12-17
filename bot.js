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
            var args = msg.content.slice(prefix.length).trim().split(/ +/);
        } else {
            var prefixCommand = false;
            var args = msg.content.trim().split(/ +/);
        }
        //Delete the first item from the args array and use it for the command variable
        const command = args.shift().toLowerCase();

        //check if the message has a prefix
        if (prefixCommand){

            //Check sending arguments with the command
            if (command === 'args-info') {
                //Check if there are arguments for the command
                if (!args.length) {
                    msg.channel.send(`You didn't provide any arguments.`);
                } else {
                    msg.channel.send(`Command name: ${command}\nArguments: ${args}`);
                }
            } else if (command === 'feedback') { //Check for feedback command
                //check for the first argument
                if (!args[0]) { //Send message if empty
                    msg.channel.send(`Please specify what kind of feedback you want to give: e!feedback <Bug/Feature/General>`);
                } else if (args[0].toLowerCase() === 'bug'){ //go to bug tree
                    if (!args[1]) { //check for second argument
                        msg.channel.send(`Please add an explaination to your bug after the command.`);
                    } else { //send message in the correct channel
                        //declare bug channel
                        const bugChannel = client.channels.cache.find(channel => channel.id === '787961689362530364');
                        //check if channel was found
                        if (bugChannel) {
                            //get rid of the first argument
                            args.shift();
                            //join the bug in a variable
                            const bug = args.join(' ');
                            //send the bug into the correct Channel
                            bugChannel.send(`[BUG] ${bug} - ${msg.author.username}#${msg.author.discriminator}`);
                            //send a message to the user
                            msg.channel.send(`Your bug report was sent to the developers.`);
                        } else {
                            //if no channel found
                            msg.channel.send(`Your bug report couldn't reach the developers. Please contact Eliteronix#4208.`);
                        }
                    }
                } else if (args[0].toLowerCase() === 'feature'){ //go to feature tree
                    if (!args[1]){ //check for second argument
                        msg.channel.send(`Please add an explaination to your feature-request after the command.`);
                    } else { //send message in the correct channel
                        //declare feature channel
                        const featureChannel = client.channels.cache.find(channel => channel.id === '787961754658537493');
                        //check if channel was found
                        if (featureChannel) {
                            //get rid of the first argument
                            args.shift();
                            //join the feature in a variable
                            const feature = args.join(' ');
                            //send the feature into the correct Channel
                            featureChannel.send(`[FEATURE] ${feature} - ${msg.author.username}#${msg.author.discriminator}`);
                            //send a message to the user
                            msg.channel.send(`Your feature-request was sent to the developers.`);
                        } else {
                            //if no channel found
                            msg.channel.send(`Your feature-request couldn't reach the developers. Please contact Eliteronix#4208.`);
                        }
                    }
                } else if (args[0].toLowerCase() === 'general'){ //go to general tree
                    if (!args[1]){ //check for second argument
                        msg.channel.send(`Please add some text to your feedback after the command.`);
                    } else { //send message in the correct channel
                        //declare feedback channel
                        const feedbackChannel = client.channels.cache.find(channel => channel.id === '787963756495896576');
                        //check if channel was found
                        if (feedbackChannel) {
                            //get rid of the first argument
                            args.shift();
                            //join the feedback in a variable
                            const feedback = args.join(' ');
                            //send the feedback into the correct Channel
                            feedbackChannel.send(`[FEEDBACK] ${feedback} - ${msg.author.username}#${msg.author.discriminator}`);
                            //send a message to the user
                            msg.channel.send(`Your feedback was sent to the developers.`);
                        } else {
                            //if no channel found
                            msg.channel.send(`Your feedback couldn't reach the developers. Please contact Eliteronix#4208.`);
                        }
                    }
                }
            } else if (command === 'help') {
                //define embed
                const helpEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('All available commands')
                    .setAuthor('e!help')
                    .addFields(
                        { name: '\u200B', value: '\u200B' },
                        { name: 'Miscellanious', value: 'For all the other stuff'},
                        { name: 'e!help', value: 'Shows all the commands', inline: true},
                        { name: 'e!args-info', value: 'Shows your arguments', inline: true},
                        { name: 'owo', value: 'UwU', inline: true},
                        { name: 'F', value: 'o7', inline: true},
                        { name: '\u200B', value: '\u200B' },
                        { name: 'Development', value: 'Feedback, Creator,...'},
                        { name: 'e!link', value: 'Sends a link to let the bot join a server', inline: true},
                        { name: 'e!feedback <bug/feature/general>', value: 'Sends feedback to the devs', inline: true},
                        { name: '\u200B', value: '\u200B' }
                    )
                    .setTimestamp()
                    .setFooter('Feel free to give feedback, to request features or to send bug reports via e!feedback');
                msg.channel.send(helpEmbed);
            } else if (command === 'link'){
                msg.channel.send(`https://discord.com/oauth2/authorize?client_id=784836063058329680&scope=bot`);
            }
        } else {
            //Answer with a random weebEmoji if a weebEmoji was sent
            if (weebEmojis.includes(command)) {
                msg.channel.send(weebEmojis[Math.floor(Math.random()*weebEmojis.length)]);
            }

            //Answer with o7 if the message was f
            else if (msg.content.toLowerCase() === 'f') {
                msg.channel.send('o7');
            }

            //Dadmode activated
            else if (command === `i\'m` || command === `im`){
                const userMessage = args.join(' ');
                msg.channel.send(`Hi ${userMessage}, I\'m dad!`);
            }
        }
    }
}
