const { isWrongSystem } = require('./utils');
const Discord = require('discord.js');

module.exports = async function (guild) {
	if (isWrongSystem(guild.id, false)) {
		return;
	}

	try {
		const systemChannel = await guild.channels.cache.get(guild.systemChannelId);
		if (systemChannel) {
			systemChannel.send('Thanks for adding me to the server!\nUse </help:1064502107832594484> to get a list of commands!\nTo provide feedback please use </feedback:1064502027591364649>');
		} else {
			const generalChannel = await guild.channels.cache.find(channel => channel.name === 'general');
			if (generalChannel) {
				generalChannel.send('Thanks for adding me to the server!\nUse </help:1064502107832594484> to get a list of commands!\nTo provide feedback please use </feedback:1064502027591364649>');
			} else {
				const otherChannel = guild.channels.cache.find(channel => channel.type === Discord.ChannelType.GuildText && channel.permissionsFor(guild.me).has('SEND_MESSAGES'));
				if (otherChannel) {
					otherChannel.send('Thanks for adding me to the server!\nUse </help:1064502107832594484> to get a list of commands!\nTo provide feedback please use </feedback:1064502027591364649>');
				}
			}
		}
	} catch (error) {
		console.error(error);
	}
};
