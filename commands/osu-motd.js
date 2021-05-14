const { DBDiscordUsers } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'osu-motd',
	aliases: ['motd'],
	description: 'Allows you to join the `Maps of the Day` competition!',
	usage: '<server/register/unregister/mute/unmute>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 10,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		if (args[0].toLowerCase() === 'server') {
			sendMessage(msg, 'The discord server for the competition can be found here: <https://discord.com/invite/Asz5Gfe>\nAfter joining be sure to head to <#801000891750547496> and assign yourself the MOTD role!\nEverything else will be done automatically when you registered!');
		} else if (args[0].toLowerCase() === 'register') {
			const guildPrefix = await getGuildPrefix(msg);

			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuUserId) {
				if (discordUser.osuMOTDRegistered) {
					return sendMessage(msg, `You are already registered for the \`Maps of the Day\` competition.\nBe sure to join the server if you didn't already. (\`${guildPrefix}osu-motd server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the competition!`);
				}
				if (discordUser.osuVerified) {
					discordUser.osuMOTDRegistered = true;
					discordUser.save();
					sendMessage(msg, `You successfully registered for the \`Maps of the Day\` competition.\nBe sure to join the server and read <#834833321438740490> if you didn't already. (\`${guildPrefix}osu-motd server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the competition!`);
				} else {
					sendMessage(msg, `It seems like you don't have your connected osu! account verified.\nPlease use \`${guildPrefix}osu-link verify\` to send a verification code to your osu! dms, follow the instructions and try again afterwards.`);
				}
			} else {
				sendMessage(msg, `It seems like you don't have your osu! account connected to the bot.\nPlease use \`${guildPrefix}osu-link osu-username\` to connect you account and verify it.`);
			}
		} else if (args[0].toLowerCase() === 'unregister') {
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuMOTDRegistered) {
				discordUser.osuMOTDRegistered = false;
				discordUser.save();
				sendMessage(msg, 'You have been unregistered from the `Maps of the Day` competition.\nStill thank you for showing interest!\nYou can always register again by using `e!osu-motd register`!');
			} else {
				sendMessage(msg, 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `e!osu-motd register`!');
			}
		} else if (args[0].toLowerCase() === 'mute') {
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuMOTDRegistered) {
				if (discordUser.osuMOTDMuted) {
					sendMessage(msg, 'The `Maps of the Day` competition has already been muted for you.\nTo receive messages and pings again use `e!osu-motd unmute`.');
				} else {
					discordUser.osuMOTDMuted = true;
					discordUser.save();
					sendMessage(msg, 'The `Maps of the Day` competition has been muted for you. You will not receive messages and pings anymore but will still appear on the leaderboard.\nTo receive messages and pings again use `e!osu-motd unmute`.');
				}
			} else {
				sendMessage(msg, 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `e!osu-motd register`!');
			}
		} else if (args[0].toLowerCase() === 'unmute') {
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuMOTDRegistered) {
				if (discordUser.osuMOTDMuted) {
					discordUser.osuMOTDMuted = false;
					discordUser.save();
					sendMessage(msg, 'The `Maps of the Day` competition has been unmuted for you. You will start receiving messages again.');
				} else {
					sendMessage(msg, 'The `Maps of the Day` competition has never been muted for you.');
				}
			} else {
				sendMessage(msg, 'You aren\'t signed up for the `Maps of the Day` competition at the moment.\nYou can always register by using `e!osu-motd register`!');
			}
		} else {
			msg.channel.send('Please specify what you want to do: `server`, `register`, `unregister`, `mute`, `unmute`');
		}
	},
};

function sendMessage(msg, content) {
	msg.author.send(content)
		.then(() => {
			if (msg.channel.type === 'dm') return;
			msg.reply('I\'ve sent you a DM with some info!');
		})
		.catch(() => {
			msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
		});
}