module.exports = {
    name: 'server-info',
    description: 'Sends an info card about the server',
    guildOnly: true,
    cooldown: 5,
    execute(msg, args, prefixCommand) {
        if (prefixCommand) {
            msg.channel.send(`Placeholder message; Blubb`);
        }
    },
};