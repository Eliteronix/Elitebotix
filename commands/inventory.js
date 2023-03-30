const { PermissionsBitField } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { SlashCommandBuilder } = require('discord.js');
const { logDatabaseQueries } = require('../utils');
const { DBDiscordUsers, DBInventory } = require('../dbObjects');

module.exports = {
	name: 'inventory',
	description: 'Manage and view your inventory',
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setNameLocalizations({
			'de': 'inventar',
			'en-GB': 'inventory',
			'en-US': 'inventory',
		})
		.setDescription('Manage and view your inventory')
		.setDescriptionLocalizations({
			'de': 'Verwalte und sehe deinen Inventar an',
			'en-GB': 'Manage and view your inventory',
			'en-US': 'Manage and view your inventory',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand.setName('view')
				.setNameLocalizations({
					'de': 'ansehen',
					'en-GB': 'view',
					'en-US': 'view',
				})
				.setDescription('View your inventory')
				.setDescriptionLocalizations({
					'de': 'Sehe deinen Inventar an',
					'en-GB': 'View your inventory',
					'en-US': 'View your inventory',
				})
		)
		.addSubcommand(subcommand =>
			subcommand.setName('toggle')
				.setNameLocalizations({
					'de': 'umschalten',
					'en-GB': 'toggle',
					'en-US': 'toggle',
				})
				.setDescription('Toggle the item in your inventory')
				.setDescriptionLocalizations({
					'de': 'Schalte das Item in deinem Inventar um',
					'en-GB': 'Toggle the item in your inventory',
					'en-US': 'Toggle the item in your inventory',
				})
				.addNumberOption(option =>
					option.setName('item')
						.setNameLocalizations({
							'de': 'item',
							'en-GB': 'item',
							'en-US': 'item',
						})
						.setDescription('The item you want to toggle')
						.setDescriptionLocalizations({
							'de': 'Das Item, das du umschalten willst',
							'en-GB': 'The item you want to toggle',
							'en-US': 'The item you want to toggle',
						})
						.setRequired(true)
						.setMinValue(1)
						.setMaxValue(100)
				)
		),
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction) {
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

		logDatabaseQueries(4, 'commands/osu-battlepass.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuVerified', 'osuName'],
			where: {
				userId: interaction.user.id
			}
		});

		if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
			return await interaction.editReply('Please connect and verify your account first by using </osu-link connect:1064502370710605836>.');
		}

		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'view') {
			logDatabaseQueries(4, 'commands/inventory.js DBInventory view');
			let inventory = await DBInventory.findAll({
				attributes: ['item', 'property', 'amount', 'active'],
				where: {
					osuUserId: discordUser.osuUserId,
				},
			});

			if (!inventory || inventory.length === 0) {
				return await interaction.editReply('Your inventory is empty.');
			}

			let embed = {
				color: 0x0099ff,
				title: 'Inventory',
				description: `You have ${inventory.length} item(s) in your inventory.`,
				fields: [],
				timestamp: new Date(),
				footer: {
					text: 'Inventory',
				},
			};

			for (let i = 0; i < inventory.length; i++) {
				if (embed.fields.length === 25) {
					await interaction.followUp({ ephemeral: true, embeds: [embed] });
					embed.fields = [];
				}

				embed.fields.push({
					name: `${i + 1}. ${inventory[i].item} | ${inventory[i].property}`,
					value: `Amount: ${inventory[i].amount}\nActive: ${inventory[i].active ? 'Yes' : 'No'}`,
					inline: false,
				});
			}

			await interaction.followUp({ ephemeral: true, embeds: [embed] });
		} else if (subcommand === 'toggle') {
			const item = interaction.options.getNumber('item');

			logDatabaseQueries(4, 'commands/inventory.js DBInventory toggle');
			let inventory = await DBInventory.findAll({
				attributes: ['id', 'item', 'property', 'amount', 'active'],
				where: {
					osuUserId: discordUser.osuUserId,
				},
			});

			if (!inventory || inventory.length === 0) {
				return await interaction.editReply('Your inventory is empty.');
			}

			if (item > inventory.length) {
				return await interaction.editReply('The item you want to toggle does not exist.');
			}

			inventory = inventory[item - 1];

			if (inventory.item === 'profile border') {
				await DBInventory.update({
					active: false,
				}, {
					where: {
						osuUserId: discordUser.osuUserId,
						item: 'profile border',
					},
				});
			}

			inventory.active = !inventory.active;

			await inventory.save();

			await interaction.editReply(`You have ${inventory.active ? 'activated' : 'deactivated'} the item **${inventory.item} | ${inventory.property}**.`);
		}
	},
};