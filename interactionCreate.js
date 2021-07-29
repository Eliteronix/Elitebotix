module.exports = async function (client, interaction) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (interaction.guild_id != '800641468321759242' && interaction.guild_id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (interaction.guild_id != '800641367083974667' && interaction.guild_id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (interaction.guild_id === '800641468321759242' || interaction.guild_id === '800641735658176553' || interaction.guild_id === '800641367083974667' || interaction.guild_id === '800641819086946344') {
			return;
		}
	}

	console.log(interaction);

	client.api.interactions(interaction.id, interaction.token).callback.post({
		data: {
			type: 4,
			data: {
				content: 'hello world!'
			}
		}
	});
};
