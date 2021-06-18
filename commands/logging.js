const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'logging',
	aliases: ['server-logging'],
	description: '[Toggle] Logs the enabled events in the specified channel.',
	usage: '<channel> <mentioned channel> | <eventnames to toggle>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args) {
		let guild = await DBGuilds.findOne({
			where: { guildId: msg.guild.id }
		});
		if (args[0].toLowerCase() === 'channel') {
			if (!msg.mentions.channels.first()) {
				return msg.channel.send('Please mention a channel where the highlighted messages should be sent into.');
			}
			if (guild) {
				guild.loggingChannel = msg.mentions.channels.first().id;
				guild.save();
				return msg.channel.send(`The enabled events are now being logged into the channel <#${msg.mentions.channels.first().id}>.`);
			} else {
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, loggingChannel: msg.mentions.channels.first().id });
				return msg.channel.send(`The enabled events are now being logged into the channel <#${msg.mentions.channels.first().id}>.`);
			}
		} else {
			if (!guild || !guild.loggingChannel) {
				const guildPrefix = await getGuildPrefix(msg);
				msg.channel.send(`Be sure to use \`${guildPrefix}${this.name} channel <mentioned channel>\` to set a channel where this information should be logged into.`);
			}
			if (!guild) {
				guild = await DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name });
			}
			args.forEach(arg => {
				if (arg.toLowerCase() === 'nicknames') {
					if (guild.loggingNicknames) {
						guild.loggingNicknames = false;
						guild.save();
						msg.channel.send('Nickname changes will no longer get logged in the specified channel.');
					} else {
						guild.loggingNicknames = true;
						guild.save();
						msg.channel.send('Nickname changes will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'usernames') {
					if (guild.loggingUsernames) {
						guild.loggingUsernames = false;
						guild.save();
						msg.channel.send('Username changes will no longer get logged in the specified channel.');
					} else {
						guild.loggingUsernames = true;
						guild.save();
						msg.channel.send('Username changes will now get logged in the specified channel.');
					}
				} else if (arg.toLowerCase() === 'userdiscriminators') {
					if (guild.loggingDiscriminators) {
						guild.loggingDiscriminators = false;
						guild.save();
						msg.channel.send('Discriminator changes will no longer get logged in the specified channel.');
					} else {
						guild.loggingDiscriminators = true;
						guild.save();
						msg.channel.send('Discriminator changes will now get logged in the specified channel.');
					}
				} else {
					msg.channel.send(`\`${arg.replace(/`/g, '')}\` is not a valid event to log.`);
				}
			});
		}
	},
};