const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'prefix',
	aliases: ['custom-prefix', 'setprefix'],
	description: 'Sets the bot prefix to the new specified prefix',
	usage: '<new prefix like \'!\' or \'.\'>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args) {
		//Get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId },
		});

		if (guild) {
			//Set new prefix for the guild
			guild.customPrefixUsed = true;
			guild.customPrefix = args[0];
			guild.save();

			msg.reply(`New prefix has been set:\`\`\`${args[0]}\`\`\``);
		} else {
			//Create new record for the guild in the db
			DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, customPrefixUsed: true, customPrefix: args[0] });

			msg.reply(`New prefix has been set:\`\`\`${args[0]}\`\`\``);
		}
	},
};