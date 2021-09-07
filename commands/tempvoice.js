const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'tempvoice',
	aliases: ['tempvoices', 'temporaryvoices', 'modularchannels', 'customvoice', 'tempchannel', 'tempchannels', 'customvoices', 'customchannel', 'customchannels'],
	description: 'Toggles the temporary channel setting for the server',
	usage: '<enable/disable/text> <for \'text\' option: enable/disable>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	botPermissions: ['MANAGE_CHANNELS', 'MOVE_MEMBERS', 'MANAGE_ROLES'],
	botPermissionsTranslated: 'Manage Channels, Manage Roles and Move Members',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args) {
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guildId },
		});

		//Check if guild exists in db
		if (guild) {
			//Check first argument
			if (args[0] === 'enable') {
				guild.temporaryVoices = true;
				guild.save();

				let guildPrefix = await getGuildPrefix(msg);

				if (guild.addTemporaryText) {
					msg.reply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
				} else {
					msg.reply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will NOT be created alongside for all the members in the voices.\n To enable this type \`${guildPrefix}tempvoice text enable\``);
				}
			} else if (args[0] === 'disable') {
				guild.temporaryVoices = false;
				guild.save();
				msg.reply('Temporary channels have been disabled.');
			} else if (args[0] === 'text') {
				if (args[1] === 'enable') {
					//Check permissions of the bot
					const botPermissions = msg.channel.permissionsFor(await msg.guild.members.fetch('784836063058329680'));
					if (!botPermissions.has('ADMINISTRATOR')) {
						return msg.reply('I need Administrator permissions to ensure the proper visibility of temporary text channels for only the relevant users!');
					}

					guild.addTemporaryText = true;
					guild.save();
					msg.reply('Text channels will now be created alongside temporary voice channels.');
				} else if (args[1] === 'disable') {
					guild.addTemporaryText = false;
					guild.save();
					msg.reply('Text channels will NOT be created alongside temporary voice channels.');
				} else {
					msg.reply('Please specify if you want to enable or disable the textchannel creation.');
				}
			}
		} else {
			if (args[0] === 'enable') {

				//Create guild in db if it wasn't there yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: true, addTemporaryText: true });

				let guildPrefix = await getGuildPrefix(msg);

				msg.reply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
			} else if (args[0] === 'disable') {
				//Create guild in db if it wasn't there yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: true });
				msg.reply('Temporary channels have been disabled.');
			} else if (args[0] === 'text') {
				if (args[1] === 'enable') {
					//Check permissions of the bot
					const botPermissions = msg.channel.permissionsFor(await msg.guild.members.fetch('784836063058329680'));
					if (!botPermissions.has('ADMINISTRATOR')) {
						return msg.reply('I need Administrator permissions to ensure the proper visibility of temporary text channels for only the relevant users!');
					}

					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: true });
					msg.reply('Text channels will now be created alongside temporary voice channels.');
				} else if (args[1] === 'disable') {
					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: false });
					msg.reply('Text channels will NOT be created alongside temporary voice channels.');
				} else {
					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: false });
					msg.reply('Please specify if you want to enable or disable the textchannel creation.');
				}
			}
		}
	},
};