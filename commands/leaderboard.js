const { populateMsgFromInteraction } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'leaderboard',
	aliases: ['leaderboard', 'ranking', 'lb'],
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	usage: '<server/osu> [page]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	guildOnly: true,
	args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
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

		try {
			command.execute(msg, args, interaction, additionalObjects);
		} catch (error) {
			console.error(error);
			const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
			msg.reply('There was an error trying to execute that command. The developers have been alerted.');
			eliteronixUser.send(`There was an error trying to execute a command.\n\nMessage by ${msg.author.username}#${msg.author.discriminator}: \`${msg.content}\`\n\n${error}`);
		}
	},
};