const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (role) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (role.guild.id != '800641468321759242' && role.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (role.guild.id != '800641367083974667' && role.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (role.guild.id === '800641468321759242' || role.guild.id === '800641735658176553' || role.guild.id === '800641367083974667' || role.guild.id === '800641819086946344') {
			return;
		}
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: role.guild.id, loggingRoleDelete: true },
	});

	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await role.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await role.client.users.fetch(role.guild.ownerID);
				return owner.send(`It seems like the logging channel on the guild \`${role.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		let permissionsReadable = 'None';

		if (role.permissions.toArray().length > 0) {
			permissionsReadable = role.permissions.toArray().join(', ');
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`\`${role.name}\` has been deleted`)
			.addFields(
				{ name: 'Role Deleted', value: `\`${role.name}\`` },
				{ name: 'Colour', value: role.hexColor },
				{ name: 'Show seperate', value: role.hoist },
				{ name: 'Managed by bot, etc.', value: role.managed },
				{ name: 'Can be mentioned', value: role.mentionable },
				{ name: 'Position', value: role.position },
				{ name: 'Permissions', value: permissionsReadable },
			)
			.setTimestamp()
			.setFooter('Eventname: roledelete');

		channel.send(changeEmbed);
	}
};
