//Import Guilds Table
const { Guilds } = require('./dbObjects');

module.exports = async function (member) {
	//Get the guild dataset from the db
	const guild = await Guilds.findOne({
		where: { guildId: member.guild.id },
	});

	//check if a guild was found in the db
	if (guild) {
		//check if a goodbye-message should be sent
		if (guild.sendGoodbyeMessage) {
			//get the channel id for the goodbye message
			const guildGoodbyeMessageChannelId = guild.goodbyeMessageChannel;
			//get the channel object from the id
			const guildGoodbyeMessageChannel = member.client.channels.cache.find(channel => channel.id === guildGoodbyeMessageChannelId);
			//get the goodbye message text
			const guildGoodbyeMessageText = guild.goodbyeMessageText.replace('@member', member.user.username + '#' + member.user.discriminator);
			//send the goodbye message text into the channel
			guildGoodbyeMessageChannel.send(guildGoodbyeMessageText);
		}
	}
};