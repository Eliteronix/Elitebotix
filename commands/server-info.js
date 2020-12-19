//Require discord.js module
const Discord = require('discord.js');

module.exports = {
    name: 'server-info',
    description: 'Sends an info card about the server',
    guildOnly: true,
    cooldown: 5,
    execute(msg, args, prefixCommand) {
        if (prefixCommand) {
            // inside a command, event listener, etc.
            const guildInfoEmbed = new Discord.MessageEmbed()
                .setColor('#ffcc00')
                .setTitle(`${msg.guild.name}`)
                .setThumbnail(`${msg.guild.iconURL()}`)
                .addFields(
                    { name: 'Server Owner', value: `${msg.client.users.cache.find(user => user.id === `${msg.guild.ownerID}`)}`},
                    { name: 'Region', value: `${msg.guild.region}` },
                    { name: 'Member count', value: `${msg.guild.memberCount}` },
                    { name: 'AFK Timeout', value: `${msg.guild.afkTimeout/60} minutes`}
                )
                .setTimestamp();

            msg.channel.send(guildInfoEmbed);
        }
    },
};