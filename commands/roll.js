const { populateMsgFromInteraction } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'roll',
	// aliases: ['dice', 'ouo'],
	description: 'Rolls a number between 1 and 100 or 1 and the number specified',
	usage: '[Number]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	// guildOnly: true,
	//args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options._hoistedOptions[0]) {
				args = [interaction.options._hoistedOptions[0].value];
			}
		}

		let max = 100;
		if (args[0] && !isNaN(args[0]) && args[0] > 1) {
			max = parseInt(args[0]);
		}

		const result = Math.floor(Math.random() * max) + 1;

		if (msg.id) {
			return msg.reply(`<@${msg.author.id}> rolled ${result}!`);
		}
		return interaction.reply(`<@${msg.author.id}> rolled ${result}!`);
	},
};