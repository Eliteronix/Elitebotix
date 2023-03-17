const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'tempvoice',
	description: 'Toggles the temporary channel setting for the server',
	botPermissions: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages, Manage Channels, Manage Roles and Move Members',
	cooldown: 5,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('tempvoice')
		.setNameLocalizations({
			'de': 'tempvoice',
			'en-GB': 'tempvoice',
			'en-US': 'tempvoice',
		})
		.setDescription('Toggles the temporary channel setting for the server')
		.setDescriptionLocalizations({
			'de': 'Aktiviert/Deaktiviert temporäre Kanäle für den Server',
			'en-GB': 'Toggles the temporary channel setting for the server',
			'en-US': 'Toggles the temporary channel setting for the server',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
		.addSubcommand(subcommand =>
			subcommand
				.setName('enablevoice')
				.setNameLocalizations({
					'de': 'aktivierevoice',
					'en-GB': 'enablevoice',
					'en-US': 'enablevoice',
				})
				.setDescription('Enable temporary voices for the server')
				.setDescriptionLocalizations({
					'de': 'Aktiviert temporäre Sprachkanäle für den Server',
					'en-GB': 'Enable temporary voices for the server',
					'en-US': 'Enable temporary voices for the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disablevoice')
				.setNameLocalizations({
					'de': 'deaktivierevoice',
					'en-GB': 'disablevoice',
					'en-US': 'disablevoice',
				})
				.setDescription('Disable temporary voices for the server')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert temporäre Sprachkanäle für den Server',
					'en-GB': 'Disable temporary voices for the server',
					'en-US': 'Disable temporary voices for the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('enabletext')
				.setNameLocalizations({
					'de': 'aktivieretext',
					'en-GB': 'enabletext',
					'en-US': 'enabletext',
				})
				.setDescription('Enable temporary textchannels along voices for the server')
				.setDescriptionLocalizations({
					'de': 'Aktiviert temporäre Textkanäle parallel zu Sprachkanälen für den Server',
					'en-GB': 'Enable temporary textchannels along voices for the server',
					'en-US': 'Enable temporary textchannels along voices for the server',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disabletext')
				.setNameLocalizations({
					'de': 'deaktivieretext',
					'en-GB': 'disabletext',
					'en-US': 'disabletext',
				})
				.setDescription('Disable temporary textchannels along voices for the server')
				.setDescriptionLocalizations({
					'de': 'Deaktiviert temporäre Textkanäle parallel zu Sprachkanälen für den Server',
					'en-GB': 'Disable temporary textchannels along voices for the server',
					'en-US': 'Disable temporary textchannels along voices for the server',
				})
		),
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
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}

			if (interaction.options.getSubcommand() === 'enablevoice') {
				args = ['enable'];
			} else if (interaction.options.getSubcommand() === 'disablevoice') {
				args = ['disable'];
			} else if (interaction.options.getSubcommand() === 'enabletext') {
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
					let member = null;

					try {
						member = await guild.members.fetch({ user: [msg.client.user.id], time: 300000 })
							.catch((err) => {
								throw new Error(err);
							});

						member = member.first();
					} catch (e) {
						if (e.message !== 'Error [GuildMembersTimeout]: Members didn\'t arrive in time.') {
							console.error('commands/tempvoice.js | text enable guild exists check bot permissions', e);
							return;
						}
					}

					const botPermissions = msg.channel.permissionsFor(member);
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
				logDatabaseQueries(4, 'commands/tempvoice.js DBGuilds create 1');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: true, addTemporaryText: true });

				let guildPrefix = await getGuildPrefix(msg);

				if (msg.id) {
					return msg.reply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
				}
				return interaction.editReply(`Temporary channels have been enabled.\nAdd an \`➕\` to the start of your voicechannel to make it an creating channel.\nExample name: \`➕ Click to create\`\nText channels will be created alongside for all the members in the voices.\nTo disable this type \`${guildPrefix}tempvoice text disable\``);
			} else if (args[0] === 'disable') {
				//Create guild in db if it wasn't there yet
				logDatabaseQueries(4, 'commands/tempvoice.js DBGuilds create 2');
				DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: true });
				if (msg.id) {
					return msg.reply('Temporary channels have been disabled.');
				}
				return interaction.editReply('Temporary channels have been disabled.');
			} else if (args[0] === 'text') {
				if (args[1] === 'enable') {
					//Check permissions of the bot
					let member = null;

					try {
						member = await guild.members.fetch({ user: [msg.client.user.id], time: 300000 })
							.catch((err) => {
								throw new Error(err);
							});

						member = member.first();
					} catch (e) {
						if (e.message !== 'Error [GuildMembersTimeout]: Members didn\'t arrive in time.') {
							console.error('commands/tempvoice.js | text enable guild doesn\'t exist check bot permissions', e);
							return;
						}
					}

					const botPermissions = msg.channel.permissionsFor(member);
					if (!botPermissions.has('ADMINISTRATOR')) {
						if (msg.id) {
							return msg.reply('I need Administrator permissions to ensure the proper visibility of temporary text channels for only the relevant users!');
						}
						return interaction.editReply('I need Administrator permissions to ensure the proper visibility of temporary text channels for only the relevant users!');
					}

					//Create guild in db if it wasn't there yet
					logDatabaseQueries(4, 'commands/tempvoice.js DBGuilds create 3');
					DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: true });
					if (msg.id) {
						return msg.reply('Text channels will now be created alongside temporary voice channels.');
					}
					return interaction.editReply('Text channels will now be created alongside temporary voice channels.');
				} else if (args[1] === 'disable') {
					//Create guild in db if it wasn't there yet
					logDatabaseQueries(4, 'commands/tempvoice.js DBGuilds create 4');
					DBGuilds.create({ guildId: msg.guildId, guildName: msg.guild.name, temporaryVoices: false, addTemporaryText: false });
					if (msg.id) {
						return msg.reply('Text channels will NOT be created alongside temporary voice channels.');
					}
					return interaction.editReply('Text channels will NOT be created alongside temporary voice channels.');
				} else {
					//Create guild in db if it wasn't there yet
					logDatabaseQueries(4, 'commands/tempvoice.js DBGuilds create 5');
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