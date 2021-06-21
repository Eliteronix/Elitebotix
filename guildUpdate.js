const Discord = require('discord.js');
const { DBGuilds } = require('./dbObjects');

module.exports = async function (oldGuild, newGuild) {

	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (newGuild.id != '800641468321759242' && newGuild.id != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (newGuild.id != '800641367083974667' && newGuild.id != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (newGuild.id === '800641468321759242' || newGuild.id === '800641735658176553' || newGuild.id === '800641367083974667' || newGuild.id === '800641819086946344') {
			return;
		}
	}

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
				const owner = await newGuild.client.users.fetch(newGuild.ownerID);
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

		if (oldGuild.afkChannelID !== newGuild.afkChannelID) {
			changeEmbed.addField('AFK Channel', `<#${oldGuild.afkChannelID}> -> <#${newGuild.afkChannelID}>`);
		}

		if (oldGuild.systemChannelID !== newGuild.systemChannelID) {
			changeEmbed.addField('System Channel', `<#${oldGuild.systemChannelID}> -> <#${newGuild.systemChannelID}>`);
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

		if (oldGuild.rulesChannelID !== newGuild.rulesChannelID) {
			changeEmbed.addField('Rules Channel', `<#${oldGuild.rulesChannelID}> -> <#${newGuild.rulesChannelID}>`);
		}

		if (oldGuild.publicUpdatesChannelID !== newGuild.publicUpdatesChannelID) {
			changeEmbed.addField('Public Updates Channel', `<#${oldGuild.publicUpdatesChannelID}> -> <#${newGuild.publicUpdatesChannelID}>`);
		}

		if (oldGuild.ownerID !== newGuild.ownerID) {
			changeEmbed.addField('Owner', `<@${oldGuild.ownerID}> -> <@${newGuild.ownerID}>`);
		}

		if (oldGuild.widgetChannelID !== newGuild.widgetChannelID) {
			changeEmbed.addField('Widget Channel', `<#${oldGuild.widgetChannelID}> -> <#${newGuild.widgetChannelID}>`);
		}

		if (oldGuild.embedChannelID !== newGuild.embedChannelID) {
			changeEmbed.addField('Embed Channel', `<#${oldGuild.embedChannelID}> -> <#${newGuild.embedChannelID}>`);
		}

		channel.send(changeEmbed);
	}
};