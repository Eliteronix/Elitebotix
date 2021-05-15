const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { getGuildPrefix, humanReadable, updateOsuDetailsforUser, getOsuUserServerMode, getMessageUserDisplayname, getOsuBadgeNumberById } = require('../utils');

module.exports = {
	name: 'osu-bws',
	// aliases: ['osu-player', 'osu-user', 'o-u', 'o-p'],
	description: 'Sends info about the BWS rank of the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces; Use --o/--t/--c/--m for modes)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	// botPermissions: 'ATTACH_FILES',
	// botPermissionsTranslated: 'Attach Files',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		const guildPrefix = getGuildPrefix(msg);

		const commandConfig = await getOsuUserServerMode(msg, args);
		const commandUser = commandConfig[0];
		const mode = commandConfig[2];

		if (!args[0]) {//Get profile by author if no argument

			if (commandUser && commandUser.osuUserId) {
				getProfile(msg, commandUser.osuUserId, mode);
			} else {
				const userDisplayName = await getMessageUserDisplayname(msg);
				getProfile(msg, userDisplayName, mode);
			}
		} else {
			//Get profiles by arguments
			for (let i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@') && args[i].endsWith('>')) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@', '').replace('>', '').replace('!', '') },
					});

					if (discordUser && discordUser.osuUserId) {
						getProfile(msg, discordUser.osuUserId, mode);
					} else {
						msg.channel.send(`\`${args[i].replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`${guildPrefix}osu-link <username>\`.`);
						getProfile(msg, args[i], mode);
					}
				} else {

					if (args.length === 1 && !(args[0].startsWith('<@')) && !(args[0].endsWith('>'))) {
						if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
							getProfile(msg, args[i], mode, true);
						} else {
							getProfile(msg, args[i], mode);
						}
					} else {
						getProfile(msg, args[i], mode);
					}
				}
			}
		}
	},
};

async function getProfile(msg, username, mode, noLinkedAccount) {
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

			const guildPrefix = getGuildPrefix(msg);

			let badgeAmount = await getOsuBadgeNumberById(user.id);

			const discordUser = await DBDiscordUsers.findOne({
				where: { osuUserId: user.id }
			});

			if (discordUser) {
				discordUser.osuBadges = badgeAmount;
				await discordUser.save();
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
				data.push(`Feel free to use \`${guildPrefix}osu-link ${user.name}\` to connect your account.`);
			}
			msg.channel.send(data, { split: true });
		})
		.catch(err => {
			if (err.message === 'Not found') {
				msg.channel.send(`Could not find user \`${username.replace(/`/g, '')}\`.`);
			} else {
				console.log(err);
			}
		});

}