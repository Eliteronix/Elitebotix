//Import Tables
const { TemporaryVoice } = require('./dbObjects');

module.exports = async function (oldMember, newMember) {

	const newUserChannelId = newMember.channelID;
	const oldUserChannelId = oldMember.channelID;

	const newUserChannel = oldMember.client.channels.cache.get(newUserChannelId);
	const oldUserChannel = oldMember.client.channels.cache.get(oldUserChannelId);

	if(newUserChannel && newUserChannel.name.startsWith('➕')){
		//Clone the channel and get the new channel
		let createdChannel = await newUserChannel.clone();

		TemporaryVoice.create({ guildId: createdChannel.guild.id, channelId: createdChannel.id });
		
		//Get Member ID
		const newMemberId = newMember.id;
		//Get member
		const member = await newMember.guild.members.fetch(newMemberId);

		//Get the name of the user
		let memberName = member.user.username;
		if(member.nickname){
			memberName = member.nickname;
		}

		let channelName = '🕓 ' + memberName;
		if(memberName.toLowerCase().endsWith('x') || memberName.toLowerCase().endsWith('s')){
			channelName = channelName + '\' voice';
		} else {
			channelName = channelName + '\'s voice';
		}
		//Rename the channel
		createdChannel.edit({ name: `${channelName}` });
		//Set all permissions for the creator

		//Move user
		member.voice.setChannel(createdChannel);
	}
	
	if (oldUserChannel){
		const TemporaryVoice = await TemporaryVoice.findAll();

		console.log(TemporaryVoice);

		if(TemporaryVoice){
			// console.log('Starts with emoji');
		}
		// console.log(oldUserChannel.guild.voiceStates);
		const voiceStates = oldUserChannel.guild.voiceStates.cache;

		voiceStates.forEach(voiceState => {
			// console.log(voiceState.channelID);
			// if(voiceState.channelID === ){

			// }
		});
	}
};