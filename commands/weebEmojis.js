module.exports = {
    name: 'weebEmojis',
    description: 'Sends a weebEmoji if someone else sends a weebEmojis',
    execute(msg, args) {
        //declare weebEmojis array
        var weebEmojis = ['owo', 'uwu', 'UwU', 'OwO', 'OuO'];

        //send the message
        msg.channel.send(weebEmojis[Math.floor(Math.random()*weebEmojis.length)]);
    },
};