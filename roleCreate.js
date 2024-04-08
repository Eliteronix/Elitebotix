const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (role) {
	if (isWrongSystem(role.guild.id, false)) {
		return;
	}

	logDatabaseQueries(2, 'roleCreate.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: role.guild.id,
			loggingRoleCreate: true
		},
	});

	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await role.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await role.client.users.fetch(role.guild.ownerId);
				return await owner.send(`It seems like the logging channel on the guild \`${role.guild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.error(error);
		}

		let permissionsReadable = 'None';

		if (role.permissions.toArray().length > 0) {
			permissionsReadable = role.permissions.toArray().join(', ');
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setDescription(`<@&${role.id}> has been created`)
			.addFields(
				{ name: 'Role Created', value: `<@&${role.id}>` },
				{ name: 'Colour', value: role.hexColor },
				{ name: 'Show seperate', value: role.hoist.toString() },
				{ name: 'Managed by bot, etc.', value: role.managed.toString() },
				{ name: 'Can be mentioned', value: role.mentionable.toString() },
				{ name: 'Position', value: role.rawPosition.toString() },
				{ name: 'Permissions', value: permissionsReadable },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: rolecreate' });

		await channel.send({ embeds: [changeEmbed] });
	}
};
