console.log('Boop Test');

require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
client.login(process.env.BOTTOKEN);

client.on('ready', readyDiscord);

function readyDiscord() {
    console.log('Bot is ready');
}

client.on('message', gotMessage);

function gotMessage(msg) {
    console.log(msg.content);
    if(msg.author.username != 'Elitebotix') {
        if (msg.content === 'Beep') {
            msg.channel.send('Boop');
        }
        if (msg.content === 'owo') {
            msg.channel.send('owo');
        }
    }
}