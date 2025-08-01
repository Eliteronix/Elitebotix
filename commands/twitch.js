const { PermissionsBitField, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { DBDiscordUsers, DBElitebotixBanchoProcessQueue } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Op } = require('sequelize');

module.exports = {
	name: 'twitch',
	description: 'Allowes you to manage the twitch commands',
	integration_types: [0, 1], // 0 for guild, 1 for user
	contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('twitch')
		.setNameLocalizations({
			'de': 'twitch',
			'en-GB': 'twitch',
			'en-US': 'twitch',
		})
		.setDescription('Allows control of the twitch integration')
		.setDescriptionLocalizations({
			'de': 'Erlaubt die Kontrolle der Twitch-Integration',
			'en-GB': 'Allows control of the twitch integration',
			'en-US': 'Allows control of the twitch integration',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('connect')
				.setNameLocalizations({
					'de': 'verbinden',
					'en-GB': 'connect',
					'en-US': 'connect',
				})
				.setDescription('Allows you to connect your twitch account to the bot')
				.setDescriptionLocalizations({
					'de': 'Erlaubt es dir, dein Twitch-Konto mit dem Bot zu verbinden',
					'en-GB': 'Allows you to connect your twitch account to the bot',
					'en-US': 'Allows you to connect your twitch account to the bot',
				})
				.addStringOption(option =>
					option
						.setName('username')
						.setNameLocalizations({
							'de': 'nutzername',
							'en-GB': 'username',
							'en-US': 'username',
						})
						.setDescription('Your twitch name as found in your URL')
						.setDescriptionLocalizations({
							'de': 'Dein Twitch-Name, wie er in deiner URL zu finden ist',
							'en-GB': 'Your twitch name as found in your URL',
							'en-US': 'Your twitch name as found in your URL',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disconnect')
				.setNameLocalizations({
					'de': 'trennen',
					'en-GB': 'disconnect',
					'en-US': 'disconnect',
				})
				.setDescription('Removes the currently connected twitch account')
				.setDescriptionLocalizations({
					'de': 'Entfernt das aktuell verbundene Twitch-Konto',
					'en-GB': 'Removes the currently connected twitch account',
					'en-US': 'Removes the currently connected twitch account',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('togglemp')
				.setNameLocalizations({
					'de': 'mpeinausschalten',
					'en-GB': 'togglemp',
					'en-US': 'togglemp',
				})
				.setDescription('Toggle the !mp command')
				.setDescriptionLocalizations({
					'de': 'Schaltet den !mp-Befehl ein oder aus',
					'en-GB': 'Toggle the !mp command',
					'en-US': 'Toggle the !mp command',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('togglemapsync')
				.setNameLocalizations({
					'de': 'mapsynceinausschalten',
					'en-GB': 'togglemapsync',
					'en-US': 'togglemapsync',
				})
				.setDescription('Toggle the twitch to osu! map sync')
				.setDescriptionLocalizations({
					'de': 'Schaltet die Synchronisation der maps zwischen Twitch und osu! ein oder aus',
					'en-GB': 'Toggle the twitch to osu! map sync',
					'en-US': 'Toggle the twitch to osu! map sync',
				})
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

		if (interaction.options.getSubcommand() === 'connect') {
			const discordUser = await DBDiscordUsers.findOne({
				attributes: ['id', 'twitchName', 'twitchId', 'twitchVerified', 'osuUserId', 'osuVerified'],
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
				return await interaction.editReply(`You don't have an osu! account linked and verified to your discord account. Please do so first by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>. This is required as all twitch commands are linked to your osu! account.`);
			}

			let twitchName = interaction.options.getString('username');

			if (twitchName.toLowerCase() === discordUser.twitchName && discordUser.twitchVerified) {
				return await interaction.editReply('Your twitch account is already connected and verified to this discord account.');
			}

			let existingLinkedAccount = await DBDiscordUsers.findOne({
				attributes: ['id'],
				where: {
					twitchName: twitchName.toLowerCase(),
					twitchVerified: true,
					userId: {
						[Op.not]: interaction.user.id
					}
				}
			});

			if (existingLinkedAccount) {
				return await interaction.editReply('This twitch account is already linked to another discord account. If this is you and you want to link your twitch account to this discord account, please disconnect your twitch account from the other discord account first.');
			}

			let response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
				method: 'POST',
			});

			let json = await response.json();

			let accessToken = json.access_token;

			// Do a GET https://api.twitch.tv/helix/users?login=USERNAME
			response = await fetch(`https://api.twitch.tv/helix/users?login=${twitchName}`, {
				headers: {
					'Client-ID': process.env.TWITCH_CLIENT_ID,
					'Authorization': `Bearer ${accessToken}`
				}
			});

			if (response.status === 200) {
				let json = await response.json();
				if (json.data.length > 0) {
					discordUser.twitchName = json.data[0].login;
					discordUser.twitchId = json.data[0].id;
					await discordUser.save();

					await DBElitebotixBanchoProcessQueue.create({
						task: 'joinTwitchChannel',
						additions: discordUser.twitchName,
						date: new Date(),
					});

					await interaction.editReply(`Your twitch account has been connected. To verify your twitch account, please type \`!verify ${interaction.user.username}#${interaction.user.discriminator}\` in your twitch chat.`);
				} else {
					await interaction.editReply('The twitch account you entered does not exist.');
				}
			} else {
				console.error(response);
				await interaction.editReply('There was an error connecting your twitch account. Please try again later.');
			}
		} else if (interaction.options.getSubcommand() === 'disconnect') {
			const discordUser = await DBDiscordUsers.findOne({
				attributes: ['id', 'twitchName', 'twitchId', 'twitchVerified'],
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.twitchName) {
				return await interaction.editReply('You don\'t have a twitch account linked to your discord account.');
			}

			discordUser.twitchName = null;
			discordUser.twitchId = null;
			discordUser.twitchVerified = false;
			await discordUser.save();

			await interaction.editReply('Your twitch account has been disconnected.');
		} else if (interaction.options.getSubcommand() === 'togglemp') {
			const discordUser = await DBDiscordUsers.findOne({
				attributes: ['id', 'twitchName', 'twitchOsuMatchCommand', 'osuUserId', 'twitchVerified'],
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return await interaction.editReply(`You don't have an osu! account linked to your discord account. Please do so by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>`);
			}

			if (!discordUser.twitchName) {
				return await interaction.editReply(`You don't have a twitch account linked to your discord account. Use </feedback:${interaction.client.slashCommandData.find(command => command.name === 'feedback').id}> with type \`question\` to request access.`);
			}

			if (!discordUser.twitchVerified) {
				return await interaction.editReply(`Your twitch account is not verified. Please type \`!verify ${interaction.user.username}#${interaction.user.discriminator}\` in your twitch chat.`);
			}

			if (discordUser.twitchOsuMatchCommand) {
				discordUser.twitchOsuMatchCommand = false;
				await interaction.editReply('!mp is now disabled.');
			} else {
				discordUser.twitchOsuMatchCommand = true;
				await interaction.editReply('!mp is now enabled. Be sure to mod or vip `Elitebotix` in your twitch channel.');

				await DBElitebotixBanchoProcessQueue.create({
					task: 'joinTwitchChannel',
					additions: discordUser.twitchName,
					date: new Date(),
				});
			}
			discordUser.save();
		} else if (interaction.options.getSubcommand() === 'togglemapsync') {
			const discordUser = await DBDiscordUsers.findOne({
				attributes: ['id', 'twitchName', 'twitchOsuMapSync', 'osuUserId', 'twitchVerified'],
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return await interaction.editReply(`You don't have an osu! account linked to your discord account. Please do so by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>`);
			}

			if (!discordUser.twitchName) {
				return await interaction.editReply(`You don't have a twitch account linked to your discord account. Use </feedback:${interaction.client.slashCommandData.find(command => command.name === 'feedback').id}> with type \`question\` to request access.`);
			}

			if (!discordUser.twitchVerified) {
				return await interaction.editReply(`Your twitch account is not verified. Please type \`!verify ${interaction.user.username}#${interaction.user.discriminator}\` in your twitch chat.`);
			}

			if (discordUser.twitchOsuMapSync) {
				discordUser.twitchOsuMapSync = false;
				await interaction.editReply('Twitch-Mapsync is now disabled.');
			} else {
				discordUser.twitchOsuMapSync = true;
				await interaction.editReply('Twitch-Mapsync is now enabled. Be sure to mod or vip `Elitebotix` in your twitch channel.');

				await DBElitebotixBanchoProcessQueue.create({
					task: 'joinTwitchChannel',
					additions: discordUser.twitchName,
					date: new Date(),
				});
			}
			await discordUser.save();
		}
	},
};