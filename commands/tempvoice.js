const { DBGuilds } = require('../dbObjects');

//import the config variables from config.json
const { prefix } = require('../config.json');

module.exports = {
	name: 'tempvoice',
	aliases: ['tempvoices', 'temporaryvoices', 'modularchannels', 'customvoice', 'tempchannel', 'tempchannels', 'customvoices', 'customchannel', 'customchannels'],
	description: 'Toggles the temporary channel setting for the server',
	usage: '<enable/disable/text> <for \'text\' option: enable/disable>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args) {
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guild.id },
		});

		//Check if guild exists in db
		if (guild) {
			//Check first argument
			if (args[0] === 'enable') {
				guild.temporaryVoices = true;
				guild.save();

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

				if (guild.addTemporaryText) {
					msg.channel.send(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
				} else {
					msg.channel.send(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will NOT be created alongside for all the members in the voices.\n To enable this type \`${guildPrefix}tempvoice text enable\``);
				}
			} else if (args[0] === 'disable') {
				guild.temporaryVoices = false;
				guild.save();
				msg.channel.send('Temporary channels have been disabled.');
			} else if (args[0] === 'text') {
				if (args[1] === 'enable') {
					guild.addTemporaryText = true;
					guild.save();
					msg.channel.send('Text channels will now be created alongside temporary voice channels.');
				} else if (args[1] === 'disable') {
					guild.addTemporaryText = false;
					guild.save();
					msg.channel.send('Text channels will NOT be created alongside temporary voice channels.');
				} else {
					msg.channel.send('Please specify if you want to enable or disable the textchannel creation.');
				}
			}
		} else {
			if (args[0] === 'enable') {

				//Create guild in db if it wasn't there yet
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, temporaryVoices: true, addTemporaryText: true });

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

				msg.channel.send(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
			} else if (args[0] === 'disable') {
				//Create guild in db if it wasn't there yet
				DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: true });
				msg.channel.send('Temporary channels have been disabled.');
			} else if (args[0] === 'text') {
				if (args[1] === 'enable') {
					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: true });
					msg.channel.send('Text channels will now be created alongside temporary voice channels.');
				} else if (args[1] === 'disable') {
					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: false });
					msg.channel.send('Text channels will NOT be created alongside temporary voice channels.');
				} else {
					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guild.id, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: false });
					msg.channel.send('Please specify if you want to enable or disable the textchannel creation.');
				}
			}
		}
	},
};