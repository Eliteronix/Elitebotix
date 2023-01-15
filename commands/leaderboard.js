const { populateMsgFromInteraction } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'leaderboard',
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 60,
	tags: 'general',
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			args = [];

			let type = null;
			let page = null;
			let mode = null;
			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'type') {
					type = interaction.options._hoistedOptions[i].value;
				} else if (interaction.options._hoistedOptions[i].name === 'page') {
					page = interaction.options._hoistedOptions[i].value;
				} else {
					mode = interaction.options._hoistedOptions[i].value;
				}
			}

			args.push(type);
			if (page) {
				args.push(page);
			}
			if (type === 'osu' && mode !== null) {
				args.push(mode);
			}
		}

		let command;
		if (args[0] === 'osu') {
			command = require('./osu-leaderboard.js');
		} else if (args[0] === 'guild' || args[0] === 'server' || args[0] === 'chat') {
			command = require('./guild-leaderboard.js');
		} else {
			return;
		}

		args.shift();

		command.execute(msg, args, interaction, additionalObjects);
	},
};