module.exports = {
    name: 'owo',
    description: 'Sends a weebEmoji if someone else sends owo',
    execute(msg, args, prefixCommand) {
        if (!(prefixCommand)) {
            //declare weebEmojis array
            var weebEmojis = ['owo', 'uwu', 'UwU', 'OwO', 'OuO'];

            //send the message
            msg.channel.send(weebEmojis[Math.floor(Math.random() * weebEmojis.length)]);
        }
    },
};