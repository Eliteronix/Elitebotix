const { Guilds } = require('../dbObjects');

module.exports = {
	name: 'prefix',
	aliases: ['custom-prefix'],
	description: 'Sets the bot prefix to the new specified prefix',
	usage: '<new prefix like \'!\' or \'.\'>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			//Get guild from db
			const guild = await Guilds.findOne({
				where: { guildId: msg.guild.id },
			});

			if(guild){
				//Set new prefix for the guild
				guild.customPrefixUsed = true;
				guild.customPrefix = args[0];
				guild.save();

				msg.channel.send(`New prefix has been set:\`\`\`${args[0]}\`\`\``);
			} else {
				//Create new record for the guild in the db
				Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, customPrefixUsed: true, customPrefix: args[0] });

				msg.channel.send(`New prefix has been set:\`\`\`${args[0]}\`\`\``);
			}
		}
	},
};