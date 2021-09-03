const { populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'leaderboard',
	aliases: ['leaderboard', 'ranking'],
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	usage: '<server/osu> <page>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	guildOnly: true,
	args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options._hoistedOptions[1]) {
				args = [interaction.options._hoistedOptions[0].value, interaction.options._hoistedOptions[1].value];
			} else {
				args = [interaction.options._hoistedOptions[0].value];
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