module.exports = {
	name: 'reactionrole',
	aliases: ['reactionroles','rr'],
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
			//e!rr add embed <name> //Write ID in Footer
			//e!rr remove embed <name> or <ID>
			//e!rr add role <embedId> <@role> <emoji> <description>
			//e!rr remove role <embedId> <@role> <emoji> <description>
			
			//reactionRoles.forEach(entry => {
  			//	embed.addField(entry, 'looped field');
			//});
		}
	},
};
