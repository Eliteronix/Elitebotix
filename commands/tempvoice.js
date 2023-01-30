const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { PermissionsBitField } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'tempvoice',
	description: 'Toggles the temporary channel setting for the server',
	permissions: PermissionsBitField.Flags.ManageGuild,
	permissionsTranslated: 'Manage Server',
	botPermissions: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages, Manage Channels, Manage Roles and Move Members',
	cooldown: 5,
	tags: 'server-admin',
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			if (interaction.options._subcommand === 'enablevoice') {
				args = ['enable'];
			} else if (interaction.options._subcommand === 'disablevoice') {
				args = ['disable'];
			} else if (interaction.options._subcommand === 'enabletext') {
				args = ['text', 'enable'];
			} else {
				args = ['text', 'disable'];
			}
		}
		logDatabaseQueries(4, 'commands/tempvoice.js DBGuilds');
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
					if (msg.id) {
						return msg.reply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
					}
					return interaction.editReply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
				} else {
					if (msg.id) {
						return msg.reply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will NOT be created alongside for all the members in the voices.\n To enable this type \`${guildPrefix}tempvoice text enable\``);
					}
					return interaction.editReply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will NOT be created alongside for all the members in the voices.\n To enable this type \`${guildPrefix}tempvoice text enable\``);
				}
			} else if (args[0] === 'disable') {
				guild.temporaryVoices = false;
				guild.save();
				if (msg.id) {
					return msg.reply('Temporary channels have been disabled.');
				}
				return interaction.editReply('Temporary channels have been disabled.');
			} else if (args[0] === 'text') {
				if (args[1] === 'enable') {
					//Check permissions of the bot
					const botPermissions = msg.channel.permissionsFor(await msg.guild.members.fetch(msg.client.user.id));
					if (!botPermissions.has('ADMINISTRATOR')) {
						return msg.reply('I need Administrator permissions to ensure the proper visibility of temporary text channels for only the relevant users!');
					}

					guild.addTemporaryText = true;
					guild.save();
					if (msg.id) {
						return msg.reply('Text channels will now be created alongside temporary voice channels.');
					}
					return interaction.editReply('Text channels will now be created alongside temporary voice channels.');
				} else if (args[1] === 'disable') {
					guild.addTemporaryText = false;
					guild.save();
					if (msg.id) {
						return msg.reply('Text channels will NOT be created alongside temporary voice channels.');
					}
					return interaction.editReply('Text channels will NOT be created alongside temporary voice channels.');
				} else {
					if (msg.id) {
						return msg.reply('Please specify if you want to enable or disable the textchannel creation.');
					}
					return interaction.editReply('Please specify if you want to enable or disable the textchannel creation.');
				}
			}
		} else {
			if (args[0] === 'enable') {

				//Create guild in db if it wasn't there yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: true, addTemporaryText: true });

				let guildPrefix = await getGuildPrefix(msg);

				if (msg.id) {
					return msg.reply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
				}
				return interaction.editReply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
			} else if (args[0] === 'disable') {
				//Create guild in db if it wasn't there yet
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: true });
				if (msg.id) {
					return msg.reply('Temporary channels have been disabled.');
				}
				return interaction.editReply('Temporary channels have been disabled.');
			} else if (args[0] === 'text') {
				if (args[1] === 'enable') {
					//Check permissions of the bot
					const botPermissions = msg.channel.permissionsFor(await msg.guild.members.fetch(msg.client.user.id));
					if (!botPermissions.has('ADMINISTRATOR')) {
						if (msg.id) {
							return msg.reply('I need Administrator permissions to ensure the proper visibility of temporary text channels for only the relevant users!');
						}
						return interaction.editReply('I need Administrator permissions to ensure the proper visibility of temporary text channels for only the relevant users!');
					}

					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: true });
					if (msg.id) {
						return msg.reply('Text channels will now be created alongside temporary voice channels.');
					}
					return interaction.editReply('Text channels will now be created alongside temporary voice channels.');
				} else if (args[1] === 'disable') {
					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: false });
					if (msg.id) {
						return msg.reply('Text channels will NOT be created alongside temporary voice channels.');
					}
					return interaction.editReply('Text channels will NOT be created alongside temporary voice channels.');
				} else {
					//Create guild in db if it wasn't there yet
					DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: false });
					if (msg.id) {
						return msg.reply('Please specify if you want to enable or disable the textchannel creation.');
					}
					return interaction.editReply('Please specify if you want to enable or disable the textchannel creation.');
				}
			}
		}
	},
};