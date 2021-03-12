module.exports = {
	name: 'osu-leaderboard',
	aliases: ['osu-guild-leaderboard', 'osu-ranking', 'osu-guild-ranking'],
	description: 'Sends a leaderboard of all the players in the guild that have their account connected',
	// usage: '<osu> (the only supported game at the moment)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: 'ATTACH_FILES',
	botPermissionsTranslated: 'Attach Files',
	guildOnly: true,
	// args: true,
	cooldown: 60,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		let newArgs = ['osu'];
		for(let i = 0; i < args.length; i++){
			newArgs.push(args[i]);
		}

		const command = require('./leaderboard.js');

		try {
			command.execute(msg, newArgs, true);
		} catch (error) {
			console.error(error);
			msg.reply('There was an error trying to execute that command. The developers have been alerted.');
			msg.client.users.cache.get('138273136285057025').send(`There was an error trying to execute a command.\n\nMessage by ${msg.author.username}#${msg.author.discriminator}: \`${msg.content}\`\n\n${error}`);
		}
	},
};