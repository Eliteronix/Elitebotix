const { Guilds } = require('../dbObjects');

module.exports = {
	name: 'goodbye-message',
	aliases: ['farewell-message'],
	description: 'Sends the specified message into the channel the user used the command in as soon as a member leaves.',
	usage: '<current/disable/message to send> (use "@member" to mention the member)',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			if (msg.member.hasPermission('MANAGE_GUILD')) {
				if (args[0] === 'current') {
					const guild = await Guilds.findOne({
						where: { guildId: msg.guild.id },
					});
					if (guild) {
						if (guild.sendGoodbyeMessage) {
							const guildGoodbyeMessageChannelId = guild.goodbyeMessageChannel;
							const guildGoodbyeMessageChannel = msg.guild.channels.cache.find(channel => channel.id === guildGoodbyeMessageChannelId);
							msg.channel.send(`The current goodbye message is set to channel \`${guildGoodbyeMessageChannel.name}\`: \`${guild.goodbyeMessageText}\``);
						} else {
							msg.channel.send('There is currently no goodbye message set.');
						}
					} else {
						Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendGoodbyeMessage: false });
						msg.channel.send('There is currently no goodbye message set.');
					}
				} else if(args[0] === 'disable'){
					const guild = await Guilds.findOne({
						where: { guildId: msg.guild.id },
					});
					if (guild){
						if(guild.sendGoodbyeMessage){
							guild.sendGoodbyeMessage = false;
							guild.save();
							msg.channel.send('Goodbye messages have been disabled for this server.');
						} else {
							msg.channel.send('Goodbye messages are already disabled for this server.');
						}
					} else {
						Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendGoodbyeMessage: false });
						msg.channel.send('Goodbye messages are already disabled for this server.');
					}
				} else {
					let goodbyeMessage = args.join(' ');
					const guild = await Guilds.findOne({
						where: { guildId: msg.guild.id },
					});
					if(guild){
						guild.sendGoodbyeMessage = true;
						guild.goodbyeMessageChannel = msg.channel.id;
						guild.goodbyeMessageText = goodbyeMessage;
						guild.save();
					} else {
						Guilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendGoodbyeMessage: true, goodbyeMessageChannel: msg.channel.id, goodbyeMessageText: goodbyeMessage });
					}
					msg.channel.send(`The new message \`${goodbyeMessage}\` has been set for leaving members in the channel \`${msg.channel.name}\`.`);
				}
			} else {
				msg.channel.send('You need the "Manage Server" permission.');
			}
		}
	},
};