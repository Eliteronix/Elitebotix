//Import Tables
const { TemporaryVoice } = require('./dbObjects');

module.exports = async function (oldMember, newMember) {

	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (newMember.guild.id != '800641468321759242' && newMember.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (newMember.guild.id != '800641367083974667' && newMember.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (newMember.guild.id === '800641468321759242' || newMember.guild.id === '800641735658176553' || newMember.guild.id === '800641367083974667' || newMember.guild.id === '800641819086946344') {
			return;
		}
	}

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