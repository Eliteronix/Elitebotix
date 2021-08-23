const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'goodbye-message',
	aliases: ['farewell-message'],
	description: 'Sends the specified message into the channel the user used the command in as soon as a member leaves.',
	usage: '<current/disable/message to send> (use "@member" to mention the member)',
	permissions: 'MANAGE_GUILD',
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
				where: { guildId: msg.guild.id },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Check if there is a goodbye message set
				if (guild.sendGoodbyeMessage) {
					//get the channel id
					const guildGoodbyeMessageChannelId = guild.goodbyeMessageChannel;
					//get the channel object by the id
					const guildGoodbyeMessageChannel = msg.guild.channels.cache.find(channel => channel.id === guildGoodbyeMessageChannelId);
					msg.reply(`The current goodbye message is set to channel \`${guildGoodbyeMessageChannel.name}\`: \`${guild.goodbyeMessageText.replace(/`/g, '')}\``);
				} else {
					//if no goodbye message is set
					msg.reply('There is currently no goodbye message set.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendGoodbyeMessage: false });
				//Send that no goodbye message is set
				msg.reply('There is currently no goodbye message set.');
			}
			//Check first argument of the command
		} else if (args[0] === 'disable') {
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Check if there is a goodbye message set
				if (guild.sendGoodbyeMessage) {
					//Set the dataset to no goodbye message
					guild.sendGoodbyeMessage = false;
					//Save the dataset
					guild.save();
					msg.reply('Goodbye messages have been disabled for this server.');
				} else {
					//if goodbye messages are already disabled
					msg.reply('Goodbye messages are already disabled for this server.');
				}
			} else {
				//Create guild in the db in case the guild is not in the db yet
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendGoodbyeMessage: false });
				//Send that no goodbye message is set
				msg.reply('Goodbye messages are already disabled for this server.');
			}
			//If not specified keyword for the command
		} else {
			//Define goodbye message from the rest of the arguments
			let goodbyeMessage = args.join(' ');
			//get guild from db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
			});

			//Check if the guild was found in the db
			if (guild) {
				//Set goodbye message fields and save the dataset
				guild.sendGoodbyeMessage = true;
				guild.goodbyeMessageChannel = msg.channel.id;
				guild.goodbyeMessageText = goodbyeMessage;
				guild.save();
			} else {
				//if guild was not found, create it in db
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendGoodbyeMessage: true, goodbyeMessageChannel: msg.channel.id, goodbyeMessageText: goodbyeMessage });
			}
			msg.reply(`The new message \`${goodbyeMessage.replace(/`/g, '')}\` has been set for leaving members in the channel \`${msg.channel.name}\`.`);
		}
	},
};