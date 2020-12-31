const { Guilds } = require('../dbObjects');

module.exports = {
	name: 'welcome-message',
	description: 'Sends the specified message into the channel the user used the command in as soon as a new member arrives.',
	usage: '<current/disable/message to send> (use "@member" to mention the new member)',
	cooldown: 5,
	args: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			if (msg.member.hasPermission('MANAGE_GUILD')) {
				if (args[0] === 'current') {
					const guild = await Guilds.findOne({
						where: { guildId: msg.guild.id },
					});
					if (guild) {
						if (guild.sendWelcomeMessage) {
							const guildWelcomeMessageChannelId = guild.welcomeMessageChannel;
							msg.channel.send(guildWelcomeMessageChannelId);
							const guildWelcomeMessageChannel = msg.guild.channels.cache.find(channel => channel.id === guildWelcomeMessageChannelId);
							msg.channel.send(guildWelcomeMessageChannel);
							const guildWelcomeMessageChannelName = msg.guild.channels.cache.find(channel => channel.name === guildWelcomeMessageChannel);
							msg.channel.send(guildWelcomeMessageChannelName);
							msg.channel.send(`The current Welcome Message is set to channel ${guildWelcomeMessageChannelName}: \`${guild.welcomeMessageText}\``);
						} else {
							msg.channel.send('There is currently no welcome message set.');
						}
					} else {
						Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendWelcomeMessage: false });
						msg.channel.send('There is currently no welcome message set.');
					}
				} else if(args[0] === 'disable'){
					const guild = await Guilds.findOne({
						where: { guildId: msg.guild.id },
					});
					if (guild){
						if(guild.sendWelcomeMessage){
							guild.sendWelcomeMessage = false;
							guild.save();
							msg.channel.send('Welcome messages have been disabled for this server.');
						} else {
							msg.channel.send('Welcome messages are already disabled for this server.');
						}
					} else {
						Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendWelcomeMessage: false });
						msg.channel.send('Welcome messages are already disabled for this server.');
					}
				} else {
					let welcomeMessage = args.join(' ');
					const guild = await Guilds.findOne({
						where: { guildId: msg.guild.id },
					});
					if(guild){
						guild.sendWelcomeMessage = true;
						guild.welcomeMessageChannel = msg.channel.id;
						guild.welcomeMessageText = welcomeMessage;
						guild.save();
					} else {
						Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendWelcomeMessage: true, welcomeMessageChannel: msg.channel.id, welcomeMessageText: welcomeMessage });
					}
					msg.channel.send(`The new message \`${welcomeMessage}\` has been set for welcoming new members in the channel \`${msg.channel.name}\`.`);
				}
			} else {
				msg.channel.send('You need the "Manage Server" permission.');
			}
		}
	},
};