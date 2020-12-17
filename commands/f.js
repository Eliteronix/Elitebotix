module.exports = {
    name: 'f',
    description: 'Answers with o7',
    execute(msg, args, prefixCommand) {
        if (!(prefixCommand)) {
            msg.channel.send('o7');
        }
    },
};