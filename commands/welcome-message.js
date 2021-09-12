const { DBGuilds } = require('../dbObjects');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'welcome-message',
	//aliases: ['developer'],
	description: 'Sends the specified message into the channel the user used the command in as soon as a new member arrives.',
	usage: '<current/disable/message to send> (use "@member" to mention the new member)',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args) {
		//Check first argument of the command
		if (args[0] === 'current') {
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Check if there is a welcome message set
				if (guild.sendWelcomeMessage) {
					//get the channel id
					const guildWelcomeMessageChannelId = guild.welcomeMessageChannel;
					//get the channel object by the id
					const guildWelcomeMessageChannel = msg.guild.channels.cache.find(channel => channel.id === guildWelcomeMessageChannelId);
					msg.reply(`The current welcome message is set to channel \`${guildWelcomeMessageChannel.name}\`: \`${guild.welcomeMessageText.replace(/`/g, '')}\``);
				} else {
					//if no welcome message is set
					msg.reply('There is currently no welcome message set.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: false });
				//Send that no welcome message is set
				msg.reply('There is currently no welcome message set.');
			}
			//Check first argument of the command
		} else if (args[0] === 'disable') {
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Check if there is a welcome message set
				if (guild.sendWelcomeMessage) {
					//Set the dataset to no welcome message
					guild.sendWelcomeMessage = false;
					//Save the dataset
					guild.save();
					msg.reply('Welcome messages have been disabled for this server.');
				} else {
					//if welcome messages are already disabled
					msg.reply('Welcome messages are already disabled for this server.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: false });
				//Send that no welcome message is set
				msg.reply('Welcome messages are already disabled for this server.');
			}
			//If not specified keyword for the command
		} else {
			//Define welcome message from the rest of the arguments
			let welcomeMessage = args.join(' ');
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guildId },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Set welcome message fields and save the dataset
				guild.sendWelcomeMessage = true;
				guild.welcomeMessageChannel = msg.channel.id;
				guild.welcomeMessageText = welcomeMessage;
				guild.save();
			} else {
				//if guild was not found, create it in db
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, sendWelcomeMessage: true, welcomeMessageChannel: msg.channel.id, welcomeMessageText: welcomeMessage });
			}
			msg.reply(`The new message \`${welcomeMessage.replace(/`/g, '')}\` has been set for welcoming new members in the channel \`${msg.channel.name}\`.`);
		}
	},
};