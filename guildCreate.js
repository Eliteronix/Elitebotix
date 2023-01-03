const { isWrongSystem } = require('./utils');

module.exports = async function (guild) {
	if (isWrongSystem(guild.id, false)) {
		return;
	}

	try {
		const systemChannel = await guild.channels.cache.get(guild.systemChannelId);
		if (systemChannel) {
			systemChannel.send('Thanks for adding me to the server!\nUse `/help` to get a list of commands!\nTo provide feedback please use `/feedback`');
		} else {
			const generalChannel = await guild.channels.cache.find(channel => channel.name === 'general');
			if (generalChannel) {
				generalChannel.send('Thanks for adding me to the server!\nUse `/help` to get a list of commands!\nTo provide feedback please use `/feedback`');
			} else {
				const otherChannel = guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES'));
				if (otherChannel) {
					otherChannel.send('Thanks for adding me to the server!\nUse `/help` to get a list of commands!\nTo provide feedback please use `/feedback`');
				}
			}
		}
	} catch (error) {
		console.error(error);
	}
};
