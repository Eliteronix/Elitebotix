module.exports = {
	name: 'prune',
	aliases: ['delete', 'delete-messages'],
	description: 'Deletes the specified amount of messages; Messages have to be less than 2 weeks old',
	usage: '<amount> (has to be between 1 and 99)',
	permissions: 'MANAGE_MESSAGES',
	permissionsTranslated: 'Manage Messages',
	botPermissions: 'MANAGE_MESSAGES',
	botPermissionsTranslated: 'Manage Messages',
	guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	execute(msg, args) {
		//Set amount by argument + 1
		const amount = parseInt(args[0]) + 1;

		//Check if it is a number
		if (isNaN(amount)) {
			return msg.reply('that doesn\'t seem to be a valid number.');
			//Check if the number is between 1 and 100
		} else if (amount <= 1 || amount > 100) {
			return msg.reply('you need to input a number between 1 and 99.');
		}

		//Delete messages which are less than 2 weeks old
		msg.channel.bulkDelete(amount, true).catch(err => {
			console.error(err);
			msg.channel.send('there was an error trying to prune messages in this channel!');
		});
	},
};