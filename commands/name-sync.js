const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { DBProcessQueue } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'name-sync',
	description: 'Allows you to sync discord player names to ingame names (and ranks)',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageNicknames],
	botPermissionsTranslated: 'Send Messages and Manage Nicknames',
	cooldown: 10,
	tags: 'server-admin',
	data: new SlashCommandBuilder()
		.setName('name-sync')
		.setNameLocalizations({
			'de': 'namen-sync',
			'en-GB': 'name-sync',
			'en-US': 'name-sync',
		})
		.setDescription('Allows you to sync discord player names to ingame names (and ranks)')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir, Discord-Spielernamen mit Ingame-Namen (und Rängen) zu synchronisieren',
			'en-GB': 'Allows you to sync discord player names to ingame names (and ranks)',
			'en-US': 'Allows you to sync discord player names to ingame names (and ranks)',
		})
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
		.addStringOption(option =>
			option.setName('setting')
				.setNameLocalizations({
					'de': 'einstellung',
					'en-GB': 'setting',
					'en-US': 'setting',
				})
				.setDescription('The setting for the name sync')
				.setDescriptionLocalizations({
					'de': 'Die Einstellung für die Namenssynchronisierung',
					'en-GB': 'The setting for the name sync',
					'en-US': 'The setting for the name sync',
				})
				.setRequired(true)
				.addChoices({ name: 'disable', value: 'disable' },
					{ name: 'osu! name', value: 'osuname' },
					{ name: 'osu! name and rank', value: 'osunameandrank' }
				)
		),
	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let setting = interaction.options.getString('setting');

		if (setting === 'disable') {
			let task = await DBProcessQueue.findOne({
				attributes: ['id'],
				where: {
					guildId: interaction.guild.id,
					task: 'nameSync'
				},
			});

			if (task) {
				task.destroy();
				return interaction.followUp({ content: 'Name Sync Disabled.', flags: MessageFlags.Ephemeral });
			} else {
				return interaction.followUp({ content: 'Name Sync is already disabled.', flags: MessageFlags.Ephemeral });
			}
		} else if (setting === 'osuname') {
			let task = await DBProcessQueue.findOne({
				attributes: ['id', 'additions', 'date', 'beingExecuted'],
				where: {
					guildId: interaction.guild.id,
					task: 'nameSync'
				},
			});

			if (task && task.additions === 'osuname') {
				return interaction.followUp({ content: 'Name Sync is already set to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', flags: MessageFlags.Ephemeral });
			} else if (task) {
				let date = new Date();
				task.date = date;
				task.additions = 'osuname';
				task.beingExecuted = false;
				task.save();

				return interaction.followUp({ content: 'Name Sync has been changed to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', flags: MessageFlags.Ephemeral });
			}

			let date = new Date();
			await DBProcessQueue.create({
				guildId: interaction.guild.id,
				task: 'nameSync',
				additions: 'osuname',
				date: date,
				priority: 5
			});

			return interaction.followUp({ content: 'Name Sync is now set to osu! name.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', flags: MessageFlags.Ephemeral });
		} else if (setting === 'osunameandrank') {
			let task = await DBProcessQueue.findOne({
				attributes: ['id', 'additions', 'date', 'beingExecuted'],
				where: {
					guildId: interaction.guild.id,
					task: 'nameSync'
				},
			});

			if (task && task.additions === 'osunameandrank') {
				return interaction.followUp({ content: 'Name Sync is already set to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', flags: MessageFlags.Ephemeral });
			} else if (task) {
				let date = new Date();
				task.date = date;
				task.additions = 'osunameandrank';
				task.beingExecuted = false;
				task.save();

				return interaction.followUp({ content: 'Name Sync has been changed to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', flags: MessageFlags.Ephemeral });
			}

			let date = new Date();
			await DBProcessQueue.create({
				guildId: interaction.guild.id,
				task: 'nameSync',
				additions: 'osunameandrank',
				date: date,
				priority: 5
			});

			return interaction.followUp({ content: 'Name Sync is now set to osu! name and rank.\nBe sure to have the bot role above all other roles or else the bot won\'t be able to edit the nicknames.', flags: MessageFlags.Ephemeral });
		}
	},
};