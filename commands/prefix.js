const { DBGuilds } = require('../dbObjects');
const { Permissions } = require('discord.js');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'prefix',
	aliases: ['custom-prefix', 'setprefix'],
	description: 'Sets the bot prefix to the new specified prefix',
	usage: '<new prefix like \'!\' or \'.\'>',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			args = [interaction.options._hoistedOptions[0].value];

		}
		logDatabaseQueries(4, 'commands/prefix.js DBGuilds');
		//Get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId },
		});

		if (guild) {
			//Set new prefix for the guild
			guild.customPrefixUsed = true;
			guild.customPrefix = args[0];
			guild.save();

			if (msg.id) {
				return msg.reply(`New prefix has been set:\`\`\`${args[0]}\`\`\``);
			}
			return interaction.reply(`New prefix has been set:\`\`\`${args[0]}\`\`\``);
		} else {
			//Create new record for the guild in the db
			DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, customPrefixUsed: true, customPrefix: args[0] });

			if (msg.id) {
				return msg.reply(`New prefix has been set:\`\`\`${args[0]}\`\`\``);
			}
			return interaction.reply(`New prefix has been set:\`\`\`${args[0]}\`\`\``);
		}
	},
};