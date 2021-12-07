const { populateMsgFromInteraction, getGuildPrefix, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');

module.exports = {
	name: 'name-sync',
	// aliases: ['osu-main'],
	description: 'Allows you to sync discord player names to ingame names (and ranks)',
	usage: '<disable/osuname/osunameandrank>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MANAGE_NICKNAMES],
	botPermissionsTranslated: 'Send Messages and Manage Nicknames',
	//guildOnly: true,
	args: true,
	cooldown: 10,
	//noCooldownMessage: true,
	tags: 'server-admin',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			args = [interaction.options._hoistedOptions[0].value];
		}

		if (args[0].toLowerCase() === 'disable') {
			logDatabaseQueries(4, 'commands/name-sync.js DBProcessQueue disable');
			let task = await DBProcessQueue.findOne({
				where: { guildId: msg.guild.id, task: 'nameSync' },
			});

			if (task) {
				task.destroy();
				if (msg.id) {
					return msg.reply('Name Sync Disabled.');
				}
				return interaction.reply({ content: 'Name Sync Disabled.', ephemeral: true });
			} else {
				if (msg.id) {
					return msg.reply('Name Sync is already disabled.');
				}
				return interaction.reply({ content: 'Name Sync is already disabled.', ephemeral: true });
			}
		} else if (args[0].toLowerCase() === 'osuname') {
			logDatabaseQueries(4, 'commands/name-sync.js DBProcessQueue osuname');
			let task = await DBProcessQueue.findOne({
				where: { guildId: msg.guild.id, task: 'nameSync' },
			});

			if (task && task.additions === 'osuname') {
				if (msg.id) {
					return msg.reply('Name Sync is already set to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.');
				}
				return interaction.reply({ content: 'Name Sync is already set to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', ephemeral: true });
			} else if (task) {
				let date = new Date();
				task.date = date;
				task.additions = 'osuname';
				task.beingExecuted = false;
				task.save();
				if (msg.id) {
					return msg.reply('Name Sync has been changed to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.');
				}
				return interaction.reply({ content: 'Name Sync has been changed to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', ephemeral: true });
			}

			let date = new Date();
			await DBProcessQueue.create({
				guildId: msg.guild.id,
				task: 'nameSync',
				additions: 'osuname',
				date: date,
				priority: 5
			});

			if (msg.id) {
				return msg.reply('Name Sync is now set to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.');
			}
			return interaction.reply({ content: 'Name Sync is now set to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', ephemeral: true });
		} else if (args[0].toLowerCase() === 'osunameandrank') {
			logDatabaseQueries(4, 'commands/name-sync.js DBProcessQueue osunameandrank');
			let task = await DBProcessQueue.findOne({
				where: { guildId: msg.guild.id, task: 'nameSync' },
			});

			if (task && task.additions === 'osunameandrank') {
				if (msg.id) {
					return msg.reply('Name Sync is already set to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.');
				}
				return interaction.reply({ content: 'Name Sync is already set to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', ephemeral: true });
			} else if (task) {
				let date = new Date();
				task.date = date;
				task.additions = 'osunameandrank';
				task.beingExecuted = false;
				task.save();
				if (msg.id) {
					return msg.reply('Name Sync has been changed to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.');
				}
				return interaction.reply({ content: 'Name Sync has been changed to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', ephemeral: true });
			}

			let date = new Date();
			await DBProcessQueue.create({
				guildId: msg.guild.id,
				task: 'nameSync',
				additions: 'osunameandrank',
				date: date,
				priority: 5
			});

			if (msg.id) {
				return msg.reply('Name Sync is now set to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.');
			}
			return interaction.reply({ content: 'Name Sync is now set to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', ephemeral: true });
		} else {
			let guildPrefix = await getGuildPrefix(msg);
			if (msg.id) {
				return msg.reply(`Please specify what the names should be synced to.\nCorrect usage: ${guildPrefix}${this.name} ${this.usage}`);
			}
			return interaction.reply({ content: `Please specify what the names should be synced to.\nCorrect usage: ${guildPrefix}${this.name} ${this.usage}`, ephemeral: true });
		}
	},
};