const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (oldRole, newRole) {
	if (isWrongSystem(newRole.guild.id, false)) {
		return;
	}

	logDatabaseQueries(2, 'roleUpdate.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: newRole.guild.id,
			loggingRoleUpdate: true
		},
	});

	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await newRole.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await newRole.client.users.fetch(newRole.guild.ownerId);
				return await owner.send(`It seems like the logging channel on the guild \`${newRole.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error(error);
		}

		let oldPermissionsReadable = 'None';

		if (oldRole.permissions.toArray().length > 0) {
			oldPermissionsReadable = oldRole.permissions.toArray().join(', ');
		}

		let newPermissionsReadable = 'None';

		if (newRole.permissions.toArray().length > 0) {
			newPermissionsReadable = newRole.permissions.toArray().join(', ');
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setDescription(`<@&${newRole.id}> has been updated`)
			.addFields(
				{ name: 'Role Updated', value: `<@&${newRole.id}>` },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: roleupdate' });

		if (oldRole.name !== newRole.name) {
			changeEmbed.addFields([{ name: 'Name', value: `\`${oldRole.name}\` -> \`${newRole.name}\`` }]);
		}

		if (oldRole.name !== newRole.name) {
			changeEmbed.addFields([{ name: 'Colour', value: `\`${oldRole.hexColor}\` -> \`${newRole.hexColor}\`` }]);
		}

		if (oldRole.hoist !== newRole.hoist) {
			changeEmbed.addFields([{ name: 'Show seperate', value: `\`${oldRole.hoist}\` -> \`${newRole.hoist}\`` }]);
		}

		if (oldRole.managed !== newRole.managed) {
			changeEmbed.addFields([{ name: 'Managed by bot, etc.', value: `\`${oldRole.managed}\` -> \`${newRole.managed}\`` }]);
		}

		if (oldRole.mentionable !== newRole.mentionable) {
			changeEmbed.addFields([{ name: 'Can be mentioned', value: `\`${oldRole.mentionable}\` -> \`${newRole.mentionable}\`` }]);
		}

		if (oldPermissionsReadable !== newPermissionsReadable) {
			changeEmbed.addFields([{ name: 'Permissions', value: `\`${oldPermissionsReadable}\` -> \`${newPermissionsReadable}\`` }]);
		}

		await channel.send({ embeds: [changeEmbed] });
	}
};
