const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { Permissions } = require('discord.js');
const { humanReadable, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname, getOsuBadgeNumberById, getIDFromPotentialOsuLink, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');

module.exports = {
	name: 'osu-bws',
	// aliases: ['osu-player', 'osu-user', 'o-u', 'o-p'],
	description: 'Sends info about the BWS rank of the specified player',
	usage: '[username] [username] ... (Use `_` instead of spaces; Use `--s`/`--t`/`--c`/`--m` for modes)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Players are being processed');

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
							return msg.reply(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`/osu-link connect:<username>\`.`);
						}

						return interaction.followUp(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`/osu-link connect:<username>\`.`);
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

	osuApi.getUser({ u: username, m: mode })
		.then(async (user) => {
			updateOsuDetailsforUser(user, mode);

			let badgeAmount = await getOsuBadgeNumberById(user.id);

			logDatabaseQueries(4, 'commands/osu-bws.js DBDiscordUsers 2');
			const discordUser = await DBDiscordUsers.findOne({
				where: { osuUserId: user.id }
			});

			if (discordUser) {
				discordUser.osuBadges = badgeAmount;
				await discordUser.save();
			} else {
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
			if (noLinkedAccount) {
				data.push(`Feel free to use \`/osu-link connect:${user.name}\` to connect your account.`);
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
				console.log(err);
			}
		});

}