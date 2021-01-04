module.exports = {
	name: 'reactionrole',
	aliases: ['reactionroles'],
	description: 'Create and manage reaction roles',
	usage: '<bug/feature/request> <description>', //Change
	permissions: 'MANAGE_ROLES',
	permissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			console.log(msg);
		}
	},
};