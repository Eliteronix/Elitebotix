module.exports = {
	name: 'prune',
	aliases: ['delete', 'delete-messages'],
	description: 'Deletes the specified amount of messages; Messages have to be less than 2 weeks old',
	usage: '<amount> (has to be between 1 and 99)',
	guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			const amount = parseInt(args[0]) + 1;

			if (isNaN(amount)) {
				return msg.reply('that doesn\'t seem to be a valid number.');
			} else if (amount <= 1 || amount > 100) {
				return msg.reply('you need to input a number between 1 and 99.');
			}

			msg.channel.bulkDelete(amount, true).catch(err => {
				console.error(err);
				msg.channel.send('there was an error trying to prune messages in this channel!');
			});
		}
	},
};