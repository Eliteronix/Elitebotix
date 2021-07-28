const { DBProcessQueue } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'remindme',
	aliases: ['reminder', 'remind'],
	description: 'Sends a reminder at the specified time',
	usage: '<#y/#mo/#w/#d/#h/#m> <message>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		let years = 0;
		let months = 0;
		let weeks = 0;
		let days = 0;
		let hours = 0;
		let minutes = 0;

		for (let i = 0; i < args.length; i++) {
			let splice = true;
			if (args[i].endsWith('y') && !isNaN(args[i].replace('y', ''))) {
				years += parseInt(args[i].replace('y', ''));
			} else if (args[i].endsWith('mo') && !isNaN(args[i].replace('mo', ''))) {
				months += parseInt(args[i].replace('mo', ''));
			} else if (args[i].endsWith('w') && !isNaN(args[i].replace('w', ''))) {
				weeks += parseInt(args[i].replace('w', ''));
			} else if (args[i].endsWith('d') && !isNaN(args[i].replace('d', ''))) {
				days += parseInt(args[i].replace('d', ''));
			} else if (args[i].endsWith('h') && !isNaN(args[i].replace('h', ''))) {
				hours += parseInt(args[i].replace('h', ''));
			} else if (args[i].endsWith('m') && !isNaN(args[i].replace('m', ''))) {
				minutes += parseInt(args[i].replace('m', ''));
			} else {
				splice = false;
			}

			if (splice) {
				args.splice(i, 1);
				i--;
			}
		}

		if (args.length === 0) {
			const guildPrefix = await getGuildPrefix(msg);
			return msg.channel.send(`You didn't provide a message.\n\`Usage: ${guildPrefix}${this.name} ${this.usage}\``);
		}

		let now = new Date();
		let date = new Date();
		date.setUTCFullYear(date.getUTCFullYear() + years);
		date.setUTCMonth(date.getUTCMonth() + months);
		date.setUTCDate(date.getUTCDate() + weeks * 7 + days);
		date.setUTCHours(date.getUTCHours() + hours);
		date.setUTCMinutes(date.getUTCMinutes() + minutes);

		if (now.getTime() === date.getTime()) {
			const guildPrefix = await getGuildPrefix(msg);
			return msg.channel.send(`You didn't specify when I should remind you.\n\`Usage: ${guildPrefix}${this.name} ${this.usage}\``);
		}

		DBProcessQueue.create({ guildId: 'None', task: 'remind', priority: 10, additions: `${msg.author.id};${args.join(' ')}`, date: date });

		msg.channel.send('Reminder has been set. Be sure to have DMs enabled for the bot.');
	},
};