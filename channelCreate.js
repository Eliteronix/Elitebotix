const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (channel) {
	if (channel.type === 'dm') {
		return;
	}
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (channel.guild.id != '800641468321759242' && channel.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (channel.guild.id != '800641367083974667' && channel.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (channel.guild.id === '800641468321759242' || channel.guild.id === '800641735658176553' || channel.guild.id === '800641367083974667' || channel.guild.id === '800641819086946344') {
			return;
		}
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: channel.guild.id, loggingChannelCreate: true },
	});

	if (guild && guild.loggingChannel) {
		let loggingChannel;
		try {
			loggingChannel = await channel.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await channel.client.users.fetch(channel.guild.ownerID);
				return owner.send(`It seems like the logging channel on the guild \`${channel.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`<#${channel.id}> has been created`)
			.addFields(
				{ name: 'Channel Created', value: `<#${channel.id}>` },
				{ name: 'Type', value: channel.type },
				{ name: 'Name', value: channel.name },
			)
			.setTimestamp()
			.setFooter('Eventname: channelcreate');

		if (channel.type === 'voice') {
			changeEmbed.addField('Bitrate', channel.bitrate);
			changeEmbed.addField('User Limit', channel.userLimit);
		} else if (channel.type === 'text') {
			if (channel.topic) {
				changeEmbed.addField('Topic', channel.topic);
			}
			changeEmbed.addField('NSFW', channel.nsfw);
			changeEmbed.addField('Rate Limit Per User (Slowmode)', channel.rateLimitPerUser);
		}

		channel.permissionOverwrites.forEach(permissionGroup => {
			if (permissionGroup.type === 'role') {
				changeEmbed.addField('Permissions for', `<@&${permissionGroup.id}>`);
			} else {
				changeEmbed.addField('Permissions for', `<@${permissionGroup.id}>`);
			}

			let permissionsAllowReadable = 'None';
			if (permissionGroup.allow.toArray().length > 0) {
				permissionsAllowReadable = permissionGroup.allow.toArray().join(', ');
			}
			changeEmbed.addField('Allow', permissionsAllowReadable);

			let permissionsDenyReadable = 'None';
			if (permissionGroup.deny.toArray().length > 0) {
				permissionsDenyReadable = permissionGroup.deny.toArray().join(', ');
			}
			changeEmbed.addField('Deny', permissionsDenyReadable);
		});

		loggingChannel.send({ embeds: [changeEmbed] });
	}
};