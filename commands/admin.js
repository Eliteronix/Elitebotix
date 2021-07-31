module.exports = {
	name: 'admin',
	//aliases: ['developer'],
	description: 'Sends a message with the bots server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (args[0] === 'guildCommands') {
			msg.client.api.applications(msg.client.user.id).guilds(args[1]).commands.post({
				data: {
					name: 'creator',
					description: 'Sends an info card about the developer'
				}
			});

			// const yes = await msg.client.api.applications(msg.client.user.id).guilds('800641468321759242').commands.get();
			// console.log(yes);
			// msg.client.api.applications(msg.client.user.id).guilds('800641468321759242').commands('870256682314383370').delete();
		}

		msg.channel.send('Done.');
	},
};