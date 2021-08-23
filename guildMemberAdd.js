const Discord = require('discord.js');
const { DBGuilds, DBAutoRoles } = require('./dbObjects');

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
	const guild = await DBGuilds.findOne({
		where: { guildId: member.guild.id },
	});

	//check if a guild was found in the db
	if (guild) {
		//check if a welcome-message should be sent
		if (guild.sendWelcomeMessage) {
			//get the channel id for the welcome message
			const guildWelcomeMessageChannelId = guild.welcomeMessageChannel;
			//get the channel object from the id
			const guildWelcomeMessageChannel = await member.client.channels.cache.find(channel => channel.id === guildWelcomeMessageChannelId);
			//get the welcome message text
			const guildWelcomeMessageText = guild.welcomeMessageText.replace('@member', '<@' + member.user.id + '>');
			try {
				//send the welcome message text into the channel
				guildWelcomeMessageChannel.send(guildWelcomeMessageText);
			} catch (e) {
				if (e.message === 'Missing Access') {
					const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
					return owner.send(`I could not send a welcome message for a new user into the channel \`${guildWelcomeMessageChannel.name}\` on \`${member.guild.name}\` due to missing permissions.`);
				} else {
					return console.log(e);
				}
			}
		}

		if (guild.loggingChannel && guild.loggingMemberAdd) {
			let channel;
			try {
				channel = await member.client.channels.fetch(guild.loggingChannel);
			} catch (error) {
				if (error.message === 'Unknown Channel') {
					guild.loggingChannel = null;
					guild.save();
					const owner = await member.message.client.users.fetch(member.guild.ownerID);
					return owner.send(`It seems like the logging channel on the guild \`${member.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
				}
				console.log(error);
			}

			const changeEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setAuthor(`${member.user.username}#${member.user.discriminator}`, member.user.displayAvatarURL())
				.setDescription(`<@${member.user.id}> joined the server!`)
				.setThumbnail(member.user.displayAvatarURL())
				.addFields(
					{ name: 'Joined the server', value: `<@${member.user.id}>` },
				)
				.setTimestamp()
				.setFooter('Eventname: userjoining');

			channel.send({ embeds: [changeEmbed] });
		}
	}

	//get all autoroles for the guild
	const autoRolesList = await DBAutoRoles.findAll({ where: { guildId: member.guild.id } });
	//iterate for every autorole gathered
	for (let i = 0; i < autoRolesList.length; i++) {
		//get the role object from the array
		let autoRole = member.guild.roles.cache.get(autoRolesList[i].roleId);

		//Check if deleted role
		if (autoRole) {
			try {
				//add the role to the member
				await member.roles.add(autoRole);
			} catch (e) {
				if (e.message === 'Missing Access' || e.message === 'Missing Permissions') {
					const owner = await member.client.users.cache.find(user => user.id === member.guild.ownerID);
					return owner.send(`I could not assign an autorole to a new user because I'm missing the \`Manage Roles\` permission on \`${member.guild.name}\`.`);
				} else {
					return console.log(e);
				}
			}
		} else {
			DBAutoRoles.destroy({ where: { guildId: member.guild.id, roleId: autoRolesList[i].roleId } });
			autoRolesList.shift();
		}
	}
};
