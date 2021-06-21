const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (oldRole, newRole) {
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (newRole.guild.id != '800641468321759242' && newRole.guild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (newRole.guild.id != '800641367083974667' && newRole.guild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (newRole.guild.id === '800641468321759242' || newRole.guild.id === '800641735658176553' || newRole.guild.id === '800641367083974667' || newRole.guild.id === '800641819086946344') {
			return;
		}
	}

	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: newRole.guild.id, loggingRoleUpdate: true },
	});

	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await newRole.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await newRole.client.users.fetch(newRole.guild.ownerID);
				return owner.send(`It seems like the logging channel on the guild \`${newRole.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		let oldPermissionsReadable = 'None';

		if (oldRole.permissions.toArray().length > 0) {
			oldPermissionsReadable = oldRole.permissions.toArray().join(', ');
		}

		let newPermissionsReadable = 'None';

		if (newRole.permissions.toArray().length > 0) {
			newPermissionsReadable = newRole.permissions.toArray().join(', ');
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setDescription(`<@&${newRole.id}> has been updated`)
			.addFields(
				{ name: 'Role Updated', value: `<@&${newRole.id}>` },
			)
			.setTimestamp()
			.setFooter('Eventname: roleupdate');

		if (oldRole.name !== newRole.name) {
			changeEmbed.addField('Name', `\`${oldRole.name}\` -> \`${newRole.name}\``);
		}

		if (oldRole.name !== newRole.name) {
			changeEmbed.addField('Colour', `\`${oldRole.hexColor}\` -> \`${newRole.hexColor}\``);
		}

		if (oldRole.hoist !== newRole.hoist) {
			changeEmbed.addField('Show seperate', `\`${oldRole.hoist}\` -> \`${newRole.hoist}\``);
		}

		if (oldRole.managed !== newRole.managed) {
			changeEmbed.addField('Managed by bot, etc.', `\`${oldRole.managed}\` -> \`${newRole.managed}\``);
		}

		if (oldRole.mentionable !== newRole.mentionable) {
			changeEmbed.addField('Can be mentioned', `\`${oldRole.mentionable}\` -> \`${newRole.mentionable}\``);
		}

		if (oldPermissionsReadable !== newPermissionsReadable) {
			changeEmbed.addField('Permissions', `\`${oldPermissionsReadable}\` -> \`${newPermissionsReadable}\``);
		}

		channel.send(changeEmbed);
	}
};
