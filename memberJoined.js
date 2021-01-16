//Import Tables
const { Guilds, AutoRoles } = require('./dbObjects');

module.exports = async function (member) {
	//Get the guild dataset from the db
	const guild = await Guilds.findOne({
		where: { guildId: member.guild.id },
	});

	//check if a guild was found in the db
	if (guild) {
		//check if a welcome-message should be sent
		if (guild.sendWelcomeMessage) {
			//get the channel id for the welcome message
			const guildWelcomeMessageChannelId = guild.welcomeMessageChannel;
			//get the channel object from the id
			const guildWelcomeMessageChannel = member.client.channels.cache.find(channel => channel.id === guildWelcomeMessageChannelId);
			//get the welcome message text
			const guildWelcomeMessageText = guild.welcomeMessageText.replace('@member', '<@' + member.user.id + '>');
			//send the welcome message text into the channel
			guildWelcomeMessageChannel.send(guildWelcomeMessageText);
		}
	}

	//get all autoroles for the guild
	const autoRolesList = await AutoRoles.findAll({ where: { guildId: member.guild.id } });
	//iterate for every autorole gathered
	for (let i = 0; i < autoRolesList.length; i++) {
		//get the role object from the array
		let autoRole = member.guild.roles.cache.get(autoRolesList[i].roleId);
		//add the role to the member
		member.roles.add(autoRole);
	}
};