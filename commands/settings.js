const Discord = require('discord.js');
const { DBGuilds, DBAutoRoles } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'settings',
	aliases: ['bot-settings', 'server-settings'],
	description: 'Sends an info card about the settings of the bot for the server',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Server settings info card will be sent');
		}

		//Get bot member
		const member = msg.guild.members.fetch(msg.client.user.id);

		const user = msg.client.users.cache.find(user => user.id === msg.client.user.id);

		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId },
		});

		let membername;

		if (member.nickname) {
			membername = member.nickname;
		} else {
			membername = user.username;
		}

		let dadmodeEnabled;

		if (guild && guild.dadmodeEnabled) {
			dadmodeEnabled = 'Enabled';
		} else {
			dadmodeEnabled = 'Disabled';
		}

		let saluteEnabled;

		if (guild && guild.saluteEnabled) {
			saluteEnabled = 'Enabled';
		} else {
			saluteEnabled = 'Disabled';
		}

		let owoEnabled;

		if (guild && guild.owoEnabled) {
			owoEnabled = 'Enabled';
		} else {
			owoEnabled = 'Disabled';
		}

		let welcomeMessage;

		if (guild && guild.sendWelcomeMessage) {
			welcomeMessage = 'Enabled';
		} else {
			welcomeMessage = 'Disabled';
		}

		let goodbyeMessage;

		if (guild && guild.sendGoodbyeMessage) {
			goodbyeMessage = 'Enabled';
		} else {
			goodbyeMessage = 'Disabled';
		}

		//get all autoRoles for the guild
		const autoRolesList = await DBAutoRoles.findAll({ where: { guildId: msg.guildId } });
		//iterate for every autorole in the array
		for (let i = 0; i < autoRolesList.length; i++) {
			//get role object by role Id
			let autoRole = msg.guild.roles.cache.get(autoRolesList[i].roleId);
			//Set array index to the role name for the output
			autoRolesList[i] = autoRole.name;
		}

		let guildPrefix = await getGuildPrefix(msg);

		//Set the output string
		const autoRolesString = autoRolesList.join(', ') || 'None.';

		let temporaryVoicesSetting = 'Disabled';

		if (guild && guild.temporaryVoices) {
			temporaryVoicesSetting = 'Enabled';
		}

		let temporaryText = 'Disabled';

		if (guild && guild.addTemporaryText) {
			temporaryText = 'Enabled';
		}

		const guildBotInfoEmbed = new Discord.MessageEmbed()
			.setColor('#ffcc00')
			.setTitle(`${membername} server settings`)
			.setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
			.addFields(
				{ name: 'Dadmode', value: `${dadmodeEnabled}` },
				{ name: 'Salute', value: `${saluteEnabled}` },
				{ name: 'owo', value: `${owoEnabled}` },
				{ name: 'Prefix', value: `${guildPrefix}` },
				{ name: 'Welcome-Messages', value: `${welcomeMessage}` },
				{ name: 'Goodbye-Messages', value: `${goodbyeMessage}` },
				{ name: 'Autoroles', value: `${autoRolesString}` },
				{ name: 'Temporary Voices', value: `${temporaryVoicesSetting}` },
				{ name: 'Temporary Text', value: `${temporaryText}` },
			)
			.setTimestamp();

		if (msg.id) {
			return msg.reply({ embeds: [guildBotInfoEmbed] });
		}
		return interaction.followUp({ embeds: [guildBotInfoEmbed] });
	},
};