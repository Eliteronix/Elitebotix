module.exports = {
	name: 'roll',
	// aliases: ['dice', 'ouo'],
	description: 'Rolls a number between 1 and 100 or 1 and the number specified',
	usage: '[Number]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	// guildOnly: true,
	//args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		let max = 100;
		if (args[0] && !isNaN(args[0])) {
			max = parseInt(args[0]);
		}

		const result = Math.floor(Math.random() * max) + 1;

		msg.channel.send(`<@${msg.author.id}> rolled ${result}!`);
	},
};