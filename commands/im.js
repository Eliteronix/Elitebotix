module.exports = {
    name: 'im',
    description: 'Answers with the dadmode',
    execute(msg, args, prefixCommand) {
        if (!(prefixCommand)) {
            if (args[0]) {
                const userMessage = args.join(' ');
                msg.channel.send(`Hi ${userMessage}, I\'m dad!`);
            }
        }
    },
};