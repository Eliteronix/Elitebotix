const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { humanReadable, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname, getIDFromPotentialOsuLink, populateMsgFromInteraction, logDatabaseQueries, getAdditionalOsuInfo } = require('../utils');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-bws',
	description: 'Sends info about the BWS rank of the specified player',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-bws')
		.setNameLocalizations({
			'de': 'osu-bws',
			'en-GB': 'osu-bws',
			'en-US': 'osu-bws',
		})
		.setDescription('Sends info about the BWS rank of the specified player')
		.setDescriptionLocalizations({
			'de': 'Sendet Informationen über den BWS-Rang des angegebenen Spielers',
			'en-GB': 'Sends info about the BWS rank of the specified player',
			'en-US': 'Sends info about the BWS rank of the specified player',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('username')
				.setNameLocalizations({
					'de': 'nutzername',
					'en-GB': 'username',
					'en-US': 'username',
				})
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username2')
				.setNameLocalizations({
					'de': 'nutzername2',
					'en-GB': 'username2',
					'en-US': 'username2',
				})
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username3')
				.setNameLocalizations({
					'de': 'nutzername3',
					'en-GB': 'username3',
					'en-US': 'username3',
				})
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username4')
				.setNameLocalizations({
					'de': 'nutzername4',
					'en-GB': 'username4',
					'en-US': 'username4',
				})
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username5')
				.setNameLocalizations({
					'de': 'nutzername5',
					'en-GB': 'username5',
					'en-US': 'username5',
				})
				.setDescription('The username, id or link of the player to calculate')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers, der berechnet werden soll',
					'en-GB': 'The username, id or link of the player to calculate',
					'en-US': 'The username, id or link of the player to calculate',
				})
				.setRequired(false)
		),
	async execute(msg, args, interaction) {
		//TODO: Remove message code and replace with interaction code
		if (interaction) {
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

			msg = await populateMsgFromInteraction(interaction);

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}
		}

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		const mode = commandConfig[2];

		if (!args[0]) {//Get profile by author if no argument

			if (commandUser && commandUser.osuUserId) {
				getProfile(msg, interaction, commandUser.osuUserId, mode);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getProfile(msg, interaction, userDisplayName, mode);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					logDatabaseQueries(4, 'commands/osu-bws.js DBDiscordUsers 1');
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getProfile(msg, interaction, discordUser.osuUserId, mode);
					} else {
						if (msg.id) {
							return msg.reply(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:1064502370710605836>.`);
						}

						return interaction.followUp(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:1064502370710605836>.`);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getProfile(msg, interaction, getIDFromPotentialOsuLink(args[i]), mode, true);
						} else {
							getProfile(msg, interaction, getIDFromPotentialOsuLink(args[i]), mode);
						}
					} else {
						getProfile(msg, interaction, getIDFromPotentialOsuLink(args[i]), mode);
					}
				}
			}
		}
	},
};

async function getProfile(msg, interaction, username, mode, noLinkedAccount) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	// eslint-disable-next-line no-undef
	process.send('osu!API');
	osuApi.getUser({ u: username, m: mode })
		.then(async (user) => {
			updateOsuDetailsforUser(user, mode);

			let additionalInfo = await getAdditionalOsuInfo(user.id);

			let badgeAmount = additionalInfo.tournamentBadges.length;

			logDatabaseQueries(4, 'commands/osu-bws.js DBDiscordUsers 2');
			const discordUser = await DBDiscordUsers.findOne({
				where: { osuUserId: user.id }
			});

			if (discordUser) {
				discordUser.osuBadges = badgeAmount;
				await discordUser.save();
			} else {
				logDatabaseQueries(4, 'commands/osu-bws.js DBDiscordUsers create');
				DBDiscordUsers.create({ osuName: user.name, osuUserId: user.id });
			}

			let BWSRank = Math.round(Math.pow(user.pp.rank, Math.pow(0.9937, Math.pow(badgeAmount, 2))));

			let data = [];
			data.push(`${user.name} is rank #${humanReadable(user.pp.rank)}`);
			if (badgeAmount > 0) {
				data.push(`${user.name} has ${badgeAmount} badges.`);
				data.push(`Using \`rank^(0.9937^(badges^2))\` their BWS rank is #${humanReadable(BWSRank)}`);
			} else {
				data.push(`${user.name} has ${badgeAmount} badges and their rank will therefore stay the same using BWS.`);
			}

			logDatabaseQueries(4, 'commands/osu-bws.js DBDiscordUsers linkedUser');
			const linkedUser = await DBDiscordUsers.findOne({
				where: { osuUserId: user.id }
			});

			if (linkedUser && linkedUser.userId) {
				noLinkedAccount = false;
			}

			if (noLinkedAccount) {
				data.push('Feel free to use </osu-link connect:1064502370710605836> to connect your account.');
			}
			if (msg.id) {
				return msg.reply(data.join('\n'), { split: true });
			}
			return interaction.followUp(data.join('\n'), { split: true });
		})
		.catch(err => {
			if (err.message === 'Not found') {
				if (msg.id) {
					return msg.reply(`Could not find user \`${username.replace(/`/g, '')}\`.`);
				}
				return interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
			} else {
				console.error(err);
			}
		});

}