const { DBGuilds } = require('./dbObjects');
const { logDatabaseQueries } = require('./utils');

module.exports = async function (oldUser, newUser) {
	if (oldUser.username !== newUser.username) {
		logDatabaseQueries(2, 'userUpdate.js DBGuilds Username');
		const guilds = await DBGuilds.findAll({
			where: { loggingUsernames: true }
		});

		guilds.forEach(async (guild) => {
			if (guild.loggingChannel && correctEnvironment(guild)) {
				let found = await newUser.client.shard.broadcastEval(async (c, { guildId, newUser, oldUser }) => {
					let discordGuild;
					try {
						discordGuild = await c.guilds.fetch(guildId);
					} catch (error) {
						return null;
					}

					if (!discordGuild) {
						return null;
					}

					let member;
					try {
						member = await discordGuild.members.fetch(newUser.id);
					} catch (error) {
						//nothing
					}

					if (!member) {
						return;
					}

					let channel;
					try {
						channel = await c.channels.fetch(guild.loggingChannel);
					} catch (error) {
						return `guild;${discordGuild.ownerId};${discordGuild.name}`;
					}

					if (!channel) {
						return `guild;${discordGuild.ownerId};${discordGuild.name}`;
					}

					const Discord = require('discord.js');
					const changeEmbed = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setAuthor({ name: `${newUser.username}#${newUser.discriminator}`, iconURL: newUser.displayAvatarURL() })
						.setDescription(`<@${newUser.id}> has updated their profile!`)
						.setThumbnail(newUser.displayAvatarURL())
						.addFields(
							{ name: 'Username', value: `\`${oldUser.username}\` -> \`${newUser.username}\`` },
						)
						.setTimestamp()
						.setFooter({ text: 'Eventname: usernames' });

					channel.send({ embeds: [changeEmbed] });
					return 'channel';
				}, { context: { guildId: guild.guildId, newUser: newUser, oldUser: oldUser } });

				found = found.some(f => f);
				if (!found) {
					guild.loggingChannel = null;
					guild.save();
					return;
				} else if (found.startsWith('guild')) {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newUser.client.users.fetch(found.split(';')[1]);
					return owner.send(`It seems like the logging channel on the guild \`${found.split(';')[2]}\` has been deleted.\nThe logging has been deactivated.`);
				}
			}
		});
	}

	if (oldUser.discriminator !== newUser.discriminator) {
		logDatabaseQueries(2, 'userUpdate.js DBGuilds Discriminator');
		const guilds = await DBGuilds.findAll({
			where: { loggingDiscriminators: true }
		});

		guilds.forEach(async (guild) => {
			if (guild.loggingChannel && correctEnvironment(guild)) {
				let found = await newUser.client.shard.broadcastEval(async (c, { guildId, newUser, oldUser }) => {
					let discordGuild;
					try {
						discordGuild = await c.guilds.fetch(guildId);
					} catch (error) {
						return null;
					}

					if (!discordGuild) {
						return null;
					}

					let member;
					try {
						member = await discordGuild.members.fetch(newUser.id);
					} catch (error) {
						//nothing
					}

					if (!member) {
						return;
					}

					let channel;
					try {
						channel = await c.channels.fetch(guild.loggingChannel);
					} catch (error) {
						return `guild;${discordGuild.ownerId};${discordGuild.name}`;
					}

					if (!channel) {
						return `guild;${discordGuild.ownerId};${discordGuild.name}`;
					}

					const Discord = require('discord.js');
					const changeEmbed = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setAuthor({ name: `${newUser.username}#${newUser.discriminator}`, iconURL: newUser.displayAvatarURL() })
						.setDescription(`<@${newUser.id}> has updated their profile!`)
						.setThumbnail(newUser.displayAvatarURL())
						.addFields(
							{ name: 'Discriminator', value: `\`${oldUser.discriminator}\` -> \`${newUser.discriminator}\`` },
						)
						.setTimestamp()
						.setFooter({ text: 'Eventname: userdiscriminators' });

					channel.send({ embeds: [changeEmbed] });
					return 'channel';
				}, { context: { guildId: guild.guildId, newUser: newUser, oldUser: oldUser } });

				found = found.some(f => f);
				if (!found) {
					guild.loggingChannel = null;
					guild.save();
					return;
				} else if (found.startsWith('guild')) {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newUser.client.users.fetch(found.split(';')[1]);
					return owner.send(`It seems like the logging channel on the guild \`${found.split(';')[2]}\` has been deleted.\nThe logging has been deactivated.`);
				}
			}
		});
	}

	if (oldUser.displayAvatarURL() !== newUser.displayAvatarURL()) {
		logDatabaseQueries(2, 'userUpdate.js DBGuilds Avatar');
		const guilds = await DBGuilds.findAll({
			where: { loggingAvatars: true }
		});

		guilds.forEach(async (guild) => {
			if (guild.loggingChannel && correctEnvironment(guild)) {
				let found = await newUser.client.shard.broadcastEval(async (c, { guildId, newUser, oldUser }) => {
					let discordGuild;
					try {
						discordGuild = await c.guilds.fetch(guildId);
					} catch (error) {
						return null;
					}

					if (!discordGuild) {
						return null;
					}

					let member;
					try {
						member = await discordGuild.members.fetch(newUser.id);
					} catch (error) {
						//nothing
					}

					if (!member) {
						return;
					}

					let channel;
					try {
						channel = await c.channels.fetch(guild.loggingChannel);
					} catch (error) {
						return `guild;${discordGuild.ownerId};${discordGuild.name}`;
					}

					if (!channel) {
						return `guild;${discordGuild.ownerId};${discordGuild.name}`;
					}

					const Discord = require('discord.js');
					const changeEmbed = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setAuthor({ name: `${newUser.username}#${newUser.discriminator}`, iconURL: oldUser.displayAvatarURL() })
						.setDescription(`<@${newUser.id}> has updated their profile!`)
						.setThumbnail(newUser.displayAvatarURL())
						.addFields(
							{ name: 'Avatar', value: `[Old Avatar](${oldUser.displayAvatarURL()}) -> [New Avatar](${newUser.displayAvatarURL()})` },
						)
						.setTimestamp()
						.setFooter({ text: 'Eventname: useravatars' });

					channel.send({ embeds: [changeEmbed] });
					return 'channel';
				}, { context: { guildId: guild.guildId, newUser: newUser, oldUser: oldUser } });

				found = found.some(f => f);
				if (!found) {
					guild.loggingChannel = null;
					guild.save();
					return;
				} else if (found.startsWith('guild')) {
					guild.loggingChannel = null;
					guild.save();
					const owner = await newUser.client.users.fetch(found.split(';')[1]);
					return owner.send(`It seems like the logging channel on the guild \`${found.split(';')[2]}\` has been deleted.\nThe logging has been deactivated.`);
				}
			}
		});
	}
};

function correctEnvironment(guild) {

	// For the development version
	// if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (guild.guildId != '800641468321759242' && guild.guildId != '800641735658176553') {
			return false;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (guild.guildId != '800641367083974667' && guild.guildId != '800641819086946344') {
			return false;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (guild.guildId === '800641468321759242' || guild.guildId === '800641735658176553' || guild.guildId === '800641367083974667' || guild.guildId === '800641819086946344') {
			return false;
		}
	}

	return true;
}