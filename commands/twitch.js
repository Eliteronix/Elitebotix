const { PermissionsBitField } = require('discord.js');
const { DBDiscordUsers } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');
const { logDatabaseQueries } = require('../utils');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { Op } = require('sequelize');

module.exports = {
	name: 'twitch',
	description: 'Allowes you to manage the twitch commands',
	// permissions: PermissionsBitField.Flags.MANAGE_GUILD,
	// permissionsTranslated: 'Manage Server',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		if (interaction.options._subcommand === 'connect') {
			logDatabaseQueries(2, 'twitch.js DBDiscordUsers connect');
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
				return await interaction.editReply('You don\'t have an osu! account linked and verified to your discord account. Please do so first by using </osu-link connect:1064502370710605836>. This is required as all twitch commands are linked to your osu! account.');
			}

			let twitchName = interaction.options.getString('username');

			if (twitchName.toLowerCase() === discordUser.twitchName && discordUser.twitchVerified) {
				return await interaction.editReply('Your twitch account is already connected and verified to this discord account.');
			}

			let existingLinkedAccount = await DBDiscordUsers.findOne({
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

			// eslint-disable-next-line no-undef
			let response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
				method: 'POST',
			});

			let json = await response.json();

			let accessToken = json.access_token;

			// Do a GET https://api.twitch.tv/helix/users?login=USERNAME
			response = await fetch(`https://api.twitch.tv/helix/users?login=${twitchName}`, {
				headers: {
					// eslint-disable-next-line no-undef
					'Client-ID': process.env.TWITCH_CLIENT_ID,
					// eslint-disable-next-line no-undef
					'Authorization': `Bearer ${accessToken}`
				}
			});

			if (response.status === 200) {
				let json = await response.json();
				if (json.data.length > 0) {
					discordUser.twitchName = json.data[0].login;
					discordUser.twitchId = json.data[0].id;
					await discordUser.save();

					await interaction.client.shard.broadcastEval(async (c, { channelName }) => {
						if (c.shardId === 0) {
							c.twitchClient.join(channelName);
						}
					}, { context: { channelName: discordUser.twitchName } });

					await interaction.editReply(`Your twitch account has been connected. To verify your twitch account, please type \`!verify ${interaction.user.username}#${interaction.user.discriminator}\` in your twitch chat.`);
				} else {
					await interaction.editReply('The twitch account you entered does not exist.');
				}
			} else {
				console.error(response);
				await interaction.editReply('There was an error connecting your twitch account. Please try again later.');
			}
		} else if (interaction.options._subcommand === 'disconnect') {
			logDatabaseQueries(2, 'twitch.js DBDiscordUsers disconnect');
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.twitchName) {
				return interaction.editReply('You don\'t have a twitch account linked to your discord account.');
			}

			discordUser.twitchName = null;
			discordUser.twitchId = null;
			discordUser.twitchVerified = false;
			await discordUser.save();

			await interaction.editReply('Your twitch account has been disconnected.');
		} else if (interaction.options._subcommand === 'togglemp') {
			logDatabaseQueries(2, 'twitch.js DBDiscordUsers togglemp');
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return await interaction.editReply('You don\'t have an osu! account linked to your discord account. Please do so by using </osu-link connect:1064502370710605836>');
			}

			if (!discordUser.twitchName) {
				return await interaction.editReply('You don\'t have a twitch account linked to your discord account. Use </feedback:1064502027591364649> with type `question` to request access.');
			}

			if (!discordUser.twitchVerified) {
				return await interaction.editReply(`Your twitch account is not verified. Please type \`!verify ${interaction.user.username}#${interaction.user.discriminator}\` in your twitch chat.`);
			}

			if (discordUser.twitchOsuMatchCommand) {
				discordUser.twitchOsuMatchCommand = false;
				await interaction.editReply('!mp is now disabled.');
			} else {
				discordUser.twitchOsuMatchCommand = true;
				interaction.editReply('!mp is now enabled. Be sure to mod or vip `Elitebotix` in your twitch channel.');
				await interaction.client.shard.broadcastEval(async (c, { channelName }) => {
					if (c.shardId === 0) {
						c.twitchClient.join(channelName);
					}
				}, { context: { channelName: discordUser.twitchName } });
			}
			discordUser.save();
		} else if (interaction.options._subcommand === 'togglemapsync') {
			logDatabaseQueries(2, 'twitch.js DBDiscordUsers togglemapsync');
			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.user.id
				}
			});

			if (!discordUser || !discordUser.osuUserId) {
				return await interaction.editReply('You don\'t have an osu! account linked to your discord account. Please do so by using </osu-link connect:1064502370710605836>');
			}

			if (!discordUser.twitchName) {
				return await interaction.editReply('You don\'t have a twitch account linked to your discord account. Use </feedback:1064502027591364649> with type `question` to request access.');
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
				await interaction.client.shard.broadcastEval(async (c, { channelName }) => {
					if (c.shardId === 0) {
						c.twitchClient.join(channelName);
					}
				}, { context: { channelName: discordUser.twitchName } });
			}
			await discordUser.save();
		}
	},
};