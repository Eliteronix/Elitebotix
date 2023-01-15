const { DBDiscordUsers } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-set',
	description: 'Allows you to set your main mode and server',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 10,
	tags: 'osu',
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
			try {
				await interaction.deferReply({ ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				return;
			}

			msg = await populateMsgFromInteraction(interaction);

			args = [interaction.options._subcommand, interaction.options._hoistedOptions[0].value];
		}

		//get discordUser from db
		logDatabaseQueries(4, 'commands/osu-set.js DBDiscordUsers');
		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: msg.author.id },
		});

		if (args[0].toLowerCase() === 'server') {
			if (args[1] && args[1].toLowerCase() === 'bancho') {
				if (discordUser) {
					discordUser.osuMainServer = 'bancho';
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainServer: 'bancho' });
				}

				if (msg.id) {
					return msg.reply('Bancho has been set as your main server.');
				}
				return interaction.followUp({ content: 'Bancho has been set as your main server.', ephemeral: true });
			} else if (args[1] && args[1].toLowerCase() === 'ripple') {
				if (discordUser) {
					discordUser.osuMainServer = 'ripple';
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainServer: 'ripple' });
				}

				if (msg.id) {
					return msg.reply('Ripple has been set as your main server.');
				}
				return interaction.followUp({ content: 'Ripple has been set as your main server.', ephemeral: true });
			} else {
				if (msg.id) {
					return msg.reply('Please specify which server you want to set as your main server: `bancho`, `ripple`');
				}
				return interaction.followUp({ content: 'Please specify which server you want to set as your main server: `bancho`, `ripple`', ephemeral: true });
			}
		} else if (args[0].toLowerCase() === 'mode') {
			if (args[1] && args[1].toLowerCase() === 'standard') {
				if (discordUser) {
					discordUser.osuMainMode = 0;
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainMode: 0 });
				}

				if (msg.id) {
					return msg.reply('Standard has been set as your main mode.');
				}
				return interaction.followUp({ content: 'Standard has been set as your main mode.', ephemeral: true });
			} else if (args[1] && args[1].toLowerCase() === 'taiko') {
				if (discordUser) {
					discordUser.osuMainMode = 1;
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainMode: 1 });
				}

				if (msg.id) {
					return msg.reply('Taiko has been set as your main mode.');
				}
				return interaction.followUp({ content: 'Taiko has been set as your main mode.', ephemeral: true });
			} else if (args[1] && args[1].toLowerCase() === 'catch') {
				if (discordUser) {
					discordUser.osuMainMode = 2;
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainMode: 2 });
				}

				if (msg.id) {
					return msg.reply('Catch has been set as your main mode.');
				}
				return interaction.followUp({ content: 'Catch has been set as your main mode.', ephemeral: true });
			} else if (args[1] && args[1].toLowerCase() === 'mania') {
				if (discordUser) {
					discordUser.osuMainMode = 3;
					discordUser.save();
				} else {
					DBDiscordUsers.create({ userId: msg.author.id, osuMainMode: 3 });
				}

				if (msg.id) {
					return msg.reply('Mania has been set as your main mode.');
				}
				return interaction.followUp({ content: 'Mania has been set as your main mode.', ephemeral: true });
			} else {
				if (msg.id) {
					return msg.reply('Please specify which mode you want to set as your main mode: `standard`, `taiko`, `catch`, `mania`');
				}
				return interaction.followUp({ content: 'Please specify which mode you want to set as your main mode: `standard`, `taiko`, `catch`, `mania`', ephemeral: true });
			}
		} else {
			if (msg.id) {
				return msg.reply('Please specify what you want to change: `mode`, `server`');
			}
			return interaction.followUp({ content: 'Please specify what you want to change: `mode`, `server`', ephemeral: true });
		}
	},
};