const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'toggleowo',
	//aliases: ['developer'],
	description: 'Toggles the owo setting for the server (sends an owo after another owo/uwu)',
	//usage: '<bug/feature/request> <description>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guild.id },
		});

		//Check if guild exists in db
		if (guild) {
			//reverse owo and save dataset
			if(guild.owoEnabled === true){
				guild.owoEnabled = false;
			} else {
				guild.owoEnabled = true;
			}
			guild.save();

			//output change
			if (guild.owoEnabled) {
				msg.channel.send('owo has been enabled');
			} else {
				msg.channel.send('owo has been disabled');
			}
		} else {
			//Create guild in db if it wasn't there yet and disable it by default
			DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, owoEnabled: true });
			msg.channel.send('owo has been activated');
		}
	},
};