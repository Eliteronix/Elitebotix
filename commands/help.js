//require the discord.js module
const Discord = require('discord.js');

module.exports = {
	name: 'help',
	description: 'Shows all the commands',
	execute(msg, args) {
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
            { name: 'e!link', value: 'Sends a link to add the bot to a server', inline: true},
            { name: 'e!feedback <bug/feature/general>', value: 'Sends feedback to the devs', inline: true},
            { name: '\u200B', value: '\u200B' }
        )
        .setTimestamp()
        .setFooter('Feel free to give feedback, to request features or to send bug reports via e!feedback');
    msg.channel.send(helpEmbed);
	},
};