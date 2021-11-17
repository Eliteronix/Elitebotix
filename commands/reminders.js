const { Permissions } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'reminders',
	aliases: ['remind-list', 'reminders-list'],
	description: 'Sends current time of the given location',
	//usage: '<location>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	//args: false,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, interaction) {
		if (interaction) {
			await populateMsgFromInteraction(interaction);
		}
        
		const reminders = await DBProcessQueue.findAll({
			where: { task: 'remind' }
		});
        
		let setReminders = [];
		let reminderTime = [];
		let date = new Date();
		let message = '';
        
		if (reminders.length == 0) {
			if (msg){
				return msg.reply('No reminders set for you');
			}  else
				return interaction.reply({ content: 'No reminders set for you', ephemeral: true });
		} else {
			for (let i = 0; i < reminders.length; i++) {
				let args = reminders[i].additions.split(';');
				date = reminders[i].date;
                
				setReminders.push(args[1]);
				reminderTime.push(date.toLocaleTimeString('en-UK', {
					day: 'numeric', // numeric, 2-digit
					year: 'numeric', // numeric, 2-digit
					month: '2-digit', // numeric, 2-digit, long, short, narrow
					hour: 'numeric', // numeric, 2-digit
					minute: 'numeric', // numeric, 2-digit
					second: 'numeric', // numeric, 2-digit
				}));
			}
            
			for (let i = 0; i < setReminders.length; i++) {
				message+= `"${setReminders[i]}"  -  will be send on ${reminderTime[i]}\n`;
			}
            
			if (msg) {
				if (msg.channel.type !== 'DM') {
					msg.reply(' Check your DMs');
					msg.author.send(message);
				}
			} else {
				await interaction.reply({ content: message, ephemeral: true });
			}
		}
	}
};
