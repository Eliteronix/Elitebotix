module.exports = {
    name: 'log',
    description: 'Logs the message in the console',
    cooldown: 5,
    noCooldownMessage: true,
    execute(msg, args, prefixCommand) {
        if (prefixCommand) {
            console.log(msg);
        }
    },
};