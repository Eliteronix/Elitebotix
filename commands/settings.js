//Require discord.js module
const Discord = require('discord.js');

//import the config variables from config.json
const { prefix } = require('../config.json');

//Get Guilds Table
const { DBGuilds, DBAutoRoles } = require('../dbObjects');

module.exports = {
	name: 'settings',
	aliases: ['bot-settings', 'server-settings'],
	description: 'Sends an info card about the settings of the bot for the server.',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {

			//Get bot member
			const member = msg.guild.members.fetch('784836063058329680');

			const user = msg.client.users.cache.find(user => user.id === '784836063058329680');

			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
			});

			let membername;

			if (member.nickname) {
				membername = member.nickname;
			} else {
				membername = user.username;
			}

			let dadmodeEnabled;

			if (guild.dadmodeEnabled) {
				dadmodeEnabled = 'Enabled';
			} else {
				dadmodeEnabled = 'Disabled';
			}

			let welcomeMessage;

			if (guild.sendWelcomeMessage) {
				welcomeMessage = 'Enabled';
			} else {
				welcomeMessage = 'Disabled';
			}

			let goodbyeMessage;

			if (guild.sendGoodbyeMessage) {
				goodbyeMessage = 'Enabled';
			} else {
				goodbyeMessage = 'Disabled';
			}

			//get all autoRoles for the guild
			const autoRolesList = await DBAutoRoles.findAll({ where: { guildId: msg.guild.id } });
			//iterate for every autorole in the array
			for (let i = 0; i < autoRolesList.length; i++) {
				//get role object by role Id
				let autoRole = msg.guild.roles.cache.get(autoRolesList[i].roleId);
				//Set array index to the role name for the output
				autoRolesList[i] = autoRole.name;
			}

			//Define prefix command
			let guildPrefix;

			//Check if the channel type is not a dm
			if (msg.channel.type === 'dm') {
				//Set prefix to standard prefix
				guildPrefix = prefix;
			} else {
				//Check if a guild record was found
				if (guild) {
					if (guild.customPrefixUsed) {
						guildPrefix = guild.customPrefix;
					} else {
						//Set prefix to standard prefix
						guildPrefix = prefix;
					}
				} else {
					//Set prefix to standard prefix
					guildPrefix = prefix;
				}
			}

			//Set the output string
			const autoRolesString = autoRolesList.join(', ') || 'None.';

			let temporaryVoicesSetting = 'Disabled';

			if(guild.temporaryVoices){
				temporaryVoicesSetting = 'Enabled';
			}

			let temporaryText = 'Disabled';

			if(guild.addTemporaryText){
				temporaryText = 'Enabled';
			}

			const guildBotInfoEmbed = new Discord.MessageEmbed()
				.setColor('#ffcc00')
				.setTitle(`${membername} server settings`)
				.setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
				.addFields(
					{ name: 'Dadmode', value: `${dadmodeEnabled}` },
					{ name: 'Prefix', value: `${guildPrefix}` },
					{ name: 'Welcome-Messages', value: `${welcomeMessage}` },
					{ name: 'Goodbye-Messages', value: `${goodbyeMessage}` },
					{ name: 'Autoroles', value: `${autoRolesString}` },
					{ name: 'Temporary Voices', value: `${temporaryVoicesSetting}` },
					{ name: 'Temporary Text', value: `${temporaryText}` },
				)
				.setTimestamp();

			msg.channel.send(guildBotInfoEmbed);
		}
	},
};