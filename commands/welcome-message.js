const { DBGuilds } = require('../dbObjects');

module.exports = {
	name: 'welcome-message',
	//aliases: ['developer'],
	description: 'Sends the specified message into the channel the user used the command in as soon as a new member arrives.',
	usage: '<current/disable/message to send> (use "@member" to mention the new member)',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	async execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			//Check first argument of the command
			if (args[0] === 'current') {
				//get guild from db
				const guild = await DBGuilds.findOne({
					where: { guildId: msg.guild.id },
				});

				//Check if the guild was found in the db
				if (guild) {
					//Check if there is a welcome message set
					if (guild.sendWelcomeMessage) {
						//get the channel id
						const guildWelcomeMessageChannelId = guild.welcomeMessageChannel;
						//get the channel object by the id
						const guildWelcomeMessageChannel = msg.guild.channels.cache.find(channel => channel.id === guildWelcomeMessageChannelId);
						msg.channel.send(`The current welcome message is set to channel \`${guildWelcomeMessageChannel.name}\`: \`${guild.welcomeMessageText}\``);
					} else {
						//if no welcome message is set
						msg.channel.send('There is currently no welcome message set.');
					}
				} else {
					//Create guild in the db in case the guild is not in the db yet
					DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendWelcomeMessage: false });
					//Send that no welcome message is set
					msg.channel.send('There is currently no welcome message set.');
				}
				//Check first argument of the command
			} else if (args[0] === 'disable') {
				//get guild from db
				const guild = await DBGuilds.findOne({
					where: { guildId: msg.guild.id },
				});

				//Check if the guild was found in the db
				if (guild) {
					//Check if there is a welcome message set
					if (guild.sendWelcomeMessage) {
						//Set the dataset to no welcome message
						guild.sendWelcomeMessage = false;
						//Save the dataset
						guild.save();
						msg.channel.send('Welcome messages have been disabled for this server.');
					} else {
						//if welcome messages are already disabled
						msg.channel.send('Welcome messages are already disabled for this server.');
					}
				} else {
					//Create guild in the db in case the guild is not in the db yet
					DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendWelcomeMessage: false });
					//Send that no welcome message is set
					msg.channel.send('Welcome messages are already disabled for this server.');
				}
				//If not specified keyword for the command
			} else {
				//Define welcome message from the rest of the arguments
				let welcomeMessage = args.join(' ');
				//get guild from db
				const guild = await DBGuilds.findOne({
					where: { guildId: msg.guild.id },
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
					DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, sendWelcomeMessage: true, welcomeMessageChannel: msg.channel.id, welcomeMessageText: welcomeMessage });
				}
				msg.channel.send(`The new message \`${welcomeMessage}\` has been set for welcoming new members in the channel \`${msg.channel.name}\`.`);
			}
		}
	},
};