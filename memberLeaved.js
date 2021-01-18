//Import Guilds Table
const { Guilds } = require('./dbObjects');

module.exports = async function (member) {
	
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (member.guild.id != '800641468321759242' && member.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (member.guild.id != '800641367083974667' && member.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (member.guild.id === '800641468321759242' || member.guild.id === '800641735658176553' || member.guild.id === '800641367083974667' || member.guild.id === '800641819086946344') {
			return;
		}
	}
	
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
