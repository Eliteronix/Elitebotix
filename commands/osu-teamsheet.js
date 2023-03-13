const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError, developers } = require('../config.json');
const { DBDiscordUsers, DBOsuMappools } = require('../dbObjects');
const { pause } = require('../utils');

const discordUsers = {};
const userMappools = [];

module.exports = {
	name: 'osu-teamsheet',
	description: 'Allows you to create a teamsheet for your team',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-teamsheet')
		.setNameLocalizations({
			'de': 'osu-teamsheet',
			'en-GB': 'osu-teamsheet',
			'en-US': 'osu-teamsheet',
		})
		.setDescription('Allows you to create a teamsheet for your team')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir, eine Teamsheet für dein Team zu erstellen',
			'en-GB': 'Allows you to create a teamsheet for your team',
			'en-US': 'Allows you to create a teamsheet for your team',
		})
		.setDMPermission(true)
		.addNumberOption(option =>
			option.setName('teamsize')
				.setNameLocalizations({
					'de': 'teamsize',
					'en-GB': 'teamsize',
					'en-US': 'teamsize',
				})
				.setDescription('The amount of people playing per map')
				.setDescriptionLocalizations({
					'de': 'Die Anzahl der Spieler pro Map',
					'en-GB': 'The amount of people playing per map',
					'en-US': 'The amount of people playing per map',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('players')
				.setNameLocalizations({
					'de': 'spieler',
					'en-GB': 'players',
					'en-US': 'players',
				})
				.setDescription('The players in your team seperated by a comma')
				.setDescriptionLocalizations({
					'de': 'Die Spieler in deinem Team getrennt durch ein Komma',
					'en-GB': 'The players in your team seperated by a comma',
					'en-US': 'The players in your team seperated by a comma',
				})
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('mappool')
				.setNameLocalizations({
					'de': 'mappool',
					'en-GB': 'mappool',
					'en-US': 'mappool',
				})
				.setDescription('The pre-created mappool with /osu-mappool')
				.setDescriptionLocalizations({
					'de': 'Der vorher erstellte Mappool mit /osu-mappool',
					'en-GB': 'The pre-created mappool with /osu-mappool',
					'en-US': 'The pre-created mappool with /osu-mappool',
				})
				.setRequired(true)
				.setAutocomplete(true)
		),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();

		let gotResponse = false;

		let cachedUser = discordUsers[interaction.user.id];

		if (!cachedUser) {
			let discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
				return await interaction.respond({
					name: 'You need to link your osu! account first!',
					value: 'You need to link your osu! account first!',
				});
			}

			discordUsers[interaction.user.id] = discordUser.osuUserId;
			cachedUser = discordUser.osuUserId;
		}

		setTimeout(async () => {
			if (!gotResponse) {
				let filtered = userMappools.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()) && choice.creatorId === cachedUser);

				filtered = filtered.slice(0, 25);

				if (filtered.length === 0) {
					try {
						await interaction.respond([{
							name: 'No results found | Create a mappool with /osu-mappool',
							value: 'No results found | Create a mappool with /osu-mappool',
						}]);
					} catch (error) {
						if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
							console.error(error);
						}
					}
					return;
				}

				try {
					await interaction.respond(
						filtered.map(choice => ({ name: choice.name, value: choice.name })),
					);
				} catch (error) {
					if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
						console.error(error);
					}
				}
			}
		}, 2500);

		const mappools = await DBOsuMappools.findAll({
			attributes: ['name'],
			where: {
				creatorId: cachedUser,
			},
			group: ['name'],
		});

		await pause(5000);

		mappools.forEach(mappool => {
			if (!userMappools.find(m => m.name === mappool.name && m.creatorId === cachedUser)) {
				userMappools.push({
					name: mappool.name,
					creatorId: cachedUser,
				});
			}
		});

		let filtered = mappools.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));

		filtered = filtered.slice(0, 25);

		if (filtered.length === 0) {
			try {
				await interaction.respond([{
					name: 'No results found | Create a mappool with /osu-mappool',
					value: 'No results found | Create a mappool with /osu-mappool',
				}]);

				gotResponse = true;
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
					console.error(error);
				}
			}
			return;
		}

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice.name, value: choice.name })),
			);

			gotResponse = true;
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction' && error.message !== 'The reply to this interaction has already been sent or deferred.') {
				console.error(error);
			}
		}
	},
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		if (!developers.includes(interaction.user.id)) {
			try {
				return await interaction.reply({ content: 'Only developers may use this command at the moment. As soon as development is finished it will be made public.', ephemeral: true });
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}
		}
	},
};