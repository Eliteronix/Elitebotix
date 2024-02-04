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
		attributes: ['id', 'loggingChannel'],
		where: {
			guildId: newGuild.id,
			loggingGuildUpdate: true
		},
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
			console.error('guildUpdate.js | logging' + error);
		}

		const changeEmbed = new Discord.EmbedBuilder()
			.setColor('#0099ff')
			.setAuthor({ name: newGuild.name, iconURL: oldGuild.iconURL() })
			.setDescription('The server has been updated!')
			.setThumbnail(newGuild.iconURL())
			.addFields(
				{ name: 'The server has been updated', value: newGuild.name },
			)
			.setTimestamp()
			.setFooter({ text: 'Eventname: guildupdate' });

		if (oldGuild.name !== newGuild.name) {
			changeEmbed.addFields([{ name: 'Name', value: `\`${oldGuild.name}\` -> \`${newGuild.name}\`` }]);
		}

		if (oldGuild.iconURL() !== newGuild.iconURL()) {
			changeEmbed.addFields([{ name: 'Icon', value: `[Old Icon](${oldGuild.iconURL()}) -> [New Icon](${newGuild.iconURL()})` }]);
		}

		if (oldGuild.region !== newGuild.region) {
			changeEmbed.addFields([{ name: 'Region', value: `\`${oldGuild.region}\` -> \`${newGuild.region}\`` }]);
		}

		if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
			changeEmbed.addFields([{ name: 'AFK Timeout', value: `\`${oldGuild.afkTimeout}\` -> \`${newGuild.afkTimeout}\`` }]);
		}

		if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
			changeEmbed.addFields([{ name: 'AFK Channel', value: `<#${oldGuild.afkChannelId}> -> <#${newGuild.afkChannelId}>` }]);
		}

		if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
			changeEmbed.addFields([{ name: 'System Channel', value: `<#${oldGuild.systemChannelId}> -> <#${newGuild.systemChannelId}>` }]);
		}

		if (oldGuild.premiumTier !== newGuild.premiumTier) {
			changeEmbed.addFields([{ name: 'Premium Tier', value: `\`${oldGuild.premiumTier}\` -> \`${newGuild.premiumTier}\`` }]);
		}

		if (oldGuild.premiumSubscriptionCount !== newGuild.premiumSubscriptionCount) {
			changeEmbed.addFields([{ name: 'Premium Tier', value: `\`${oldGuild.premiumSubscriptionCount}\` -> \`${newGuild.premiumSubscriptionCount}\`` }]);
		}

		if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
			changeEmbed.addFields([{ name: 'Verification Level', value: `\`${oldGuild.verificationLevel}\` -> \`${newGuild.verificationLevel}\`` }]);
		}

		if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
			changeEmbed.addFields([{ name: 'Explicit Content Filter', value: `\`${oldGuild.explicitContentFilter}\` -> \`${newGuild.explicitContentFilter}\`` }]);
		}

		if (oldGuild.mfaLevel !== newGuild.mfaLevel) {
			changeEmbed.addFields([{ name: 'MFA Level', value: `\`${oldGuild.mfaLevel}\` -> \`${newGuild.mfaLevel}\`` }]);
		}

		if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) {
			changeEmbed.addFields([{ name: 'Default Message Notifications', value: `\`${oldGuild.defaultMessageNotifications}\` -> \`${newGuild.defaultMessageNotifications}\`` }]);
		}

		if (oldGuild.description !== newGuild.description) {
			changeEmbed.addFields([{ name: 'Description', value: `\`${oldGuild.description}\` -> \`${newGuild.description}\`` }]);
		}

		if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
			changeEmbed.addFields([{ name: 'Vanity Invite Code', value: `\`${oldGuild.vanityURLCode}\` -> \`${newGuild.vanityURLCode}\`` }]);
		}

		if (oldGuild.banner !== newGuild.banner) {
			changeEmbed.addFields([{ name: 'Banner', value: 'The serverbanner has been updated' }]);
		}

		if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
			changeEmbed.addFields([{ name: 'Rules Channel', value: `<#${oldGuild.rulesChannelId}> -> <#${newGuild.rulesChannelId}>` }]);
		}

		if (oldGuild.publicUpdatesChannelId !== newGuild.publicUpdatesChannelId) {
			changeEmbed.addFields([{ name: 'Public Updates Channel', value: `<#${oldGuild.publicUpdatesChannelId}> -> <#${newGuild.publicUpdatesChannelId}>` }]);
		}

		if (oldGuild.ownerId !== newGuild.ownerId) {
			changeEmbed.addFields([{ name: 'Owner', value: `<@${oldGuild.ownerId}> -> <@${newGuild.ownerId}>` }]);
		}

		if (oldGuild.widgetChannelId !== newGuild.widgetChannelId) {
			changeEmbed.addFields([{ name: 'Widget Channel', value: `<#${oldGuild.widgetChannelId}> -> <#${newGuild.widgetChannelId}>` }]);
		}

		if (oldGuild.embedChannelId !== newGuild.embedChannelId) {
			changeEmbed.addFields([{ name: 'Embed Channel', value: `<#${oldGuild.embedChannelId}> -> <#${newGuild.embedChannelId}>` }]);
		}

		channel.send({ embeds: [changeEmbed] });
	}
};