const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');
const { isWrongSystem, logDatabaseQueries } = require('./utils');

module.exports = async function (oldGuild, newGuild) {
	if (isWrongSystem(newGuild.id, false)) {
		return;
	}

	logDatabaseQueries(2, 'guildUpdate.js DBGuilds');
	//Get the guild dataset from the db
	const guild = await DBGuilds.findOne({
		where: { guildId: newGuild.id, loggingGuildUpdate: true },
	});

	//check if a guild was found in the db
	if (guild && guild.loggingChannel) {
		let channel;
		try {
			channel = await newGuild.client.channels.fetch(guild.loggingChannel);
		} catch (error) {
			if (error.message === 'Unknown Channel') {
				guild.loggingChannel = null;
				guild.save();
				const owner = await newGuild.client.users.fetch(newGuild.ownerId);
				return owner.send(`It seems like the logging channel on the guild \`${newGuild.name}\` has been deleted.\nThe logging has been deactivated.`);
			}
			console.log(error);
		}

		const changeEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setAuthor(newGuild.name, oldGuild.iconURL())
			.setDescription('The server has been updated!')
			.setThumbnail(newGuild.iconURL())
			.addFields(
				{ name: 'The server has been updated', value: newGuild.name },
			)
			.setTimestamp()
			.setFooter('Eventname: guildupdate');

		if (oldGuild.name !== newGuild.name) {
			changeEmbed.addField('Name', `\`${oldGuild.name}\` -> \`${newGuild.name}\``);
		}

		if (oldGuild.iconURL() !== newGuild.iconURL()) {
			changeEmbed.addField('Icon', `[Old Icon](${oldGuild.iconURL()}) -> [New Icon](${newGuild.iconURL()})`);
		}

		if (oldGuild.region !== newGuild.region) {
			changeEmbed.addField('Region', `\`${oldGuild.region}\` -> \`${newGuild.region}\``);
		}

		if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
			changeEmbed.addField('AFK Timeout', `\`${oldGuild.afkTimeout}\` -> \`${newGuild.afkTimeout}\``);
		}

		if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
			changeEmbed.addField('AFK Channel', `<#${oldGuild.afkChannelId}> -> <#${newGuild.afkChannelId}>`);
		}

		if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
			changeEmbed.addField('System Channel', `<#${oldGuild.systemChannelId}> -> <#${newGuild.systemChannelId}>`);
		}

		if (oldGuild.premiumTier !== newGuild.premiumTier) {
			changeEmbed.addField('Premium Tier', `\`${oldGuild.premiumTier}\` -> \`${newGuild.premiumTier}\``);
		}

		if (oldGuild.premiumSubscriptionCount !== newGuild.premiumSubscriptionCount) {
			changeEmbed.addField('Premium Tier', `\`${oldGuild.premiumSubscriptionCount}\` -> \`${newGuild.premiumSubscriptionCount}\``);
		}

		if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
			changeEmbed.addField('Verification Level', `\`${oldGuild.verificationLevel}\` -> \`${newGuild.verificationLevel}\``);
		}

		if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
			changeEmbed.addField('Explicit Content Filter', `\`${oldGuild.explicitContentFilter}\` -> \`${newGuild.explicitContentFilter}\``);
		}

		if (oldGuild.mfaLevel !== newGuild.mfaLevel) {
			changeEmbed.addField('MFA Level', `\`${oldGuild.mfaLevel}\` -> \`${newGuild.mfaLevel}\``);
		}

		if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) {
			changeEmbed.addField('Default Message Notifications', `\`${oldGuild.defaultMessageNotifications}\` -> \`${newGuild.defaultMessageNotifications}\``);
		}

		if (oldGuild.description !== newGuild.description) {
			changeEmbed.addField('Description', `\`${oldGuild.description}\` -> \`${newGuild.description}\``);
		}

		if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
			changeEmbed.addField('Vanity Invite Code', `\`${oldGuild.vanityURLCode}\` -> \`${newGuild.vanityURLCode}\``);
		}

		if (oldGuild.banner !== newGuild.banner) {
			changeEmbed.addField('Banner', 'The serverbanner has been updated');
		}

		if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
			changeEmbed.addField('Rules Channel', `<#${oldGuild.rulesChannelId}> -> <#${newGuild.rulesChannelId}>`);
		}

		if (oldGuild.publicUpdatesChannelId !== newGuild.publicUpdatesChannelId) {
			changeEmbed.addField('Public Updates Channel', `<#${oldGuild.publicUpdatesChannelId}> -> <#${newGuild.publicUpdatesChannelId}>`);
		}

		if (oldGuild.ownerId !== newGuild.ownerId) {
			changeEmbed.addField('Owner', `<@${oldGuild.ownerId}> -> <@${newGuild.ownerId}>`);
		}

		if (oldGuild.widgetChannelId !== newGuild.widgetChannelId) {
			changeEmbed.addField('Widget Channel', `<#${oldGuild.widgetChannelId}> -> <#${newGuild.widgetChannelId}>`);
		}

		if (oldGuild.embedChannelId !== newGuild.embedChannelId) {
			changeEmbed.addField('Embed Channel', `<#${oldGuild.embedChannelId}> -> <#${newGuild.embedChannelId}>`);
		}

		channel.send({ embeds: [changeEmbed] });
	}
};